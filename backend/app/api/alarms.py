from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database.database import db_execute

router = APIRouter(prefix="/api/alarms", tags=["alarms"])

class AcknowledgeRequest(BaseModel):
    employee_id: str = "EMP001"

@router.get("")
def list_alarms(limit: int = 50, unacknowledged_only: bool = False):
    query = "SELECT * FROM alarms"
    params = []
    if unacknowledged_only:
        query += " WHERE acknowledged = 0"
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    rows = db_execute(query, tuple(params), fetchall=True)
    
    count_unack_row = db_execute("SELECT COUNT(*) as c FROM alarms WHERE acknowledged = 0", fetchone=True)
    count_unack = count_unack_row["c"] if count_unack_row else 0

    return {
        "unacknowledged_count": count_unack,
        "alarms": [dict(r) for r in rows]
    }

@router.post("/{alarm_id}/acknowledge")
def acknowledge_alarm(alarm_id: int, req: AcknowledgeRequest):
    db_execute(
        "UPDATE alarms SET acknowledged = 1, acknowledged_by = ? WHERE id = ?",
        (req.employee_id, alarm_id),
        commit=True
    )
    return {"status": "success", "message": f"Alarm #{alarm_id} acknowledged"}

@router.post("/acknowledge-all")
def acknowledge_all_alarms(req: AcknowledgeRequest):
    db_execute(
        "UPDATE alarms SET acknowledged = 1, acknowledged_by = ? WHERE acknowledged = 0",
        (req.employee_id,),
        commit=True
    )
    return {"status": "success", "message": "All active alarms acknowledged"}

