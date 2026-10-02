from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from app.database.database import get_db_connection
from app.services.telemetry_service import telemetry_service
from datetime import datetime

router = APIRouter(prefix="/api/settings", tags=["settings"])

class SettingsUpdate(BaseModel):
    settings: Dict[str, Any]
    employee_id: str = "ADMIN001"

@router.get("")
def get_settings():
    conn = get_db_connection()
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    return {r["key"]: r["value"] for r in rows}

@router.post("")
def update_settings(req: SettingsUpdate):
    conn = get_db_connection()
    for k, v in req.settings.items():
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            (str(k), str(v))
        )
    
    # Log config change
    now = datetime.now().isoformat()
    conn.execute(
        "INSERT INTO system_logs (timestamp, employee_id, employee_name, module, level, description) VALUES (?, ?, 'Supervisor', 'SETTINGS', 'INFO', 'System physical parameters updated')",
        (now, req.employee_id)
    )
    conn.commit()
    conn.close()

    # Update active mode cache if key changed
    if "data_source_mode" in req.settings:
        telemetry_service.active_source_mode = str(req.settings["data_source_mode"])

    return {"status": "success", "message": "Settings updated successfully"}
