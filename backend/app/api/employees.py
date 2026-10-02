from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database.database import get_db_connection, hash_password
from datetime import datetime

router = APIRouter(prefix="/api/employees", tags=["employees"])

class EmployeeCreate(BaseModel):
    employee_id: str
    name: str
    department: str
    designation: str
    assigned_shift: str
    role: str
    password: str

@router.get("")
def list_employees():
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT employee_id, name, department, designation, assigned_shift, role, status, joining_date
        FROM employees ORDER BY employee_id ASC
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("")
def create_employee(emp: EmployeeCreate):
    conn = get_db_connection()
    existing = conn.execute("SELECT employee_id FROM employees WHERE employee_id = ?", (emp.employee_id.upper(),)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    hashed = hash_password(emp.password)
    now_date = datetime.now().strftime("%Y-%m-%d")

    conn.execute("""
        INSERT INTO employees (employee_id, name, department, designation, assigned_shift, role, password_hash, status, joining_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', ?)
    """, (emp.employee_id.upper(), emp.name, emp.department, emp.designation, emp.assigned_shift, emp.role, hashed, now_date))

    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Employee {emp.name} created successfully"}
