from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.telemetry_service import telemetry_service
from app.services.simulation_service import simulation_engine
from app.database.database import db_execute
from datetime import datetime

router = APIRouter(prefix="/api/tank", tags=["tank"])

class ActuatorControlRequest(BaseModel):
    actuator: str # motor, inlet, outlet, mode
    command: str  # ON/OFF, OPEN/CLOSED, AUTO/MANUAL
    employee_id: str = "EMP001"

@router.get("/state")
def get_tank_state():
    latest = telemetry_service.latest_telemetry
    health = telemetry_service.get_esp32_health()
    mode_row = db_execute("SELECT value FROM settings WHERE key = 'data_source_mode'", fetchone=True)
    
    current_mode = mode_row["value"] if mode_row else "SIMULATION"

    return {
        "tank_state": latest,
        "actuators": telemetry_service.actuators,
        "data_source_mode": current_mode,
        "esp32_health": health
    }

@router.post("/actuators")
def control_actuators(req: ActuatorControlRequest):
    act = req.actuator.lower()
    cmd = req.command.upper()

    if act not in ["motor", "inlet", "outlet", "mode"]:
        raise HTTPException(status_code=400, detail="Invalid actuator target")

    # Update in telemetry service and simulation engine
    telemetry_service.actuators[act] = cmd
    simulation_engine.set_control(act, cmd)

    # Log action
    now = datetime.now().isoformat()
    db_execute("""
        INSERT INTO system_logs (timestamp, employee_id, employee_name, module, level, description, system_state)
        VALUES (?, ?, 'Operator', 'CONTROL_PANEL', 'INFO', ?, ?)
    """, (now, req.employee_id, f"Actuator {act.upper()} set to {cmd} (Simulated)", f"MODE: {telemetry_service.active_source_mode}"), commit=True)

    return {
        "status": "success",
        "actuator": act,
        "state": cmd,
        "all_actuators": telemetry_service.actuators
    }

