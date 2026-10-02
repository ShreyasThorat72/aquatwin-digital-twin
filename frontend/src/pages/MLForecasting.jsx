import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Sparkles, RefreshCw, AlertTriangle, ShieldCheck, Cpu, Activity, BarChart } from 'lucide-react';

export default function MLForecasting() {
  const [mlStatus, setMlStatus] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState(null);

  const loadML = async () => {
    try {
      const st = await fetchApi('/api/ml/status');
      setMlStatus(st);
      const fc = await fetchApi('/api/ml/forecast');
      setForecastData(fc);
    } catch (e) {
      console.warn('ML fetch error:', e);
    }
  };

  useEffect(() => {
    loadML();
    const interval = setInterval(loadML, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    try {
      const res = await fetchApi('/api/ml/train', { method: 'POST' });
      setTrainResult(res);
      loadML();
      alert('ML Pipeline Training Execution Complete!');
    } catch (err) {
      alert('Training error: ' + err.message);
    } finally {
      setTraining(false);
    }
  };

  const forecaster = mlStatus?.forecaster;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Sparkles className="w-6 h-6 text-blue-600" />
            AI Water Level Forecasting & Anomaly Engine
          </h1>
          <p className="page-subtitle">
            RandomForestRegressor Multi-Horizon Predictions • IsolationForest Anomaly Detection
          </p>
        </div>

        <button onClick={handleTrain} disabled={training} className="scada-btn scada-btn-primary">
          <RefreshCw size={16} className={training ? 'animate-spin' : ''} />
          {training ? 'Training Models...' : 'Retrain ML Models on Telemetry'}
        </button>
      </div>

      {trainResult && (
        <div className="scada-card" style={{ background: '#f0fdf4', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontWeight: '700', color: '#15803d' }}>Training Execution Result</div>
          <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
            Forecaster: {trainResult.forecaster_result?.message} | Anomaly: {trainResult.anomaly_result?.message}
          </div>
        </div>
      )}

      {/* Model Performance Cards */}
      <div className="grid-2">
        <div className="scada-card">
          <div className="card-header">
            <h3 className="card-title">
              <Cpu className="w-5 h-5 text-blue-600" />
              RandomForestRegressor Model Metrics
            </h3>
            <span className={`status-badge ${forecaster?.is_trained ? 'online' : 'warning'}`}>
              {forecaster?.is_trained ? 'MODEL TRAINED' : 'INSUFFICIENT DATA / UNTRAINED'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>R² SCORE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0284c7' }}>
                {forecaster?.r2_score !== null ? forecaster?.r2_score : 'N/A'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>MEAN ABSOLUTE ERROR (MAE)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#16a34a' }}>
                {forecaster?.mae !== null ? `${forecaster?.mae} %` : 'N/A'}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>TRAINING SAMPLE SIZE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0f172a' }}>
                {forecaster?.sample_size || 0} records
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>LAST TRAINING TIME</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginTop: '6px' }}>
                {forecaster?.last_train_time ? new Date(forecaster.last_train_time).toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>
        </div>

        {/* Isolation Forest Anomaly Card */}
        <div className="scada-card">
          <div className="card-header">
            <h3 className="card-title">
              <Activity className="w-5 h-5 text-purple-600" />
              IsolationForest Anomaly Detector
            </h3>
            <span className={`status-badge ${mlStatus?.anomaly_detector?.is_trained ? 'online' : 'normal'}`}>
              {mlStatus?.anomaly_detector?.is_trained ? 'ACTIVE' : 'INITIALIZING'}
            </span>
          </div>

          <div style={{ fontSize: '0.85rem', lineHeight: '1.8', color: '#475569' }}>
            <div><strong>Algorithm:</strong> IsolationForest (Contamination = 0.1)</div>
            <div><strong>Features Evaluated:</strong> Water Level %, Ultrasonic Distance (cm), Rate of Change (%/s)</div>
            <div><strong>Statistical Decision Threshold:</strong> Outlier score detection on live stream</div>
            <div><strong>Database Total Telemetry:</strong> {mlStatus?.total_database_telemetry_samples || 0} rows</div>
          </div>
        </div>
      </div>

      {/* Multi-Horizon Live Forecast Display */}
      <div className="scada-card">
        <div className="card-header">
          <h3 className="card-title">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Live Multi-Horizon Water Level Predictions
          </h3>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Model in use: {forecastData?.forecast?.model_used}
          </span>
        </div>

        <div className="grid-4" style={{ textAlign: 'center' }}>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700' }}>CURRENT LEVEL</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#0f172a' }}>
              {forecastData?.current_water_level_percent?.toFixed(1)}%
            </div>
          </div>

          <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '0.78rem', color: '#1d4ed8', fontWeight: '700' }}>+10 MIN FORECAST</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#1e40af' }}>
              {forecastData?.forecast?.forecast_10min?.toFixed(1)}%
            </div>
          </div>

          <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '0.78rem', color: '#1d4ed8', fontWeight: '700' }}>+20 MIN FORECAST</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#1e40af' }}>
              {forecastData?.forecast?.forecast_20min?.toFixed(1)}%
            </div>
          </div>

          <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '0.78rem', color: '#1d4ed8', fontWeight: '700' }}>+30 MIN FORECAST</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'JetBrains Mono', color: '#1e40af' }}>
              {forecastData?.forecast?.forecast_30min?.toFixed(1)}%
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'right', fontWeight: '700', color: '#0284c7', fontSize: '0.9rem' }}>
          Estimated Time Remaining to Critical Low Level (≤20%): {forecastData?.forecast?.time_to_low_level}
        </div>
      </div>
    </div>
  );
}
