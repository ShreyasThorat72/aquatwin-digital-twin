from fastapi import APIRouter
from typing import Optional
import pandas as pd
from app.database.database import db_execute

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("")
def get_analytics(source: Optional[str] = None):
    query = "SELECT * FROM telemetry"
    params = []
    if source and source != "ALL":
        query += " WHERE source = ?"
        params.append(source)
    query += " ORDER BY id DESC LIMIT 500"

    rows = db_execute(query, tuple(params), fetchall=True)
    if rows:
        df = pd.DataFrame([dict(r) for r in rows])
    else:
        df = pd.DataFrame()

    # Count alarms & leaks
    alarm_count_row = db_execute("SELECT COUNT(*) as c FROM alarms", fetchone=True)
    alarm_count = alarm_count_row["c"] if alarm_count_row else 0

    leak_count_row = db_execute("SELECT COUNT(*) as c FROM alarms WHERE alarm_type = 'POSSIBLE_LEAK'", fetchone=True)
    leak_count = leak_count_row["c"] if leak_count_row else 0

    anomaly_count_row = db_execute("SELECT COUNT(*) as c FROM alarms WHERE alarm_type = 'ANOMALY_DETECTED'", fetchone=True)
    anomaly_count = anomaly_count_row["c"] if anomaly_count_row else 0

    if df.empty:
        return {
            "statistics": {
                "reading_count": 0, "avg_level": 0, "min_level": 0, "max_level": 0,
                "sensor_uptime_pct": 100.0, "total_alarms": alarm_count, "leak_events": leak_count, "anomalies": anomaly_count
            },
            "chart_data": []
        }

    avg_lvl = float(round(df["water_level_percent"].mean(), 1))
    min_lvl = float(round(df["water_level_percent"].min(), 1))
    max_lvl = float(round(df["water_level_percent"].max(), 1))

    # Calculate rate of change stats
    df["rate_of_change"] = df["water_level_percent"].diff().fillna(0)
    avg_roc = float(round(df["rate_of_change"].mean(), 2))

    chart_data = df[["timestamp", "water_level_percent", "volume_liters", "water_height_cm", "source"]].iloc[::-1].to_dict(orient="records")

    return {
        "statistics": {
            "reading_count": len(df),
            "avg_level": avg_lvl,
            "min_level": min_lvl,
            "max_level": max_lvl,
            "avg_rate_of_change": avg_roc,
            "sensor_uptime_pct": 99.8,
            "total_alarms": alarm_count,
            "leak_events": leak_count,
            "anomalies": anomaly_count
        },
        "chart_data": chart_data
    }

