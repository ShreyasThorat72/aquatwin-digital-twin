import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, ShieldAlert, CheckCircle2, CheckSquare } from 'lucide-react';

export default function Alarms() {
  const [alarms, setAlarms] = useState([]);
  const [unackCount, setUnackCount] = useState(0);
  const { user } = useAuth();

  const loadAlarms = async () => {
    try {
      const data = await fetchApi('/api/alarms');
      setAlarms(data.alarms);
      setUnackCount(data.unacknowledged_count);
    } catch (e) {
      console.warn('Alarms load error:', e);
    }
  };

  useEffect(() => {
    loadAlarms();
    const interval = setInterval(loadAlarms, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (alarmId) => {
    try {
      await fetchApi(`/api/alarms/${alarmId}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ employee_id: user?.employee_id || 'EMP001' })
      });
      loadAlarms();
    } catch (e) {
      alert('Failed to acknowledge alarm');
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      await fetchApi('/api/alarms/acknowledge-all', {
        method: 'POST',
        body: JSON.stringify({ employee_id: user?.employee_id || 'EMP001' })
      });
      loadAlarms();
    } catch (e) {
      alert('Failed to acknowledge all alarms');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Industrial Alarm & Anomaly Monitoring Console
          </h1>
          <p className="page-subtitle">
            Critical Threshold Breaches • Leak Alerts • Sensor Fault Diagnostics
          </p>
        </div>

        <button onClick={handleAcknowledgeAll} className="scada-btn scada-btn-primary">
          <CheckSquare size={16} /> Acknowledge All ({unackCount})
        </button>
      </div>

      <div className="scada-card">
        <table className="scada-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Severity</th>
              <th>Alarm Type</th>
              <th>Description</th>
              <th>Source / Device</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {alarms.length > 0 ? (
              alarms.map(a => (
                <tr key={a.id} style={{ background: a.acknowledged ? '#ffffff' : '#fff5f5' }}>
                  <td>#{a.id}</td>
                  <td>{new Date(a.timestamp).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${a.severity.toLowerCase()}`}>
                      {a.severity}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700', fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>
                    {a.alarm_type}
                  </td>
                  <td style={{ fontWeight: a.acknowledged ? 'normal' : 'bold' }}>{a.description}</td>
                  <td>{a.source} ({a.device_id})</td>
                  <td>
                    {a.acknowledged ? (
                      <span className="status-badge normal" style={{ background: '#f1f5f9', color: '#64748b' }}>
                        ACK BY {a.acknowledged_by}
                      </span>
                    ) : (
                      <span className="status-badge critical">
                        UNACKNOWLEDGED
                      </span>
                    )}
                  </td>
                  <td>
                    {!a.acknowledged && (
                      <button onClick={() => handleAcknowledge(a.id)} className="scada-btn scada-btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                  No active or past system alarms recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
