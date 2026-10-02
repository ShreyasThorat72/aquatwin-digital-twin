import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    tank_capacity_liters: '1000',
    tank_height_cm: '150',
    low_level_threshold: '20',
    high_level_threshold: '90',
    esp32_device_id: 'AQUATWIN-ESP32-01',
    telemetry_interval_ms: '1000',
    offline_timeout_seconds: '5',
    sensor_offset_cm: '0',
    min_distance_cm: '2.0',
    max_distance_cm: '400.0',
    min_training_samples: '20',
    forecast_horizon_mins: '30',
    anomaly_sensitivity: '0.1',
    data_source_mode: 'SIMULATION'
  });

  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    try {
      const data = await fetchApi('/api/settings');
      setSettings(prev => ({ ...prev, ...data }));
    } catch (e) {
      console.warn('Settings load error:', e);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key, val) => {
    setSettings({ ...settings, [key]: val });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchApi('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ settings })
      });
      alert('SCADA Physical Parameters Saved Successfully!');
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Settings className="w-6 h-6 text-blue-600" />
            Physical Parameters & SCADA Configuration
          </h1>
          <p className="page-subtitle">
            Tank Specifications • Threshold Alarms • Sensor Calibration • ML Hyperparameters
          </p>
        </div>

        <button onClick={handleSave} disabled={saving} className="scada-btn scada-btn-primary">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <form onSubmit={handleSave}>
        <div className="grid-2">
          {/* Tank & Thresholds */}
          <div className="scada-card">
            <div className="card-header">
              <h3 className="card-title">1. Tank Geometry & Thresholds</h3>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                TANK CAPACITY (LITERS)
              </label>
              <input
                type="number"
                value={settings.tank_capacity_liters}
                onChange={e => handleChange('tank_capacity_liters', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                TANK HEIGHT (CM)
              </label>
              <input
                type="number"
                value={settings.tank_height_cm}
                onChange={e => handleChange('tank_height_cm', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  LOW LEVEL ALARM (%)
                </label>
                <input
                  type="number"
                  value={settings.low_level_threshold}
                  onChange={e => handleChange('low_level_threshold', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  HIGH LEVEL ALARM (%)
                </label>
                <input
                  type="number"
                  value={settings.high_level_threshold}
                  onChange={e => handleChange('high_level_threshold', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>

          {/* Hardware & Communication */}
          <div className="scada-card">
            <div className="card-header">
              <h3 className="card-title">2. ESP32 & Sensor Parameters</h3>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                ESP32 DEVICE IDENTIFIER
              </label>
              <input
                type="text"
                value={settings.esp32_device_id}
                onChange={e => handleChange('esp32_device_id', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'JetBrains Mono' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  TELEMETRY RATE (MS)
                </label>
                <input
                  type="number"
                  value={settings.telemetry_interval_ms}
                  onChange={e => handleChange('telemetry_interval_ms', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  OFFLINE TIMEOUT (SEC)
                </label>
                <input
                  type="number"
                  value={settings.offline_timeout_seconds}
                  onChange={e => handleChange('offline_timeout_seconds', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  MIN DISTANCE (CM)
                </label>
                <input
                  type="number"
                  value={settings.min_distance_cm}
                  onChange={e => handleChange('min_distance_cm', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  MAX DISTANCE (CM)
                </label>
                <input
                  type="number"
                  value={settings.max_distance_cm}
                  onChange={e => handleChange('max_distance_cm', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
