from fastapi import APIRouter
from app.database.database import db_execute

router = APIRouter(prefix="/api/logs", tags=["logs"])

@router.get("")
def get_system_logs(limit: int = 100, module: str = None):
    query = "SELECT * FROM system_logs"
    params = []
    if module and module != "ALL":
        query += " WHERE module = ?"
        params.append(module)
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    rows = db_execute(query, tuple(params), fetchall=True)
    return [dict(r) for r in rows]

