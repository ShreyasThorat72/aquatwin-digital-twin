import React from 'react';
import { useSCADA } from '../context/SCADAContext';
import { Sliders, Cpu, Zap, Power, ShieldAlert, CheckCircle, Info } from 'lucide-react';

export default function TankControl() {
  const { actuators, controlActuator, dataSourceMode } = useSCADA();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Sliders className="w-6 h-6 text-blue-600" />
            Industrial SCADA Tank Control Panel
          </h1>
          <p className="page-subtitle">
            Actuator Logic Controls • Relay Expansion Architecture • Control Mode Selector
          </p>
        </div>
      </div>

      {/* Hardware Architecture Disclaimer Note */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        color: '#1e40af'
      }}>
        <Info size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>HARDWARE INTEGRATION ARCHITECTURE STATUS</div>
          <div style={{ fontSize: '0.82rem', marginTop: '4px', lineHeight: '1.5' }}>
            <strong>Real Physical Sensing:</strong> Ultrasonic Level Sensor & ESP32 Microcontroller.<br />
            <strong>Simulated Actuators:</strong> Inlet Pump Motor, Inlet Solenoid Valve & Outlet Drain Valve are currently set to <strong>SIMULATED</strong>. 
            The system REST API is fully structured for zero-downtime physical relay expansion (ESP32 Relay Module on GPIO 12/14).
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Pump Motor Control */}
        <div className="scada-card">
          <div className="card-header">
            <h3 className="card-title">
              <Power className="w-5 h-5 text-blue-600" />
              Inlet Water Pump Motor
            </h3>
            <span className={`status-badge ${actuators.motor === 'ON' ? 'online' : 'offline'}`}>
              {actuators.motor} (SIMULATED)
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px' }}>
            Drives high-volume inflow (8.0 L/s). Automatically managed under AUTO control mode.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => controlActuator('motor', 'ON')}
              className={`scada-btn ${actuators.motor === 'ON' ? 'scada-btn-primary' : 'scada-btn-secondary'}`}
              style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
            >
              START MOTOR (ON)
            </button>
            <button
              onClick={() => controlActuator('motor', 'OFF')}
              className={`scada-btn ${actuators.motor === 'OFF' ? 'scada-btn-danger' : 'scada-btn-secondary'}`}
              style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
            >
              STOP MOTOR (OFF)
            </button>
          </div>
        </div>

        {/* Inlet Valve Control */}
        <div className="scada-card">
          <div className="card-header">
            <h3 className="card-title">
              <Sliders className="w-5 h-5 text-blue-600" />
              Inlet Solenoid Valve
            </h3>
            <span className={`status-badge ${actuators.inlet === 'OPEN' ? 'online' : 'offline'}`}>
              {actuators.inlet} (SIMULATED)
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px' }}>
            Controls main supply line flow. Solenoid state update interval: 100ms.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => controlActuator('inlet', 'OPEN')}
              className={`scada-btn ${actuators.inlet === 'OPEN' ? 'scada-btn-primary' : 'scada-btn-secondary'}`}
              style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
            >
              OPEN INLET VALVE
            </button>
            <button
              onClick={() => controlActuator('inlet', 'CLOSED')}
              className={`scada-btn ${actuators.inlet === 'CLOSED' ? 'scada-btn-danger' : 'scada-btn-secondary'}`}
              style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
            >
              CLOSE INLET VALVE
            </button>
          </div>
        </div>

        {/* Outlet Valve Control */}
        <div className="scada-card">
          <div className="card-header">
            <h3 className="card-title">
              <Sliders className="w-5 h-5 text-amber-600" />
              Outlet Drain Solenoid Valve
            </h3>
            <span className={`status-badge ${actuators.outlet === 'OPEN' ? 'online' : 'offline'}`}>
              {actuators.outlet} (SIMULATED)
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px' }}>
            Controls outflow drainage to distribution manifold (5.0 L/s).
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => controlActuator('outlet', 'OPEN')}
              className={`scada-btn ${actuators.outlet === 'OPEN' ? 'scada-btn-primary' : 'scada-btn-secondary'}`}
              style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
            >
              OPEN OUTLET VALVE
            </button>
            <button
              onClick={() => controlActuator('outlet', 'CLOSED')}
              className={`scada-btn ${actuators.outlet === 'CLOSED' ? 'scada-btn-danger' : 'scada-btn-secondary'}`}
              style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
            >
              CLOSE OUTLET VALVE
            </button>
          </div>
        </div>

        {/* Control Logic Mode Selector */}
        <div className="scada-card">
          <div className="card-header">
            <h3 className="card-title">
              <Zap className="w-5 h-5 text-green-600" />
              Automated Closed-Loop Logic
            </h3>
            <span className="status-badge normal">
              MODE: {actuators.mode}
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px' }}>
            In AUTO mode, pump turns ON at ≤20% water level and shuts OFF at ≥90%.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => controlActuator('mode', 'AUTO')}
              className={`scada-btn ${actuators.mode === 'AUTO' ? 'scada-btn-primary' : 'scada-btn-secondary'}`}
              style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
            >
              ENABLE AUTO LOOP
            </button>
            <button
              onClick={() => controlActuator('mode', 'MANUAL')}
              className={`scada-btn ${actuators.mode === 'MANUAL' ? 'scada-btn-primary' : 'scada-btn-secondary'}`}
              style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
            >
              MANUAL OVERRIDE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
