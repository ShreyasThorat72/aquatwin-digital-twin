import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Globe, RefreshCw, FileText, CheckCircle2, XCircle, Download } from 'lucide-react';

export default function WebScraping() {
  const [dataInfo, setDataInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);

  const loadScrapedData = async () => {
    try {
      const res = await fetchApi('/api/scraping/data');
      setDataInfo(res);
    } catch (e) {
      console.warn('Scraping data fetch:', e);
    }
  };

  useEffect(() => {
    loadScrapedData();
  }, []);

  const triggerScrape = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/api/scraping/run');
      setScrapeResult(res);
      loadScrapedData();
    } catch (err) {
      alert('Scraping failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Globe className="w-6 h-6 text-blue-600" />
            Public Environmental Data & Web Scraper
          </h1>
          <p className="page-subtitle">
            External Water & Weather Dataset Ingestion • Requests + BeautifulSoup4 + Pandas Pipeline
          </p>
        </div>

        <button onClick={triggerScrape} disabled={loading} className="scada-btn scada-btn-primary">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Scraping Live Public Sources...' : 'Run Web Scraper Now'}
        </button>
      </div>

      {scrapeResult && (
        <div className="scada-card" style={{ background: '#f8fafc', borderLeft: '4px solid #0284c7' }}>
          <h4 style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '8px' }}>Scraper Execution Summary</h4>
          {scrapeResult.results.map((r, idx) => (
            <div key={idx} style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              {r.status === 'SUCCESS' ? <CheckCircle2 size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-500" />}
              <strong>{r.source}:</strong> Status [{r.status}] {r.saved_file ? `Saved: ${r.saved_file}` : r.error}
            </div>
          ))}
        </div>
      )}

      {/* Available Public Sources */}
      <div className="scada-card">
        <div className="card-header">
          <h3 className="card-title">Configured Public Data Sources</h3>
        </div>
        <div className="grid-2">
          {dataInfo?.available_sources?.map(src => (
            <div key={src.id} style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', background: '#ffffff' }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>{src.name}</div>
              <div style={{ fontSize: '0.78rem', color: '#0284c7', margin: '4px 0', fontFamily: 'JetBrains Mono' }}>{src.url}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Dataset Category: {src.type}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Database Scraped Log */}
      <div className="scada-card">
        <div className="card-header">
          <h3 className="card-title">Saved Scraped Datasets (SQLite & CSV)</h3>
        </div>
        <table className="scada-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Dataset Type</th>
              <th>Source Name</th>
              <th>Raw Data Snapshot</th>
            </tr>
          </thead>
          <tbody>
            {dataInfo?.database_records?.map(rec => (
              <tr key={rec.id}>
                <td>#{rec.id}</td>
                <td>{new Date(rec.timestamp).toLocaleString()}</td>
                <td><span className="status-badge normal">{rec.dataset_type}</span></td>
                <td><strong>{rec.source_name}</strong></td>
                <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#475569' }}>
                  {rec.data_json.substring(0, 80)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
