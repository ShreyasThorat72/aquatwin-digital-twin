import os
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.ensemble import IsolationForest
from app.database.database import get_db_connection

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml_models", "anomaly_detector.pkl"))

class AnomalyDetector:
    def __init__(self):
        self.model = None
        self.is_trained = False
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                self.is_trained = True
            except Exception as e:
                print(f"[ML Anomaly] Failed to load model: {e}")

    def save_model(self):
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)

    def train(self, contamination=0.1):
        conn = get_db_connection()
        df = pd.read_sql_query("SELECT distance_cm, water_height_cm, water_level_percent FROM telemetry ORDER BY id DESC LIMIT 500", conn)
        conn.close()

        if len(df) < 10:
            return False, f"INSUFFICIENT DATA: Need at least 10 records for IsolationForest, have {len(df)}"

        df['rate_of_change'] = df['water_level_percent'].diff().fillna(0)
        X = df[['water_level_percent', 'distance_cm', 'rate_of_change']]

        iso = IsolationForest(contamination=contamination, random_state=42)
        iso.fit(X)

        self.model = iso
        self.is_trained = True
        self.save_model()
        return True, "IsolationForest trained successfully"

    def detect(self, water_level_percent: float, distance_cm: float, rate_of_change: float = 0.0):
        """Returns (is_anomaly, score, reason)."""
        # Rule check first (impossible distance or level)
        if distance_cm < 0 or distance_cm > 500 or water_level_percent < 0 or water_level_percent > 100:
            return True, -0.9, "Out of range sensor value (physics bounds violation)"

        if abs(rate_of_change) > 25.0:
            return True, -0.85, f"Unusual sudden level shift ({rate_of_change:+.1f}%/s)"

        if self.is_trained and self.model is not None:
            X_input = pd.DataFrame([{
                'water_level_percent': water_level_percent,
                'distance_cm': distance_cm,
                'rate_of_change': rate_of_change
            }])
            pred = self.model.predict(X_input)[0] # -1 for anomaly, 1 for normal
            score = float(self.model.decision_function(X_input)[0])

            if pred == -1:
                return True, round(score, 3), "IsolationForest statistical anomaly detected"
            return False, round(score, 3), "NORMAL"

        return False, 0.5, "NORMAL"

anomaly_detector = AnomalyDetector()
