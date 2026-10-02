import React, { useState } from 'react';
import { fetchApi } from '../services/api';
import { FileText, Download, Filter, CheckCircle2 } from 'lucide-react';

export default function AuditReports() {
  const [operatorId, setOperatorId] = useState('ALL');
  const [shift, setShift] = useState('ALL');
  const [dataSource, setDataSource] = useState('ALL');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/reports/generate?operator_id=${operatorId}&shift=${shift}&data_source=${dataSource}`);
      setReport(res);
    } catch (e) {
      alert('Report generation failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_id}.json`;
    a.click();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileText className="w-6 h-6 text-blue-600" />
            Industrial Operational Audit Report Generator
          </h1>
          <p className="page-subtitle">
            Regulatory Compliance Audit Reports • Operational Summaries & Shift Logs
          </p>
        </div>
      </div>

      {/* Filter Options */}
      <div className="scada-card">
        <div className="card-header">
          <h3 className="card-title"><Filter size={18} className="text-blue-600" /> Report Filters</h3>
        </div>
        <div className="grid-3" style={{ marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>OPERATOR</label>
            <select value={operatorId} onChange={e => setOperatorId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="ALL">ALL OPERATORS</option>
              <option value="EMP001">EMP001 (Operator 1)</option>
              <option value="EMP002">EMP002 (Operator 2)</option>
              <option value="EMP003">EMP003 (Operator 3)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>SHIFT</label>
            <select value={shift} onChange={e => setShift(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="ALL">ALL SHIFTS</option>
              <option value="Shift A">Shift A (00:00 - 08:00)</option>
              <option value="Shift B">Shift B (08:00 - 16:00)</option>
              <option value="Shift C">Shift C (16:00 - 00:00)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>DATA SOURCE</label>
            <select value={dataSource} onChange={e => setDataSource(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="ALL">ALL DATA SOURCES</option>
              <option value="HARDWARE">REAL HARDWARE</option>
              <option value="SIMULATION">SIMULATION</option>
            </select>
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading} className="scada-btn scada-btn-primary">
          <FileText size={16} /> {loading ? 'Generating Report...' : 'Generate Operational Audit Report'}
        </button>
      </div>

      {/* Generated Report Details */}
      {report && (
        <div className="scada-card" style={{ background: '#ffffff', borderTop: '4px solid #0284c7' }}>
          <div className="card-header">
            <h3 className="card-title">Report #{report.report_id}</h3>
            <button onClick={downloadReportJson} className="scada-btn scada-btn-secondary">
              <Download size={16} /> Export Report (JSON)
            </button>
          </div>

          <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '16px', lineHeight: '1.6' }}>
            {report.executive_summary}
          </p>

          <div className="grid-4" style={{ marginBottom: '20px' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>TOTAL READINGS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'JetBrains Mono' }}>
                {report.statistics.total_telemetry_readings}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>AVG WATER LEVEL</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0284c7' }}>
                {report.statistics.average_water_level_pct}%
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>MIN / MAX LEVEL</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'JetBrains Mono' }}>
                {report.statistics.min_water_level_pct}% / {report.statistics.max_water_level_pct}%
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>INCIDENTS & ALARMS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#dc2626' }}>
                {report.statistics.total_alarms_triggered}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
