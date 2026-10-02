import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Terminal, RefreshCw, Filter } from 'lucide-react';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const loadLogs = async () => {
    try {
      const data = await fetchApi(`/api/logs?module=${moduleFilter}`);
      setLogs(data);
    } catch (e) {
      console.warn('Logs load error:', e);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [moduleFilter]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Terminal className="w-6 h-6 text-blue-600" />
            System Audit & Security Execution Logs
          </h1>
          <p className="page-subtitle">
            Immutable Audit Trail • Auth Events • Hardware Telemetry Logs • Control Traces
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            <option value="ALL">ALL MODULES</option>
            <option value="AUTH">AUTH</option>
            <option value="CONTROL_PANEL">CONTROL PANEL</option>
            <option value="TELEMETRY">TELEMETRY</option>
            <option value="ML_ENGINE">ML ENGINE</option>
            <option value="SETTINGS">SETTINGS</option>
          </select>
          <button onClick={loadLogs} className="scada-btn scada-btn-secondary">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="scada-card">
        <table className="scada-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Employee</th>
              <th>Module</th>
              <th>Level</th>
              <th>Description</th>
              <th>System State</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td>#{l.id}</td>
                <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>
                  {new Date(l.timestamp).toLocaleString()}
                </td>
                <td>
                  <strong>{l.employee_name || 'SYSTEM'}</strong> ({l.employee_id || 'SYS'})
                </td>
                <td><span className="status-badge normal">{l.module}</span></td>
                <td>
                  <span className={`status-badge ${l.level.toLowerCase()}`}>
                    {l.level}
                  </span>
                </td>
                <td>{l.description}</td>
                <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{l.system_state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
