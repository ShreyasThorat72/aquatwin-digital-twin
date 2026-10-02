import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { FileSpreadsheet, Download, Eye, RefreshCw, Search } from 'lucide-react';

export default function CsvConsole() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [search, setSearch] = useState('');

  const loadFiles = async () => {
    try {
      const data = await fetchApi('/api/csv/files');
      setFiles(data);
    } catch (e) {
      console.warn('CSV files load:', e);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleView = async (category, filename) => {
    try {
      const res = await fetchApi(`/api/csv/view/${category}/${filename}${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setPreviewData(res);
      setSelectedFile(filename);
    } catch (e) {
      alert('Failed to preview CSV: ' + e.message);
    }
  };

  const handleDownload = (category, filename) => {
    window.open(`http://localhost:8000/api/csv/download/${category}/${filename}`, '_blank');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            CSV Data Console & Export Center
          </h1>
          <p className="page-subtitle">
            Categorized Telemetry & Employee Datasets • Search & Preview • Direct Download
          </p>
        </div>

        <button onClick={loadFiles} className="scada-btn scada-btn-secondary">
          <RefreshCw size={16} /> Sync Files
        </button>
      </div>

      {/* Available CSV Files Grid */}
      <div className="scada-card">
        <div className="card-header">
          <h3 className="card-title">Available Industrial CSV Datasets</h3>
        </div>
        <div className="grid-3">
          {files.map(f => (
            <div key={f.path} style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>{f.filename}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0' }}>
                Category: <strong>{f.category.toUpperCase()}</strong> | Size: {(f.size_bytes / 1024).toFixed(1)} KB
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button onClick={() => handleView(f.category, f.filename)} className="scada-btn scada-btn-primary" style={{ flex: 1, padding: '6px', fontSize: '0.78rem', justifyContent: 'center' }}>
                  <Eye size={14} /> Preview
                </button>
                <button onClick={() => handleDownload(f.category, f.filename)} className="scada-btn scada-btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '0.78rem', justifyContent: 'center' }}>
                  <Download size={14} /> CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Preview Section */}
      {previewData && (
        <div className="scada-card">
          <div className="card-header">
            <h3 className="card-title">Previewing: {previewData.filename} ({previewData.total_rows} rows)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Filter rows..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleView(previewData.category, previewData.filename)}
                style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="scada-table">
              <thead>
                <tr>
                  {previewData.columns.map(col => <th key={col}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {previewData.preview_rows.map((row, idx) => (
                  <tr key={idx}>
                    {previewData.columns.map(col => (
                      <td key={col} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
