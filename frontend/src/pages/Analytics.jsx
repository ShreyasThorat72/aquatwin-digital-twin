import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { BarChart3, Filter, RefreshCw, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Line } from 'react-chartjs-2';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [sourceFilter, setSourceFilter] = useState('ALL');

  const loadAnalytics = async () => {
    try {
      const res = await fetchApi(`/api/analytics?source=${sourceFilter}`);
      setData(res);
    } catch (e) {
      console.warn('Analytics load error:', e);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [sourceFilter]);

  const stats = data?.statistics || {};
  const chartData = {
    labels: (data?.chart_data || []).map(d => new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: 'Water Level (%)',
        data: (data?.chart_data || []).map(d => d.water_level_percent),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        fill: true,
        tension: 0.2
      }
    ]
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Historical Analytics & SCADA Industrial Metrics
          </h1>
          <p className="page-subtitle">
            Plant Operations Telemetry Aggregation • Statistical Distributions & Incidents
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Filter size={16} className="text-slate-400" />
          <select 
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
          >
            <option value="ALL">ALL DATA SOURCES</option>
            <option value="HARDWARE">REAL HARDWARE ONLY</option>
            <option value="SIMULATION">SIMULATION ONLY</option>
          </select>
          <button onClick={loadAnalytics} className="scada-btn scada-btn-secondary">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <div className="scada-card" style={{ marginBottom: 0 }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>TOTAL READINGS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0f172a' }}>
            {stats.reading_count || 0}
          </div>
        </div>

        <div className="scada-card" style={{ marginBottom: 0 }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>AVERAGE WATER LEVEL</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0284c7' }}>
            {stats.avg_level || 0} %
          </div>
        </div>

        <div className="scada-card" style={{ marginBottom: 0 }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>MIN / MAX LEVEL</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#16a34a' }}>
            {stats.min_level || 0}% / {stats.max_level || 0}%
          </div>
        </div>

        <div className="scada-card" style={{ marginBottom: 0 }}>
          <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '700' }}>ALARMS / LEAKS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#dc2626' }}>
            {stats.total_alarms || 0} Alarms ({stats.leak_events || 0} Leaks)
          </div>
        </div>
      </div>

      <div className="scada-card">
        <div className="card-header">
          <h3 className="card-title">Telemetry Trend Chart ({sourceFilter})</h3>
        </div>
        <div style={{ height: '300px' }}>
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
}
