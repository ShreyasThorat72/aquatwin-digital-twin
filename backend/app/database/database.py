import sqlite3
import os
import json
import hashlib
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "aquatwin.db")
DB_PATH = os.path.abspath(DB_PATH)

DATABASE_URL = os.environ.get("DATABASE_URL")

def hash_password(password: str) -> str:
    """Hash password securely using SHA-256 with salt."""
    salt = "aquatwin_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def is_postgres() -> bool:
    return DATABASE_URL is not None and (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://"))

def get_db_connection():
    if is_postgres():
        import psycopg2
        import psycopg2.extras
        url = DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        conn = psycopg2.connect(url, cursor_factory=psycopg2.extras.DictCursor)
        return conn
    else:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

def db_execute(query: str, params: tuple = (), fetchone: bool = False, fetchall: bool = False, commit: bool = False):
    """
    Universal database query execution helper supporting both SQLite and PostgreSQL connections.
    Converts '?' parameter placeholders to '%s' when running against PostgreSQL.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if is_postgres():
        pg_query = query.replace("?", "%s")
        cursor.execute(pg_query, params)
    else:
        cursor.execute(query, params)

    result = None
    if fetchone:
        row = cursor.fetchone()
        result = dict(row) if row else None
    elif fetchall:
        rows = cursor.fetchall()
        result = [dict(r) for r in rows]

    if commit:
        conn.commit()

    conn.close()
    return result

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    if is_postgres():
        # PostgreSQL Schema
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS employees (
            employee_id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            department VARCHAR(100) NOT NULL,
            designation VARCHAR(100) NOT NULL,
            assigned_shift VARCHAR(50) NOT NULL,
            role VARCHAR(50) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'Active',
            joining_date VARCHAR(50) NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
            id SERIAL PRIMARY KEY,
            timestamp VARCHAR(100) NOT NULL,
            source VARCHAR(50) NOT NULL,
            device_id VARCHAR(100) NOT NULL,
            distance_cm DOUBLE PRECISION NOT NULL,
            water_height_cm DOUBLE PRECISION NOT NULL,
            water_level_percent DOUBLE PRECISION NOT NULL,
            volume_liters DOUBLE PRECISION NOT NULL,
            uptime_ms BIGINT DEFAULT 0,
            sensor_status VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
            is_anomaly INT DEFAULT 0,
            is_leak INT DEFAULT 0,
            created_at VARCHAR(100) DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS alarms (
            id SERIAL PRIMARY KEY,
            timestamp VARCHAR(100) NOT NULL,
            alarm_type VARCHAR(100) NOT NULL,
            severity VARCHAR(50) NOT NULL,
            description TEXT NOT NULL,
            acknowledged INT DEFAULT 0,
            acknowledged_by VARCHAR(100) DEFAULT '',
            source VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
            device_id VARCHAR(100) DEFAULT 'AQUATWIN-ESP32-01'
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_logs (
            id SERIAL PRIMARY KEY,
            timestamp VARCHAR(100) NOT NULL,
            employee_id VARCHAR(50),
            employee_name VARCHAR(100),
            module VARCHAR(100) NOT NULL,
            level VARCHAR(50) NOT NULL,
            description TEXT NOT NULL,
            system_state VARCHAR(100) DEFAULT ''
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key VARCHAR(100) PRIMARY KEY,
            value TEXT NOT NULL
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS scraped_data (
            id SERIAL PRIMARY KEY,
            timestamp VARCHAR(100) NOT NULL,
            dataset_type VARCHAR(100) NOT NULL,
            source_name VARCHAR(100) NOT NULL,
            data_json TEXT NOT NULL
        );
        """)

    else:
        # SQLite Schema
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS employees (
            employee_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            department TEXT NOT NULL,
            designation TEXT NOT NULL,
            assigned_shift TEXT NOT NULL,
            role TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Active',
            joining_date TEXT NOT NULL
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            source TEXT NOT NULL,
            device_id TEXT NOT NULL,
            distance_cm REAL NOT NULL,
            water_height_cm REAL NOT NULL,
            water_level_percent REAL NOT NULL,
            volume_liters REAL NOT NULL,
            uptime_ms INTEGER DEFAULT 0,
            sensor_status TEXT NOT NULL DEFAULT 'NORMAL',
            is_anomaly INTEGER DEFAULT 0,
            is_leak INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS alarms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            alarm_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            description TEXT NOT NULL,
            acknowledged INTEGER DEFAULT 0,
            acknowledged_by TEXT DEFAULT '',
            source TEXT NOT NULL DEFAULT 'SYSTEM',
            device_id TEXT DEFAULT 'AQUATWIN-ESP32-01'
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            employee_id TEXT,
            employee_name TEXT,
            module TEXT NOT NULL,
            level TEXT NOT NULL,
            description TEXT NOT NULL,
            system_state TEXT DEFAULT ''
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS scraped_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            dataset_type TEXT NOT NULL,
            source_name TEXT NOT NULL,
            data_json TEXT NOT NULL
        )
        """)

    # Seed Default Settings if not exist
    default_settings = {
        "tank_capacity_liters": "1000",
        "tank_height_cm": "150",
        "low_level_threshold": "20",
        "high_level_threshold": "90",
        "esp32_device_id": "AQUATWIN-ESP32-01",
        "telemetry_interval_ms": "1000",
        "offline_timeout_seconds": "5",
        "sensor_offset_cm": "0",
        "min_distance_cm": "2.0",
        "max_distance_cm": "400.0",
        "min_training_samples": "20",
        "forecast_horizon_mins": "30",
        "anomaly_sensitivity": "0.1",
        "data_source_mode": "SIMULATION"
    }

    for key, val in default_settings.items():
        if is_postgres():
            cursor.execute("INSERT INTO settings (key, value) VALUES (%s, %s) ON CONFLICT (key) DO NOTHING;", (key, val))
        else:
            cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?);", (key, val))

    # Seed Employees if not exist
    default_employees = [
        ("EMP001", "Operator 1", "Water Operations", "Senior SCADA Operator", "Shift A", "Operator", hash_password("pass123"), "Active", "2024-01-15"),
        ("EMP002", "Operator 2", "Water Operations", "SCADA Technician", "Shift B", "Operator", hash_password("pass123"), "Active", "2024-03-01"),
        ("EMP003", "Operator 3", "Field Operations", "Junior Operator", "Shift C", "Operator", hash_password("pass123"), "Active", "2024-06-10"),
        ("ADMIN001", "Supervisor Admin", "Plant Management", "Chief Systems Supervisor", "Shift B", "Admin", hash_password("admin123"), "Active", "2023-11-01"),
    ]

    for emp in default_employees:
        if is_postgres():
            cursor.execute("""
            INSERT INTO employees (employee_id, name, department, designation, assigned_shift, role, password_hash, status, joining_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (employee_id) DO NOTHING;
            """, emp)
        else:
            cursor.execute("""
            INSERT OR IGNORE INTO employees (employee_id, name, department, designation, assigned_shift, role, password_hash, status, joining_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, emp)

    # Seed initial log
    now = datetime.now().isoformat()
    if is_postgres():
        cursor.execute("""
        INSERT INTO system_logs (timestamp, employee_id, employee_name, module, level, description, system_state)
        VALUES (%s, 'SYSTEM', 'System Core', 'SYSTEM_INIT', 'INFO', 'AquaTwin Industrial SCADA PostgreSQL Database Initialized', 'ONLINE');
        """, (now,))
    else:
        cursor.execute("""
        INSERT OR IGNORE INTO system_logs (timestamp, employee_id, employee_name, module, level, description, system_state)
        VALUES (?, 'SYSTEM', 'System Core', 'SYSTEM_INIT', 'INFO', 'AquaTwin Industrial SCADA Database Initialized', 'ONLINE');
        """, (now,))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
