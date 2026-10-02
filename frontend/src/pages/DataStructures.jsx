import React from 'react';
import { useSCADA } from '../context/SCADAContext';
import { Network, List, Layers, Database, GitFork } from 'lucide-react';

export default function DataStructures() {
  const { telemetry, actuators, esp32Health } = useSCADA();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Network className="w-6 h-6 text-blue-600" />
            Data Structures & Software Architecture
          </h1>
          <p className="page-subtitle">
            Core Computer Science Data Structures Used Across AquaTwin SCADA Core
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* LIST */}
        <div className="scada-card">
          <div className="card-header">
            <h3 className="card-title"><List size={18} className="text-blue-600" /> 1. LIST Structure: Telemetry History</h3>
            <span className="status-badge normal">Dynamic Array</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '12px' }}>
            Stores sequential time-series telemetry objects for fast index lookup and rolling window calculations.
          </p>
          <div style={{ background: '#0f172a', color: '#38bdf8', padding: '12px', borderRadius: '6px', fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>
            [<br />
            &nbsp;&nbsp;&#123; id: 101, level: {telemetry.water_level_percent}%, timestamp: "{telemetry.timestamp}" &#125;,<br />
            &nbsp;&nbsp;&#123; id: 102, level: 51.2%, timestamp: "2026-10-02T19:00:01" &#125;<br />
            ]
          </div>
        </div>

        {/* QUEUE */}
        <div className="scada-card">
          <div className="card-header">
            <h3 className="card-title"><Layers size={18} className="text-emerald-600" /> 2. QUEUE Structure: Real-Time Event Pipeline</h3>
            <span className="status-badge normal">FIFO Event Queue</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '12px' }}>
            First-In-First-Out (FIFO) buffer processing incoming WebSocket telemetry events asynchronously without blocking main execution thread.
          </p>
          <div style={{ background: '#0f172a', color: '#4ade80', padding: '12px', borderRadius: '6px', fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>
            Head -&gt; [PACKET_001] -&gt; [PACKET_002] -&gt; [PACKET_003] -&gt; Tail (Enqueue rate: 1000ms)
          </div>
        </div>

        {/* DICTIONARY */}
        <div className="scada-card">
          <div className="card-header">
            <h3 className="card-title"><Database size={18} className="text-purple-600" /> 3. DICTIONARY Structure: Current Tank & Device State</h3>
            <span className="status-badge normal">Hash Map (O(1))</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '12px' }}>
            Key-value state container offering constant-time O(1) lookups for current telemetry and actuator values.
          </p>
          <div style={{ background: '#0f172a', color: '#c084fc', padding: '12px', borderRadius: '6px', fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>
            &#123;<br />
            &nbsp;&nbsp;"water_level_percent": {telemetry.water_level_percent},<br />
            &nbsp;&nbsp;"motor_status": "{actuators.motor}",<br />
            &nbsp;&nbsp;"esp32_status": "{esp32Health.status}"<br />
            &#125;
          </div>
        </div>

        {/* TREE */}
        <div className="scada-card">
          <div className="card-header">
            <h3 className="card-title"><GitFork size={18} className="text-amber-600" /> 4. TREE Structure: Alarm Severity Hierarchy</h3>
            <span className="status-badge normal">Hierarchical Tree</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '12px' }}>
            Organizes system alarms into a tree hierarchy (Root -&gt; Category -&gt; Severity) for priority evaluation and propagation.
          </p>
          <div style={{ background: '#0f172a', color: '#fbbf24', padding: '12px', borderRadius: '6px', fontFamily: 'JetBrains Mono', fontSize: '0.78rem' }}>
            ROOT (SCADA System)<br />
            ├── TELEMETRY ALARMS<br />
            │   ├── CRITICAL: POSSIBLE_LEAK<br />
            │   └── WARNING:  LOW_LEVEL (≤20%)<br />
            └── HARDWARE ALARMS<br />
            &nbsp;&nbsp;&nbsp;&nbsp;└── CRITICAL: ESP32_OFFLINE
          </div>
        </div>
      </div>
    </div>
  );
}
