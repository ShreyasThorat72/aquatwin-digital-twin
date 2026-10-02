from fastapi import APIRouter
from datetime import datetime, time
from app.database.database import get_db_connection

router = APIRouter(prefix="/api/shifts", tags=["shifts"])

@router.get("")
@router.get("/active")
def get_active_shift():
    now = datetime.now()
    current_hour = now.hour

    if 0 <= current_hour < 8:
        shift_name = "Shift A"
        time_range = "00:00 - 08:00"
        end_hour = 8
        next_shift = "Shift B"
    elif 8 <= current_hour < 16:
        shift_name = "Shift B"
        time_range = "08:00 - 16:00"
        end_hour = 16
        next_shift = "Shift C"
    else:
        shift_name = "Shift C"
        time_range = "16:00 - 00:00"
        end_hour = 24
        next_shift = "Shift A"

    # Calculate remaining time in shift
    end_of_shift = now.replace(hour=end_hour if end_hour < 24 else 23, minute=59 if end_hour == 24 else 0, second=0)
    delta = end_of_shift - now
    mins_left = max(0, int(delta.total_seconds() // 60))
    hours_left = mins_left // 60
    rem_mins = mins_left % 60
    remaining_str = f"{hours_left}h {rem_mins}m"

    # Get assigned operator for active shift
    conn = get_db_connection()
    emp = conn.execute("SELECT employee_id, name, designation FROM employees WHERE assigned_shift = ? AND status = 'Active' LIMIT 1", (shift_name,)).fetchone()
    conn.close()

    operator_info = dict(emp) if emp else {"employee_id": "EMP001", "name": "Operator 1", "designation": "Senior SCADA Operator"}

    return {
        "active_shift": shift_name,
        "time_range": time_range,
        "remaining_time": remaining_str,
        "assigned_operator": operator_info,
        "next_shift": next_shift,
        "shifts_schedule": [
            {"name": "Shift A", "hours": "00:00 - 08:00", "assigned": "EMP001 (Operator 1)"},
            {"name": "Shift B", "hours": "08:00 - 16:00", "assigned": "EMP002 (Operator 2)"},
            {"name": "Shift C", "hours": "16:00 - 00:00", "assigned": "EMP003 (Operator 3)"}
        ]
    }
