import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSCADA } from '../context/SCADAContext';
import { 
  LayoutDashboard, Activity, Sliders, PlayCircle, Cpu, 
  Users, Clock, Network, Globe, FileSpreadsheet, 
  Sparkles, BarChart3, AlertTriangle, FileText, 
  Terminal, Settings, LogOut, ShieldCheck 
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { unackAlarmsCount } = useSCADA();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">AT</div>
        <div>
          <div className="brand-title">AquaTwin</div>
          <div className="brand-subtitle">SCADA Digital Twin</div>
        </div>
      </div>

      {/* Active Operator Banner */}
      <div className="operator-badge">
        <ShieldCheck size={16} className="text-emerald-600" />
        <div>
          <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.8rem' }}>
            {user?.name || 'Operator 1'}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {user?.employee_id || 'EMP001'} • {user?.role || 'Operator'}
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">MONITORING & CONTROL</div>
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          Main Dashboard
        </NavLink>
        <NavLink to="/tank-monitoring" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Activity size={18} />
          Tank Monitoring
        </NavLink>
        <NavLink to="/tank-control" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Sliders size={18} />
          Tank Control Panel
        </NavLink>
        <NavLink to="/simulation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PlayCircle size={18} />
          Live Simulation
        </NavLink>
        <NavLink to="/hardware" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Cpu size={18} />
          Hardware & IoT
        </NavLink>

        <div className="nav-section-title">OPERATIONS & DATA</div>
        <NavLink to="/employees" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={18} />
          Operator Management
        </NavLink>
        <NavLink to="/shifts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Clock size={18} />
          Shift Management
        </NavLink>
        <NavLink to="/data-structures" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Network size={18} />
          Data Structures
        </NavLink>
        <NavLink to="/web-scraping" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Globe size={18} />
          Web Scraping
        </NavLink>
        <NavLink to="/csv-console" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileSpreadsheet size={18} />
          CSV Data Console
        </NavLink>

        <div className="nav-section-title">INTELLIGENCE & AUDIT</div>
        <NavLink to="/ml-forecasting" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Sparkles size={18} />
          AI Leak & Forecast
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={18} />
          Analytics & Telemetry
        </NavLink>
        <NavLink to="/alarms" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={18} />
          <span>Alarms & Alerts</span>
          {unackAlarmsCount > 0 && (
            <span style={{
              marginLeft: 'auto',
              background: '#dc2626',
              color: 'white',
              fontSize: '0.68rem',
              fontWeight: '800',
              padding: '1px 6px',
              borderRadius: '10px'
            }}>
              {unackAlarmsCount}
            </span>
          )}
        </NavLink>
        <NavLink to="/audit-reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={18} />
          Audit Reports
        </NavLink>
        <NavLink to="/system-logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Terminal size={18} />
          System Logs
        </NavLink>
        <NavLink to="/system-settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={18} />
          System Settings
        </NavLink>
      </nav>

      {/* Logout Footer */}
      <div className="sidebar-footer">
        <button 
          onClick={handleLogout} 
          className="scada-btn scada-btn-danger" 
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <LogOut size={16} />
          Terminate Session
        </button>
      </div>
    </aside>
  );
}
