import React, { useState, useEffect } from 'react';
import { useSCADA } from '../context/SCADAContext';
import { fetchApi } from '../services/api';
import { Activity, Gauge, Droplet, ArrowDownUp, BarChart, RefreshCw } from 'lucide-react';
import { Line } from 'react-chartjs-2';

export default function TankMonitoring() {
  const { telemetry, dataSourceMode, esp32Health } = useSCADA();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ avg: 0, min: 0, max: 0, count: 0 });

  const loadTelemetryData = async () => {
    try {
      const rows = await fetchApi('/api/hardware/history?limit=50');
      setHistory(rows);
      if (rows.length > 0) {
        const levels = rows.map(r => r.water_level_percent);
        const sum = levels.reduce((a, b) => a + b, 0);
        setStats({
          avg: (sum / levels.length).toFixed(1),
          min: Math.min(...levels).toFixed(1),
          max: Math.max(...levels).toFixed(1),
          count: rows.length
        });
      }
    } catch (e) {
      console.warn('Tank monitoring fetch error:', e);
    }
  };

  useEffect(() => {
    loadTelemetryData();
    const interval = setInterval(loadTelemetryData, 2000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: history.map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
    datasets: [
      {
        label: 'Water Level (%)',
        data: history.map(d => d.water_level_percent),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        fill: true,
        tension: 0.2
      },
      {
        label: 'Water Height (cm)',
        data: history.map(d => d.water_height_cm),
        borderColor: '#16a34a',
        backgroundColor: 'transparent',
        borderDash: [5, 5]
      }
    ]
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Activity className="w-6 h-6 text-blue-600" />
            Tank Telemetry & Level Monitoring
          </h1>
          <p className="page-subtitle">
            Real-Time Level & Volume Metrics • Ultrasonic Sensor Health • Statistical Analysis
          </p>
        </div>

        <button onClick={loadTelemetryData} className="scada-btn scada-btn-secondary">
          <RefreshCw size={16} /> Refresh Metrics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <div className="scada-card" style={{ marginBottom: 0 }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>WATER LEVEL</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0284c7' }}>
            {telemetry?.water_level_percent?.toFixed(1)} %
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Mode: {dataSourceMode}</div>
        </div>

        <div className="scada-card" style={{ marginBottom: 0 }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>WATER HEIGHT</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#16a34a' }}>
            {telemetry?.water_height_cm?.toFixed(1)} cm
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Tank Max: 150.0 cm</div>
        </div>

        <div className="scada-card" style={{ marginBottom: 0 }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>VOLUME</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0f172a' }}>
            {telemetry?.volume_liters?.toFixed(1)} L
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Capacity: 1000 L</div>
        </div>

        <div className="scada-card" style={{ marginBottom: 0 }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>ULTRASONIC DISTANCE</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#d97706' }}>
            {telemetry?.distance_cm?.toFixed(1)} cm
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>HC-SR04 Raw Echo</div>
        </div>
      </div>

      {/* Historical Telemetry Graph */}
      <div className="scada-card">
        <div className="card-header">
          <h3 className="card-title">
            <BarChart size={18} className="text-blue-600" />
            Historical Telemetry & Level Trend Chart
          </h3>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>
            <span>AVG: {stats.avg}%</span>
            <span>MIN: {stats.min}%</span>
            <span>MAX: {stats.max}%</span>
            <span>SAMPLES: {stats.count}</span>
          </div>
        </div>

        <div style={{ height: '300px' }}>
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
}
