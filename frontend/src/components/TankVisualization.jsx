import React from 'react';
import { Droplet, Activity, Gauge, ArrowDownUp } from 'lucide-react';

export default function TankVisualization({ telemetry }) {
  const levelPct = telemetry?.water_level_percent ?? 50.0;
  const volumeL = telemetry?.volume_liters ?? 500.0;
  const heightCm = telemetry?.water_height_cm ?? 75.0;
  const distanceCm = telemetry?.distance_cm ?? 75.0;

  // Determine water color based on level
  let waterGradient = 'linear-gradient(180deg, #38bdf8 0%, #0284c7 60%, #1e3a8a 100%)';
  if (levelPct <= 20.0) {
    waterGradient = 'linear-gradient(180deg, #f87171 0%, #dc2626 60%, #991b1b 100%)'; // Warning Low Red
  } else if (levelPct >= 90.0) {
    waterGradient = 'linear-gradient(180deg, #fbbf24 0%, #d97706 60%, #92400e 100%)'; // Warning High Amber
  }

  return (
    <div className="scada-card">
      <div className="card-header">
        <h3 className="card-title">
          <Droplet className="w-5 h-5 text-blue-600" />
          3D Industrial Digital Twin Tank
        </h3>
        <span className="status-badge normal">
          Live Physics Sync
        </span>
      </div>

      <div className="grid-2" style={{ alignItems: 'center' }}>
        {/* Animated Tank Visualization Shell */}
        <div className="tank-visual-container">
          {/* Ultrasonic Sensor Beam Line */}
          <div 
            className="sensor-beam" 
            style={{ height: `${Math.max(10, 240 * (distanceCm / 150.0))}px` }}
          />

          <div className="tank-shell">
            {/* Level height markers */}
            <div className="tank-markers">
              <span>100%</span>
              <span>80%</span>
              <span>60%</span>
              <span>40%</span>
              <span>20%</span>
              <span>0%</span>
            </div>

            {/* Dynamic Water Volume */}
            <div 
              className="tank-water" 
              style={{ height: `${Math.min(100, Math.max(0, levelPct))}%`, background: waterGradient }}
            >
              <div className="tank-water-wave" />
              <div className="tank-level-overlay">
                {levelPct.toFixed(1)}%
              </div>
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
            Ultrasonic Sensor Target Height: 150 cm
          </div>
        </div>

        {/* Telemetry Metrics Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          <div className="metric-pill" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.78rem', fontWeight: '600' }}>
              <Gauge size={16} color="#0284c7" />
              WATER LEVEL
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: levelPct <= 20 ? '#dc2626' : '#0284c7' }}>
              {levelPct.toFixed(1)} <span style={{ fontSize: '0.9rem' }}>%</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Target: 0.0% - 100.0%</div>
          </div>

          <div className="metric-pill" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.78rem', fontWeight: '600' }}>
              <Droplet size={16} color="#16a34a" />
              WATER VOLUME
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0f172a' }}>
              {volumeL.toFixed(1)} <span style={{ fontSize: '0.9rem' }}>L</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Max Capacity: 1000 Liters</div>
          </div>

          <div className="metric-pill" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.78rem', fontWeight: '600' }}>
              <ArrowDownUp size={16} color="#d97706" />
              WATER HEIGHT
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0f172a' }}>
              {heightCm.toFixed(1)} <span style={{ fontSize: '0.9rem' }}>cm</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Measured from bottom</div>
          </div>

          <div className="metric-pill" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.78rem', fontWeight: '600' }}>
              <Activity size={16} color="#6366f1" />
              ULTRASONIC DIST
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0f172a' }}>
              {distanceCm.toFixed(1)} <span style={{ fontSize: '0.9rem' }}>cm</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>HC-SR04 Raw Echo</div>
          </div>
        </div>
      </div>
    </div>
  );
}
