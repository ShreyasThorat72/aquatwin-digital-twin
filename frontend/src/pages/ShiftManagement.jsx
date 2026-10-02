import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Clock, Calendar, UserCheck, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ShiftManagement() {
  const [shiftData, setShiftData] = useState(null);

  const loadShifts = async () => {
    try {
      const res = await fetchApi('/api/shifts/active');
      setShiftData(res);
    } catch (e) {
      console.warn('Shifts fetch error:', e);
    }
  };

  useEffect(() => {
    loadShifts();
    const interval = setInterval(loadShifts, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Clock className="w-6 h-6 text-blue-600" />
            Operational Shift Schedule & Assignment
          </h1>
          <p className="page-subtitle">
            24/7 Continuous SCADA Monitoring Roster • Automatic Telemetry Shift Tagging
          </p>
        </div>
      </div>

      {/* Active Shift Card Banner */}
      <div className="scada-card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8', fontWeight: '700' }}>
              CURRENT ACTIVE OPERATIONAL SHIFT
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'JetBrains Mono', marginTop: '4px' }}>
              {shiftData?.active_shift || 'Shift B'} ({shiftData?.time_range || '08:00 - 16:00'})
            </div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} className="text-emerald-400" />
              Assigned SCADA Operator: <strong>{shiftData?.assigned_operator?.name || 'Operator 1'}</strong> ({shiftData?.assigned_operator?.employee_id || 'EMP001'})
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', uppercase: 'true' }}>SHIFT TIME REMAINING</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#38bdf8' }}>
              {shiftData?.remaining_time || '4h 30m'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '4px' }}>
              Up Next: <strong>{shiftData?.next_shift || 'Shift C'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Shifts Schedule Cards */}
      <div className="grid-3">
        {shiftData?.shifts_schedule?.map(s => {
          const isActive = s.name === shiftData.active_shift;
          return (
            <div key={s.name} className="scada-card" style={{ borderTop: isActive ? '4px solid #0284c7' : '1px solid #e2e8f0' }}>
              <div className="card-header">
                <h3 className="card-title">{s.name}</h3>
                <span className={`status-badge ${isActive ? 'online' : 'normal'}`}>
                  {isActive ? 'ACTIVE NOW' : 'SCHEDULED'}
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', lineHeight: '1.8' }}>
                <div><strong>Hours:</strong> {s.hours}</div>
                <div><strong>Assigned Roster:</strong> {s.assigned}</div>
                <div><strong>Coverage:</strong> 8-Hour Operational Window</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
