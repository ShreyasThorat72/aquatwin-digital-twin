import React, { useState, useEffect } from 'react';
import { useSCADA } from '../context/SCADAContext';
import TankVisualization from '../components/TankVisualization';
import { fetchApi } from '../services/api';
import { 
  AlertTriangle, ShieldAlert, Sparkles, Sliders, 
  Activity, ArrowUpRight, Gauge, Cpu, Zap 
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const { telemetry, actuators, anomaly, leak, forecast, dataSourceMode, controlActuator } = useSCADA();
  const [historyData, setHistoryData] = useState([]);

  // Fetch rolling 30 telemetry points for real-time chart
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const rows = await fetchApi('/api/hardware/history?limit=25');
        setHistoryData(rows);
      } catch (e) {
        console.warn('Dashboard history fetch:', e);
      }
    };
    loadHistory();
    const interval = setInterval(loadHistory, 2000);
    return () => clearInterval(interval);
  }, []);

  const chartLabels = historyData.map(d => {
    const date = new Date(d.timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const chartLevels = historyData.map(d => d.water_level_percent);

  const chartConfig = {
    labels: chartLabels.length ? chartLabels : ['00:00', '00:01', '00:02'],
    datasets: [
      {
        label: 'Water Level (%)',
        data: chartLevels.length ? chartLevels : [50, 50, 50],
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      y: { min: 0, max: 100, grid: { color: '#e2e8f0' } },
      x: { grid: { display: false } }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Activity className="w-6 h-6 text-blue-600" />
            AquaTwin SCADA Master Control Dashboard
          </h1>
          <p className="page-subtitle">
            Real-Time IoT Telemetry • Digital Twin Twin-State Engine • Anomaly & Leak Detection
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`status-badge ${dataSourceMode === 'HARDWARE' ? 'online' : 'normal'}`}>
            ACTIVE SOURCE: {dataSourceMode}
          </span>
        </div>
      </div>

      {/* Alarms / Leaks Alerts Banner */}
      {leak?.is_leak && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: '#dc2626'
        }}>
          <ShieldAlert size={28} />
          <div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>CRITICAL ALARM: POSSIBLE WATER LEAK DETECTED</div>
            <div style={{ fontSize: '0.82rem', marginTop: '2px' }}>
              {leak.reason} (Rate: {leak.rate_of_change_pct_min}%/min | Severity: {leak.severity})
            </div>
          </div>
        </div>
      )}

      {anomaly?.is_anomaly && !leak?.is_leak && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: '#d97706'
        }}>
          <AlertTriangle size={28} />
          <div>
            <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>WARNING: SENSOR ANOMALY DETECTED</div>
            <div style={{ fontSize: '0.82rem', marginTop: '2px' }}>
              {anomaly.reason} (IsolationForest Score: {anomaly.score})
            </div>
          </div>
        </div>
      )}

      {/* Top Main Section: 3D Digital Twin Tank + Quick Controls */}
      <div className="grid-2">
        <TankVisualization telemetry={telemetry} />

        {/* Actuator & SCADA Control Summary Card */}
        <div className="scada-card">
          <div className="card-header">
            <h3 className="card-title">
              <Sliders className="w-5 h-5 text-blue-600" />
              Actuator Status & Control Panel
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
              Mode: {actuators.mode}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px' }}>
            {/* Motor Switch */}
            <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>INLET PUMP MOTOR</span>
                <span className={`status-badge ${actuators.motor === 'ON' ? 'online' : 'offline'}`}>
                  {actuators.motor} (Simulated)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => controlActuator('motor', 'ON')}
                  className={`scada-btn ${actuators.motor === 'ON' ? 'scada-btn-primary' : 'scada-btn-secondary'}`}
                  style={{ flex: 1, padding: '6px', fontSize: '0.78rem', justifyContent: 'center' }}
                >
                  START PUMP
                </button>
                <button 
                  onClick={() => controlActuator('motor', 'OFF')}
                  className={`scada-btn ${actuators.motor === 'OFF' ? 'scada-btn-danger' : 'scada-btn-secondary'}`}
                  style={{ flex: 1, padding: '6px', fontSize: '0.78rem', justifyContent: 'center' }}
                >
                  STOP PUMP
                </button>
              </div>
            </div>

            {/* Inlet Valve */}
            <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>INLET SOLENOID VALVE</span>
                <span className={`status-badge ${actuators.inlet === 'OPEN' ? 'online' : 'offline'}`}>
                  {actuators.inlet} (Simulated)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => controlActuator('inlet', 'OPEN')}
                  className={`scada-btn ${actuators.inlet === 'OPEN' ? 'scada-btn-primary' : 'scada-btn-secondary'}`}
                  style={{ flex: 1, padding: '6px', fontSize: '0.78rem', justifyContent: 'center' }}
                >
                  OPEN VALVE
                </button>
                <button 
                  onClick={() => controlActuator('inlet', 'CLOSED')}
                  className={`scada-btn ${actuators.inlet === 'CLOSED' ? 'scada-btn-danger' : 'scada-btn-secondary'}`}
                  style={{ flex: 1, padding: '6px', fontSize: '0.78rem', justifyContent: 'center' }}
                >
                  CLOSE VALVE
                </button>
              </div>
            </div>

            {/* Outlet Valve */}
            <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>OUTLET DRAIN VALVE</span>
                <span className={`status-badge ${actuators.outlet === 'OPEN' ? 'online' : 'offline'}`}>
                  {actuators.outlet} (Simulated)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => controlActuator('outlet', 'OPEN')}
                  className={`scada-btn ${actuators.outlet === 'OPEN' ? 'scada-btn-primary' : 'scada-btn-secondary'}`}
                  style={{ flex: 1, padding: '6px', fontSize: '0.78rem', justifyContent: 'center' }}
                >
                  DRAIN OPEN
                </button>
                <button 
                  onClick={() => controlActuator('outlet', 'CLOSED')}
                  className={`scada-btn ${actuators.outlet === 'CLOSED' ? 'scada-btn-danger' : 'scada-btn-secondary'}`}
                  style={{ flex: 1, padding: '6px', fontSize: '0.78rem', justifyContent: 'center' }}
                >
                  DRAIN CLOSE
                </button>
              </div>
            </div>

            {/* Mode Control */}
            <div style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>CONTROL LOGIC MODE</span>
                <span className="status-badge normal">
                  {actuators.mode}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => controlActuator('mode', 'AUTO')}
                  className={`scada-btn ${actuators.mode === 'AUTO' ? 'scada-btn-primary' : 'scada-btn-secondary'}`}
                  style={{ flex: 1, padding: '6px', fontSize: '0.78rem', justifyContent: 'center' }}
                >
                  AUTO LOOP
                </button>
                <button 
                  onClick={() => controlActuator('mode', 'MANUAL')}
                  className={`scada-btn ${actuators.mode === 'MANUAL' ? 'scada-btn-primary' : 'scada-btn-secondary'}`}
                  style={{ flex: 1, padding: '6px', fontSize: '0.78rem', justifyContent: 'center' }}
                >
                  MANUAL
                </button>
              </div>
            </div>
          </div>

          {/* AI Forecast Snapshot */}
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '14px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0369a1', fontWeight: '700', fontSize: '0.85rem', marginBottom: '8px' }}>
              <Sparkles size={16} />
              AI RANDOM FOREST MULTI-HORIZON FORECAST
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>NOW</div>
                <div style={{ fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0f172a' }}>{telemetry?.water_level_percent?.toFixed(1)}%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>+10 MIN</div>
                <div style={{ fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0284c7' }}>{forecast?.forecast_10min?.toFixed(1)}%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>+20 MIN</div>
                <div style={{ fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0284c7' }}>{forecast?.forecast_20min?.toFixed(1)}%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>+30 MIN</div>
                <div style={{ fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0284c7' }}>{forecast?.forecast_30min?.toFixed(1)}%</div>
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#0369a1', marginTop: '8px', fontWeight: '600', textAlign: 'right' }}>
              Time to Low Level (≤20%): {forecast?.time_to_low_level || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Graph */}
      <div className="scada-card">
        <div className="card-header">
          <h3 className="card-title">
            <Activity className="w-5 h-5 text-blue-600" />
            Live Real-Time Water Level Telemetry Graph (1-Second Stream)
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Data points: {historyData.length}
          </span>
        </div>
        <div style={{ height: '240px' }}>
          <Line data={chartConfig} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
