import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchApi, getWsUrl } from '../services/api';

const SCADAContext = createContext();

export function SCADAProvider({ children }) {
  const [telemetry, setTelemetry] = useState({
    device_id: 'AQUATWIN-ESP32-01',
    distance_cm: 75.0,
    water_height_cm: 75.0,
    water_level_percent: 50.0,
    volume_liters: 500.0,
    timestamp: new Date().toISOString(),
    uptime_ms: 0,
    sensor_status: 'NORMAL',
    source: 'SIMULATION',
    data_source: 'SIMULATION'
  });

  const [actuators, setActuators] = useState({
    motor: 'OFF',
    inlet: 'CLOSED',
    outlet: 'OPEN',
    mode: 'MANUAL'
  });

  const [esp32Health, setEsp32Health] = useState({
    status: 'OFFLINE',
    last_packet_age_seconds: null,
    device_id: 'AQUATWIN-ESP32-01',
    packet_count: 0,
    invalid_packet_count: 0
  });

  const [dataSourceMode, setDataSourceMode] = useState('SIMULATION'); // HARDWARE or SIMULATION
  const [wsStatus, setWsStatus] = useState('CONNECTING'); // CONNECTED, CONNECTING, DISCONNECTED
  const [anomaly, setAnomaly] = useState({ is_anomaly: false, score: 0.5, reason: 'NORMAL' });
  const [leak, setLeak] = useState({ is_leak: false, status: 'NORMAL', severity: 'NONE', reason: '' });
  const [forecast, setForecast] = useState({ forecast_10min: 50.0, forecast_20min: 50.0, forecast_30min: 50.0, time_to_low_level: 'STABLE' });
  const [activeShift, setActiveShift] = useState({ active_shift: 'Shift B', remaining_time: '5h 30m', assigned_operator: { name: 'Operator 1' } });
  const [unackAlarmsCount, setUnackAlarmsCount] = useState(0);

  const wsRef = useRef(null);

  // Fetch initial system state & shift info
  const refreshState = async () => {
    try {
      const stateData = await fetchApi('/api/tank/state');
      if (stateData.tank_state) setTelemetry(stateData.tank_state);
      if (stateData.actuators) setActuators(stateData.actuators);
      if (stateData.esp32_health) setEsp32Health(stateData.esp32_health);
      if (stateData.data_source_mode) setDataSourceMode(stateData.data_source_mode);

      const shiftData = await fetchApi('/api/shifts/active');
      setActiveShift(shiftData);

      const alarmsData = await fetchApi('/api/alarms?unacknowledged_only=true');
      setUnackAlarmsCount(alarmsData.unacknowledged_count);
    } catch (e) {
      console.warn('[SCADA] Initial fetch state warning:', e);
    }
  };

  useEffect(() => {
    refreshState();
  }, []);

  // WebSocket Connection Lifecycle
  useEffect(() => {
    let reconnectTimeout = null;

    const connectWS = () => {
      setWsStatus('CONNECTING');
      const targetWsUrl = getWsUrl();
      console.log(`[WebSocket] Connecting to: ${targetWsUrl}`);
      const ws = new WebSocket(targetWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected to AquaTwin SCADA WS server');
        setWsStatus('CONNECTED');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'TELEMETRY_UPDATE' || msg.type === 'INITIAL_SNAPSHOT') {
            if (msg.telemetry) setTelemetry(msg.telemetry);
            if (msg.actuators) setActuators(msg.actuators);
            if (msg.esp32_status) setEsp32Health(msg.esp32_status);
            if (msg.data_source_mode) setDataSourceMode(msg.data_source_mode);
            if (msg.anomaly) setAnomaly(msg.anomaly);
            if (msg.leak) setLeak(msg.leak);
            if (msg.forecast) setForecast(msg.forecast);
          }
        } catch (err) {
          console.error('[WebSocket Message Error]:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WebSocket Error]:', err);
        setWsStatus('DISCONNECTED');
      };

      ws.onclose = () => {
        console.warn('[WebSocket Closed]. Retrying in 3 seconds...');
        setWsStatus('DISCONNECTED');
        reconnectTimeout = setTimeout(connectWS, 3000);
      };
    };

    connectWS();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Toggle Global Mode (HARDWARE vs SIMULATION)
  const setMode = async (newMode) => {
    try {
      await fetchApi('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: { data_source_mode: newMode } })
      });
      setDataSourceMode(newMode);
    } catch (e) {
      console.error('Failed to change mode:', e);
    }
  };

  // Actuator Control
  const controlActuator = async (actuator, command) => {
    try {
      const res = await fetchApi('/api/tank/actuators', {
        method: 'POST',
        body: JSON.stringify({ actuator, command })
      });
      setActuators(res.all_actuators);
    } catch (e) {
      console.error('Actuator control failed:', e);
    }
  };

  return (
    <SCADAContext.Provider value={{
      telemetry,
      actuators,
      esp32Health,
      dataSourceMode,
      wsStatus,
      anomaly,
      leak,
      forecast,
      activeShift,
      unackAlarmsCount,
      setMode,
      controlActuator,
      refreshState
    }}>
      {children}
    </SCADAContext.Provider>
  );
}

export const useSCADA = () => useContext(SCADAContext);
