from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from app.database.database import db_execute, hash_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = "aquatwin_secret_scada_key_2026"
ALGORITHM = "HS256"

class LoginRequest(BaseModel):
    employee_id: str
    password: str

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=8))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login")
def login(req: LoginRequest):
    emp = db_execute("SELECT * FROM employees WHERE employee_id = ?", (req.employee_id.upper(),), fetchone=True)
    
    if not emp:
        raise HTTPException(status_code=401, detail="Invalid Employee ID or Password")

    hashed = hash_password(req.password)
    if emp["password_hash"] != hashed:
        raise HTTPException(status_code=401, detail="Invalid Employee ID or Password")

    token = create_access_token({
        "sub": emp["employee_id"],
        "name": emp["name"],
        "role": emp["role"],
        "shift": emp["assigned_shift"]
    })

    # Log employee login
    now = datetime.now().isoformat()
    db_execute(
        "INSERT INTO system_logs (timestamp, employee_id, employee_name, module, level, description, system_state) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (now, emp["employee_id"], emp["name"], "AUTH", "INFO", f"Employee {emp['name']} ({emp['employee_id']}) logged in", "ONLINE"),
        commit=True
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "employee": {
            "employee_id": emp["employee_id"],
            "name": emp["name"],
            "department": emp["department"],
            "designation": emp["designation"],
            "assigned_shift": emp["assigned_shift"],
            "role": emp["role"],
            "status": emp["status"]
        }
    }

@router.get("/me")
def get_me(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        emp_id = payload.get("sub")
        emp = db_execute("SELECT employee_id, name, department, designation, assigned_shift, role, status FROM employees WHERE employee_id = ?", (emp_id,), fetchone=True)
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found")
        return emp
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/logout")
def logout(req: dict):
    emp_id = req.get("employee_id", "UNKNOWN")
    emp_name = req.get("name", "Operator")
    now = datetime.now().isoformat()
    db_execute(
        "INSERT INTO system_logs (timestamp, employee_id, employee_name, module, level, description, system_state) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (now, emp_id, emp_name, "AUTH", "INFO", f"Employee {emp_name} ({emp_id}) logged out", "ONLINE"),
        commit=True
    )
    return {"message": "Logged out successfully"}
