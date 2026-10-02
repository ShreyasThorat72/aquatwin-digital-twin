from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.telemetry_service import telemetry_service
from app.database.database import get_db_connection, is_postgres

router = APIRouter(prefix="/api/hardware", tags=["hardware"])

class TelemetryPayload(BaseModel):
    device_id: str
    distance_cm: float
    water_height_cm: Optional[float] = None
    water_level_percent: Optional[float] = None
    timestamp: Optional[str] = None
    uptime_ms: Optional[int] = 0
    sensor_status: Optional[str] = "NORMAL"
    data_source: Optional[str] = "HARDWARE"

@router.post("/telemetry")
async def receive_telemetry(payload: TelemetryPayload, request: Request):
    """
    Receives telemetry JSON POST from ESP32 microcontrollers or hardware test senders.
    Calculates derived values, validates parameters, stores in DB, and broadcasts over WebSockets.
    """
    data_dict = payload.model_dump()
    source_tag = payload.data_source if payload.data_source else "HARDWARE"
    success, msg, processed = await telemetry_service.process_telemetry(data_dict, source=source_tag)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": msg, "data": processed}

@router.get("/status")
def get_hardware_status():
    health = telemetry_service.get_esp32_health()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if is_postgres():
        cursor.execute("SELECT COUNT(*) as total FROM telemetry WHERE source = 'HARDWARE'")
        count_row = cursor.fetchone()
        cursor.execute("SELECT timestamp, distance_cm, water_level_percent FROM telemetry WHERE source = 'HARDWARE' ORDER BY id DESC LIMIT 1")
        last_row = cursor.fetchone()
    else:
        cursor.execute("SELECT COUNT(*) as total FROM telemetry WHERE source = 'HARDWARE'")
        count_row = cursor.fetchone()
        cursor.execute("SELECT timestamp, distance_cm, water_level_percent FROM telemetry WHERE source = 'HARDWARE' ORDER BY id DESC LIMIT 1")
        last_row = cursor.fetchone()

    conn.close()

    return {
        "esp32": health,
        "total_packets_received": count_row["total"] if count_row else 0,
        "last_reading": dict(last_row) if last_row else None
    }

@router.get("/latest")
def get_latest_telemetry():
    return telemetry_service.latest_telemetry

@router.get("/history")
def get_telemetry_history(limit: int = 100, source: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()

    if is_postgres():
        query = "SELECT * FROM telemetry"
        params = []
        if source:
            query += " WHERE source = %s"
            params.append(source)
        query += " ORDER BY id DESC LIMIT %s"
        params.append(limit)
        cursor.execute(query, params)
    else:
        query = "SELECT * FROM telemetry"
        params = []
        if source:
            query += " WHERE source = ?"
            params.append(source)
        query += " ORDER BY id DESC LIMIT ?"
        params.append(limit)
        cursor.execute(query, params)

    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows][::-1]

@router.get("/devices")
def get_devices():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT device_id, source, COUNT(*) as packet_count, MAX(timestamp) as last_seen, MAX(sensor_status) as last_status
        FROM telemetry GROUP BY device_id, source
    """)
    rows = cursor.fetchall()
    conn.close()

    devices = []
    for r in rows:
        d = dict(r)
        d["status"] = "ONLINE" if d["device_id"] == "AQUATWIN-ESP32-01" and telemetry_service.esp32_status == "ONLINE" else "STANDBY"
        devices.append(d)

    if not devices:
        devices.append({
            "device_id": "AQUATWIN-ESP32-01",
            "source": "HARDWARE",
            "packet_count": 0,
            "last_seen": "N/A",
            "last_status": "NORMAL",
            "status": telemetry_service.esp32_status
        })

    return devices
