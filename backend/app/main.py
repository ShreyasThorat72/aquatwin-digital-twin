import asyncio
import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# Add app folder to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database.database import init_db, get_db_connection, is_postgres
from app.websocket.ws_manager import ws_manager
from app.services.simulation_service import simulation_engine
from app.services.telemetry_service import telemetry_service

# Import API Routers
from app.api.auth import router as auth_router
from app.api.hardware import router as hardware_router
from app.api.tank import router as tank_router
from app.api.simulation import router as sim_router
from app.api.employees import router as emp_router
from app.api.shifts import router as shift_router
from app.api.scraping import router as scrape_router
from app.api.csv_console import router as csv_router
from app.api.ml import router as ml_router
from app.api.analytics import router as analytics_router
from app.api.alarms import router as alarms_router
from app.api.reports import router as reports_router
from app.api.logs import router as logs_router
from app.api.settings import router as settings_router

# Background Physics Simulation Loop
async def run_simulation_loop():
    while True:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            if is_postgres():
                cursor.execute("SELECT value FROM settings WHERE key = 'data_source_mode'")
            else:
                cursor.execute("SELECT value FROM settings WHERE key = 'data_source_mode'")
            mode_row = cursor.fetchone()
            conn.close()
            
            current_mode = mode_row["value"] if mode_row else "SIMULATION"

            if current_mode == "SIMULATION" and simulation_engine.is_running:
                sim_data = simulation_engine.tick()
                await telemetry_service.process_telemetry(sim_data, source="SIMULATION")
        except Exception as e:
            print(f"[Simulation Loop Error]: {e}")
        
        await asyncio.sleep(1.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[AquaTwin Backend] Initializing database schema...")
    init_db()
    
    print("[AquaTwin Backend] Starting background simulation engine loop...")
    sim_task = asyncio.create_task(run_simulation_loop())
    
    yield
    
    print("[AquaTwin Backend] Shutting down background tasks...")
    sim_task.cancel()

app = FastAPI(
    title="AquaTwin SCADA Digital Twin API",
    description="Backend API and WebSocket real-time server for AquaTwin Smart Water Tank Digital Twin",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration for local network, localhost & production Vercel origins
cors_env = os.environ.get("CORS_ORIGINS", "")
if cors_env:
    allowed_origins = [origin.strip() for origin in cors_env.split(",") if origin.strip()]
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(hardware_router)
app.include_router(tank_router)
app.include_router(sim_router)
app.include_router(emp_router)
app.include_router(shift_router)
app.include_router(scrape_router)
app.include_router(csv_router)
app.include_router(ml_router)
app.include_router(analytics_router)
app.include_router(alarms_router)
app.include_router(reports_router)
app.include_router(logs_router)
app.include_router(settings_router)

@app.get("/")
def root():
    return {
        "system": "AquaTwin SCADA Digital Twin",
        "status": "ONLINE",
        "timestamp": datetime.now().isoformat(),
        "websocket": "/ws/telemetry",
        "docs": "/docs",
        "database_type": "PostgreSQL" if is_postgres() else "SQLite"
    }

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial snapshot immediately upon connection
        init_snapshot = {
            "type": "INITIAL_SNAPSHOT",
            "telemetry": telemetry_service.latest_telemetry,
            "actuators": telemetry_service.actuators,
            "esp32_status": telemetry_service.get_esp32_health(),
            "data_source_mode": telemetry_service.active_source_mode
        }
        await websocket.send_json(init_snapshot)

        while True:
            # Keep connection alive & listen for client ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        print(f"[WebSocket Exception]: {e}")
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
