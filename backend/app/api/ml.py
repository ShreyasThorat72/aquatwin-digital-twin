from fastapi import APIRouter
from app.ml.forecaster import water_forecaster
from app.ml.anomaly_detector import anomaly_detector
from app.services.telemetry_service import telemetry_service
from app.database.database import db_execute

router = APIRouter(prefix="/api/ml", tags=["ml"])

@router.get("/status")
def get_ml_status():
    count_row = db_execute("SELECT COUNT(*) as cnt FROM telemetry", fetchone=True)
    total_samples = count_row["cnt"] if count_row else 0

    return {
        "forecaster": {
            "algorithm": "RandomForestRegressor",
            "is_trained": water_forecaster.is_trained,
            "r2_score": water_forecaster.metrics["r2_score"],
            "mae": water_forecaster.metrics["mae"],
            "sample_size": water_forecaster.metrics["sample_size"],
            "last_train_time": water_forecaster.last_train_time
        },
        "anomaly_detector": {
            "algorithm": "IsolationForest",
            "is_trained": anomaly_detector.is_trained
        },
        "total_database_telemetry_samples": total_samples
    }

@router.post("/train")
def train_ml_models():
    # Train forecaster
    f_success, f_msg = water_forecaster.train()
    # Train anomaly detector
    a_success, a_msg = anomaly_detector.train()

    db_execute(
        "INSERT INTO system_logs (timestamp, employee_id, employee_name, module, level, description) VALUES (datetime('now'), 'EMP001', 'Operator', 'ML_ENGINE', 'INFO', ?)",
        (f"ML Models retrained. Forecaster: {f_msg}, Anomaly: {a_msg}",),
        commit=True
    )

    return {
        "status": "success",
        "forecaster_result": {"success": f_success, "message": f_msg, "metrics": water_forecaster.metrics},
        "anomaly_result": {"success": a_success, "message": a_msg}
    }

@router.get("/forecast")
def get_live_forecast():
    current_level = telemetry_service.latest_telemetry["water_level_percent"]
    res = water_forecaster.predict_future(current_level, telemetry_service.recent_history)
    return {
        "current_water_level_percent": current_level,
        "forecast": res,
        "forecaster_metrics": water_forecaster.metrics
    }
