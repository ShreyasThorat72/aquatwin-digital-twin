import React, { useState } from 'react';
import { useSCADA } from '../context/SCADAContext';
import { fetchApi } from '../services/api';
import TankVisualization from '../components/TankVisualization';
import { PlayCircle, Play, Pause, RotateCcw, FastForward, Activity } from 'lucide-react';

export default function LiveSimulation() {
  const { telemetry, refreshState } = useSCADA();
  const [isRunning, setIsRunning] = useState(true);
  const [speed, setSpeed] = useState(1);

  const handleStart = async () => {
    await fetchApi('/api/simulation/start', { method: 'POST' });
    setIsRunning(true);
  };

  const handlePause = async () => {
    await fetchApi('/api/simulation/pause', { method: 'POST' });
    setIsRunning(false);
  };

  const handleReset = async () => {
    await fetchApi('/api/simulation/reset', { method: 'POST' });
    refreshState();
  };

  const handleSpeed = async (val) => {
    await fetchApi('/api/simulation/speed', {
      method: 'POST',
      body: JSON.stringify({ multiplier: val })
    });
    setSpeed(val);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <PlayCircle className="w-6 h-6 text-blue-600" />
            Software Tank Physics Simulator Engine
          </h1>
          <p className="page-subtitle">
            Differential Water Physics Model (dV/dt = Qin - Qout) • Time Multiplier Controls
          </p>
        </div>
      </div>

      <div className="grid-2">
        <TankVisualization telemetry={telemetry} />

        {/* Simulation Controls & Equations */}
        <div className="scada-card">
          <div className="card-header">
            <h3 className="card-title">
              <FastForward className="w-5 h-5 text-blue-600" />
              Physics Engine Parameters & Controls
            </h3>
            <span className={`status-badge ${isRunning ? 'online' : 'warning'}`}>
              Status: {isRunning ? 'RUNNING' : 'PAUSED'}
            </span>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '8px' }}>
              PHYSICS TIME SPEED MULTIPLIER
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 5, 10].map(s => (
                <button
                  key={s}
                  onClick={() => handleSpeed(s)}
                  className={`scada-btn ${speed === s ? 'scada-btn-primary' : 'scada-btn-secondary'}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <button onClick={handleStart} className="scada-btn scada-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Play size={16} /> Start Sim
            </button>
            <button onClick={handlePause} className="scada-btn scada-btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
              <Pause size={16} /> Pause Sim
            </button>
            <button onClick={handleReset} className="scada-btn scada-btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
              <RotateCcw size={16} /> Reset Physics
            </button>
          </div>

          {/* Mathematical Physics Equations Box */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a', marginBottom: '8px' }}>
              DIFFERENTIAL WATER PHYSICS MODEL
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.82rem', color: '#0284c7', lineHeight: '1.8' }}>
              1. dV/dt = Q_in - Q_out <br />
              2. V_new = V_old + (Q_in - Q_out) × Δt × {speed}x <br />
              3. Level % = (V / V_max) × 100 <br />
              4. Bounds Enforcement: 0.0 L ≤ V ≤ 1000.0 L
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
