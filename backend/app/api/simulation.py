from fastapi import APIRouter
from pydantic import BaseModel
from app.services.simulation_service import simulation_engine
from app.database.database import get_db_connection
from datetime import datetime

router = APIRouter(prefix="/api/simulation", tags=["simulation"])

class SpeedRequest(BaseModel):
    multiplier: float

@router.post("/start")
def start_simulation():
    simulation_engine.is_running = True
    return {"status": "success", "is_running": True, "speed": simulation_engine.speed_multiplier}

@router.post("/pause")
def pause_simulation():
    simulation_engine.is_running = False
    return {"status": "success", "is_running": False}

@router.post("/reset")
def reset_simulation():
    simulation_engine.reset_physics()
    return {"status": "success", "message": "Simulation physics engine reset to initial state"}

@router.post("/speed")
def set_simulation_speed(req: SpeedRequest):
    simulation_engine.set_speed(req.multiplier)
    return {"status": "success", "multiplier": simulation_engine.speed_multiplier}
