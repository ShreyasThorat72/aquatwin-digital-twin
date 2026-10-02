import React, { useState, useEffect } from 'react';
import { useSCADA } from '../context/SCADAContext';
import { fetchApi } from '../services/api';
import { Cpu, Radio, Activity, Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function HardwareIoT() {
  const { esp32Health, telemetry, wsStatus } = useSCADA();
  const [devices, setDevices] = useState([]);
  const [history, setHistory] = useState([]);

  const loadHardwareInfo = async () => {
    try {
      const devs = await fetchApi('/api/hardware/devices');
      setDevices(devs);
      const hist = await fetchApi('/api/hardware/history?limit=15');
      setHistory(hist);
    } catch (e) {
      console.warn('Hardware info error:', e);
    }
  };

  useEffect(() => {
    loadHardwareInfo();
    const interval = setInterval(loadHardwareInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Cpu className="w-6 h-6 text-blue-600" />
            Hardware & IoT Control Center
          </h1>
          <p className="page-subtitle">
            ESP32 Microcontroller Status • HC-SR04 Ultrasonic Telemetry Stream • Network Diagnostics
          </p>
        </div>

        <button onClick={loadHardwareInfo} className="scada-btn scada-btn-secondary">
          <RefreshCw size={16} /> Poll Devices
        </button>
      </div>

      <div className="grid-3" style={{ marginBottom: '20px' }}>
        {/* ESP32 Device Card */}
        <div className="scada-card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title"><Cpu size={18} className="text-blue-600" /> ESP32 Device</h3>
            <span className={`status-badge ${esp32Health.status === 'ONLINE' ? 'online' : 'offline'}`}>
              {esp32Health.status}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.8' }}>
            <div><strong>Device ID:</strong> {esp32Health.device_id}</div>
            <div><strong>Wi-Fi Status:</strong> Connected (STA Mode)</div>
            <div><strong>Last Packet Age:</strong> {esp32Health.last_packet_age_seconds !== null ? `${esp32Health.last_packet_age_seconds}s ago` : 'N/A'}</div>
            <div><strong>Offline Timeout:</strong> {esp32Health.offline_timeout_config}s</div>
          </div>
        </div>

        {/* Ultrasonic Sensor Card */}
        <div className="scada-card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title"><Activity size={18} className="text-emerald-600" /> HC-SR04 Sensor</h3>
            <span className="status-badge normal">{telemetry?.sensor_status || 'NORMAL'}</span>
          </div>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.8' }}>
            <div><strong>Echo Distance:</strong> {telemetry?.distance_cm?.toFixed(1)} cm</div>
            <div><strong>Water Height:</strong> {telemetry?.water_height_cm?.toFixed(1)} cm</div>
            <div><strong>Water Level:</strong> {telemetry?.water_level_percent?.toFixed(1)} %</div>
            <div><strong>Voltage Safety:</strong> 5V Echo → 3.3V Divider OK</div>
          </div>
        </div>

        {/* Communication Status Card */}
        <div className="scada-card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title"><Radio size={18} className="text-purple-600" /> Communication</h3>
            <span className="status-badge online">FASTAPI HTTP 200</span>
          </div>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.8' }}>
            <div><strong>WebSocket Stream:</strong> {wsStatus}</div>
            <div><strong>REST Endpoint:</strong> /api/hardware/telemetry</div>
            <div><strong>Database Engine:</strong> SQLite 3 (aquatwin.db)</div>
            <div><strong>Telemetry Interval:</strong> 1000 ms</div>
          </div>
        </div>
      </div>

      {/* Live Telemetry Table */}
      <div className="scada-card">
        <div className="card-header">
          <h3 className="card-title">
            <Database size={18} className="text-blue-600" />
            Live Hardware Packet Stream Log
          </h3>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Showing latest 15 packets</span>
        </div>

        <table className="scada-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Source</th>
              <th>Device ID</th>
              <th>Distance (cm)</th>
              <th>Water Height (cm)</th>
              <th>Level (%)</th>
              <th>Sensor Health</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map(row => (
                <tr key={row.id}>
                  <td>#{row.id}</td>
                  <td>{new Date(row.timestamp).toLocaleTimeString()}</td>
                  <td>
                    <span className={`status-badge ${row.source === 'HARDWARE' ? 'online' : 'normal'}`}>
                      {row.source}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>{row.device_id}</td>
                  <td style={{ fontFamily: 'JetBrains Mono' }}>{row.distance_cm.toFixed(1)}</td>
                  <td style={{ fontFamily: 'JetBrains Mono' }}>{row.water_height_cm.toFixed(1)}</td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontWeight: '700', color: '#0284c7' }}>
                    {row.water_level_percent.toFixed(1)}%
                  </td>
                  <td>
                    <span className="status-badge normal">{row.sensor_status}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                  No hardware telemetry packets received yet. Run <code>python hardware_test_simulator.py</code> or connect physical ESP32.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
