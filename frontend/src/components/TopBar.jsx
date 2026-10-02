import React from 'react';
import { useSCADA } from '../context/SCADAContext';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../services/api';
import { Activity, Radio, Cpu, Database, Pause, RotateCcw, Clock, User } from 'lucide-react';

export default function TopBar() {
  const { 
    esp32Health, 
    wsStatus, 
    dataSourceMode, 
    setMode, 
    activeShift, 
    telemetry,
    refreshState
  } = useSCADA();
  
  const { user } = useAuth();

  // Determine overall system status
  let systemStatus = 'ONLINE';
  if (esp32Health.status === 'OFFLINE' && dataSourceMode === 'HARDWARE') {
    systemStatus = 'DEGRADED';
  }

  const handlePause = async () => {
    await fetchApi('/api/simulation/pause', { method: 'POST' });
    alert('Simulation paused');
  };

  const handleReset = async () => {
    await fetchApi('/api/simulation/reset', { method: 'POST' });
    refreshState();
    alert('Physics engine reset to default parameters');
  };

  return (
    <header className="topbar">
      {/* Left Title & Status Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ fontWeight: '800', fontSize: '1rem', color: '#0f172a' }}>AquaTwin</div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Industrial SCADA Core
          </div>
        </div>

        <span className={`status-badge ${systemStatus === 'ONLINE' ? 'online' : 'degraded'}`}>
          System: {systemStatus}
        </span>
      </div>

      {/* Center Telemetry & Health Pills */}
      <div className="topbar-metrics">
        <div className="metric-pill">
          <Clock size={14} className="text-blue-600" />
          <span className="label">Shift:</span>
          <span className="value">{activeShift.active_shift || 'Shift B'} ({activeShift.remaining_time || '4h 30m'})</span>
        </div>

        <div className="metric-pill">
          <User size={14} className="text-slate-600" />
          <span className="label">Operator:</span>
          <span className="value">{user?.name || 'Operator 1'}</span>
        </div>

        <div className="metric-pill">
          <Cpu size={14} className={esp32Health.status === 'ONLINE' ? 'text-green-600' : 'text-red-500'} />
          <span className="label">ESP32:</span>
          <span className={`value ${esp32Health.status === 'ONLINE' ? 'text-green-600' : 'text-red-500'}`}>
            {esp32Health.status}
          </span>
        </div>

        <div className="metric-pill">
          <Radio size={14} className={wsStatus === 'CONNECTED' ? 'text-green-600' : 'text-amber-500'} />
          <span className="label">WS:</span>
          <span className="value">{wsStatus}</span>
        </div>

        <div className="metric-pill">
          <Database size={14} className="text-green-600" />
          <span className="label">DB:</span>
          <span className="value text-green-600">Sync OK</span>
        </div>
      </div>

      {/* Right Mode Switcher & Quick Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div className="mode-selector">
          <button 
            className={`mode-btn ${dataSourceMode === 'HARDWARE' ? 'active-hardware' : ''}`}
            onClick={() => setMode('HARDWARE')}
          >
            HARDWARE
          </button>
          <button 
            className={`mode-btn ${dataSourceMode === 'SIMULATION' ? 'active-simulation' : ''}`}
            onClick={() => setMode('SIMULATION')}
          >
            SIMULATION
          </button>
          <button 
            className={`mode-btn ${dataSourceMode === 'COMBINED' ? 'active-hardware' : ''}`}
            onClick={() => setMode('COMBINED')}
          >
            COMBINED
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={handlePause} className="scada-btn scada-btn-secondary" style={{ padding: '5px 10px', fontSize: '0.78rem' }} title="Pause Simulation">
            <Pause size={14} />
          </button>
          <button onClick={handleReset} className="scada-btn scada-btn-secondary" style={{ padding: '5px 10px', fontSize: '0.78rem' }} title="Reset Physics Engine">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
