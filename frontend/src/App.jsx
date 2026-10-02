import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SCADAProvider } from './context/SCADAContext';
import MainLayout from './layouts/MainLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TankMonitoring from './pages/TankMonitoring';
import TankControl from './pages/TankControl';
import LiveSimulation from './pages/LiveSimulation';
import HardwareIoT from './pages/HardwareIoT';
import EmployeeManagement from './pages/EmployeeManagement';
import ShiftManagement from './pages/ShiftManagement';
import DataStructures from './pages/DataStructures';
import WebScraping from './pages/WebScraping';
import CsvConsole from './pages/CsvConsole';
import MLForecasting from './pages/MLForecasting';
import Analytics from './pages/Analytics';
import Alarms from './pages/Alarms';
import AuditReports from './pages/AuditReports';
import SystemLogs from './pages/SystemLogs';
import SystemSettings from './pages/SystemSettings';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <SCADAProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="tank-monitoring" element={<TankMonitoring />} />
              <Route path="tank-control" element={<TankControl />} />
              <Route path="simulation" element={<LiveSimulation />} />
              <Route path="hardware" element={<HardwareIoT />} />
              <Route path="employees" element={<EmployeeManagement />} />
              <Route path="shifts" element={<ShiftManagement />} />
              <Route path="data-structures" element={<DataStructures />} />
              <Route path="web-scraping" element={<WebScraping />} />
              <Route path="csv-console" element={<CsvConsole />} />
              <Route path="ml-forecasting" element={<MLForecasting />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="alarms" element={<Alarms />} />
              <Route path="audit-reports" element={<AuditReports />} />
              <Route path="system-logs" element={<SystemLogs />} />
              <Route path="system-settings" element={<SystemSettings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SCADAProvider>
    </AuthProvider>
  );
}
