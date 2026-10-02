from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database.database import db_execute, hash_password
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
    rows = db_execute("""
        SELECT employee_id, name, department, designation, assigned_shift, role, status, joining_date
        FROM employees ORDER BY employee_id ASC
    """, fetchall=True)
    return rows or []

@router.post("")
def create_employee(emp: EmployeeCreate):
    existing = db_execute("SELECT employee_id FROM employees WHERE employee_id = ?", (emp.employee_id.upper(),), fetchone=True)
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    hashed = hash_password(emp.password)
    now_date = datetime.now().strftime("%Y-%m-%d")

    db_execute("""
        INSERT INTO employees (employee_id, name, department, designation, assigned_shift, role, password_hash, status, joining_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', ?)
    """, (emp.employee_id.upper(), emp.name, emp.department, emp.designation, emp.assigned_shift, emp.role, hashed, now_date), commit=True)

    # Log employee creation event
    now_ts = datetime.now().isoformat()
    db_execute(
        "INSERT INTO system_logs (timestamp, employee_id, employee_name, module, level, description) VALUES (?, ?, ?, ?, ?, ?)",
        (now_ts, "ADMIN", "Supervisor Admin", "EMPLOYEE", "INFO", f"Registered new operator: {emp.name} ({emp.employee_id.upper()})"),
        commit=True
    )

    return {
        "status": "success",
        "message": f"Employee {emp.name} created successfully",
        "employee": {
            "employee_id": emp.employee_id.upper(),
            "name": emp.name,
            "department": emp.department,
            "designation": emp.designation,
            "assigned_shift": emp.assigned_shift,
            "role": emp.role
        }
    }

