"""
========================================================
AquaTwin Industrial SCADA & Digital Twin - System Launcher
========================================================
Starts both the FastAPI backend (Port 8000) and Vite React frontend (Port 5173).
"""

import subprocess
import sys
import time
import os

def start_system():
    root_dir = os.path.abspath(os.path.dirname(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    print("========================================================")
    print("        AQUATWIN SCADA DIGITAL TWIN SYSTEM STARTING      ")
    print("========================================================")
    print("1. Launching FastAPI Backend on http://localhost:8000 ...")
    
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=backend_dir
    )

    time.sleep(2)

    print("2. Launching Vite React Frontend on http://localhost:5173 ...")
    frontend_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_process = subprocess.Popen(
        [frontend_cmd, "run", "dev"],
        cwd=frontend_dir
    )

    print("\n========================================================")
    print("  AquaTwin System Online!")
    print("  Frontend UI:  http://localhost:5173")
    print("  Backend API:  http://localhost:8000")
    print("  API Docs:     http://localhost:8000/docs")
    print("  WebSocket:    ws://localhost:8000/ws/telemetry")
    print("========================================================\n")
    print("Press Ctrl+C to terminate all servers.")

    try:
        backend_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\nShutting down AquaTwin SCADA servers...")
        backend_process.terminate()
        frontend_process.terminate()

if __name__ == "__main__":
    start_system()
