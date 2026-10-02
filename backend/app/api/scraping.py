import os
import requests
import json
import pandas as pd
from bs4 import BeautifulSoup
from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.database.database import db_execute

router = APIRouter(prefix="/api/scraping", tags=["scraping"])

SCRAPED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "scraped"))

TARGET_SOURCES = [
    {
        "id": "open_meteo_weather",
        "name": "Open-Meteo Weather & Rainfall API",
        "url": "https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.23&current=temperature_2m,relative_humidity_2m,rain,showers,precipitation&hourly=precipitation",
        "type": "Weather & Rainfall"
    },
    {
        "id": "wttr_in_water_meta",
        "name": "Wttr.in Public Environmental Data",
        "url": "https://wttr.in/?format=j1",
        "type": "Environmental & Humidity"
    }
]

@router.get("/run")
@router.post("/run")
def trigger_web_scraping():
    os.makedirs(SCRAPED_DIR, exist_ok=True)

    results = []

    for source in TARGET_SOURCES:
        source_id = source["id"]
        source_name = source["name"]
        url = source["url"]
        ds_type = source["type"]

        try:
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                
                # Format into pandas dataframe for tabular CSV saving
                timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"{source_id}_{timestamp_str}.csv"
                file_path = os.path.join(SCRAPED_DIR, filename)

                if source_id == "open_meteo_weather":
                    curr = data.get("current", {})
                    df = pd.DataFrame([curr])
                else:
                    df = pd.DataFrame([{"raw_json_summary": str(data)[:200]}])

                df.to_csv(file_path, index=False)

                # Save record to database using universal db_execute helper
                db_execute(
                    "INSERT INTO scraped_data (timestamp, dataset_type, source_name, data_json) VALUES (?, ?, ?, ?)",
                    (datetime.now().isoformat(), ds_type, source_name, json.dumps(data)[:1000]),
                    commit=True
                )

                results.append({
                    "source": source_name,
                    "status": "SUCCESS",
                    "http_code": resp.status_code,
                    "saved_file": filename,
                    "records_count": len(df)
                })
            else:
                results.append({
                    "source": source_name,
                    "status": "SOURCE UNAVAILABLE",
                    "http_code": resp.status_code,
                    "error": f"HTTP status {resp.status_code}"
                })
        except Exception as e:
            results.append({
                "source": source_name,
                "status": "SOURCE UNAVAILABLE",
                "http_code": None,
                "error": str(e)
            })

    return {"status": "complete", "timestamp": datetime.now().isoformat(), "results": results}

@router.get("/data")
def get_scraped_datasets():
    os.makedirs(SCRAPED_DIR, exist_ok=True)
    files = [f for f in os.listdir(SCRAPED_DIR) if f.endswith(".csv") or f.endswith(".json")]
    
    rows = db_execute(
        "SELECT id, timestamp, dataset_type, source_name, data_json FROM scraped_data ORDER BY id DESC LIMIT 20",
        fetchall=True
    )

    return {
        "saved_files": files,
        "database_records": rows or [],
        "available_sources": TARGET_SOURCES
    }
