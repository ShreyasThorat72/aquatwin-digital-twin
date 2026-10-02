from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database.database import get_db_connection

router = APIRouter(prefix="/api/alarms", tags=["alarms"])

class AcknowledgeRequest(BaseModel):
    employee_id: str = "EMP001"

@router.get("")
def list_alarms(limit: int = 50, unacknowledged_only: bool = False):
    conn = get_db_connection()
    query = "SELECT * FROM alarms"
    params = []
    if unacknowledged_only:
        query += " WHERE acknowledged = 0"
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    rows = conn.execute(query, params).fetchall()
    
    count_unack = conn.execute("SELECT COUNT(*) as c FROM alarms WHERE acknowledged = 0").fetchone()["c"]
    conn.close()

    return {
        "unacknowledged_count": count_unack,
        "alarms": [dict(r) for r in rows]
    }

@router.post("/{alarm_id}/acknowledge")
def acknowledge_alarm(alarm_id: int, req: AcknowledgeRequest):
    conn = get_db_connection()
    conn.execute(
        "UPDATE alarms SET acknowledged = 1, acknowledged_by = ? WHERE id = ?",
        (req.employee_id, alarm_id)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Alarm #{alarm_id} acknowledged"}

@router.post("/acknowledge-all")
def acknowledge_all_alarms(req: AcknowledgeRequest):
    conn = get_db_connection()
    conn.execute(
        "UPDATE alarms SET acknowledged = 1, acknowledged_by = ? WHERE acknowledged = 0",
        (req.employee_id,)
    )
    conn.commit()
    conn.close()
    return {"status": "success", "message": "All active alarms acknowledged"}
