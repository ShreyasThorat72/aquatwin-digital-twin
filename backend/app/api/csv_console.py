import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse
from typing import Optional
from app.database.database import get_db_connection

router = APIRouter(prefix="/api/csv", tags=["csv"])

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))

def ensure_csv_exports():
    """Generates updated CSV files from SQLite tables into respective directories."""
    conn = get_db_connection()
    
    # 1. Hardware Telemetry CSV
    hw_df = pd.read_sql_query("SELECT * FROM telemetry WHERE source = 'HARDWARE' ORDER BY id DESC", conn)
    hw_path = os.path.join(DATA_DIR, "telemetry", "hardware_telemetry.csv")
    os.makedirs(os.path.dirname(hw_path), exist_ok=True)
    hw_df.to_csv(hw_path, index=False)

    # 2. Simulation Telemetry CSV
    sim_df = pd.read_sql_query("SELECT * FROM telemetry WHERE source = 'SIMULATION' ORDER BY id DESC", conn)
    sim_path = os.path.join(DATA_DIR, "telemetry", "simulation_telemetry.csv")
    sim_df.to_csv(sim_path, index=False)

    # 3. Employee CSV
    emp_df = pd.read_sql_query("SELECT employee_id, name, department, designation, assigned_shift, role, status, joining_date FROM employees", conn)
    emp_path = os.path.join(DATA_DIR, "employees", "employees_master.csv")
    os.makedirs(os.path.dirname(emp_path), exist_ok=True)
    emp_df.to_csv(emp_path, index=False)

    conn.close()

@router.get("/files")
def list_csv_files():
    ensure_csv_exports()
    file_list = []
    
    for category in ["telemetry", "employees", "scraped", "reports"]:
        cat_dir = os.path.join(DATA_DIR, category)
        if os.path.exists(cat_dir):
            for fname in os.listdir(cat_dir):
                if fname.endswith(".csv"):
                    fpath = os.path.join(cat_dir, fname)
                    stat = os.stat(fpath)
                    file_list.append({
                        "filename": fname,
                        "category": category,
                        "size_bytes": stat.st_size,
                        "path": f"data/{category}/{fname}"
                    })

    return file_list

@router.get("/view/{category}/{filename}")
def view_csv_content(category: str, filename: str, search: Optional[str] = None):
    fpath = os.path.abspath(os.path.join(DATA_DIR, category, filename))
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="File not found")

    df = pd.read_csv(fpath)
    if search:
        # Simple text search across all columns
        mask = df.astype(str).apply(lambda row: row.str.contains(search, case=False, na=False)).any(axis=1)
        df = df[mask]

    records = df.head(100).to_dict(orient="records")
    columns = list(df.columns)

    return {
        "filename": filename,
        "category": category,
        "total_rows": len(df),
        "columns": columns,
        "preview_rows": records
    }

@router.get("/download/{category}/{filename}")
def download_csv_file(category: str, filename: str):
    fpath = os.path.abspath(os.path.join(DATA_DIR, category, filename))
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(fpath, media_type="text/csv", filename=filename)
