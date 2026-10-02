from fastapi import APIRouter
from app.database.database import get_db_connection

router = APIRouter(prefix="/api/logs", tags=["logs"])

@router.get("")
def get_system_logs(limit: int = 100, module: str = None):
    conn = get_db_connection()
    query = "SELECT * FROM system_logs"
    params = []
    if module and module != "ALL":
        query += " WHERE module = ?"
        params.append(module)
    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]
