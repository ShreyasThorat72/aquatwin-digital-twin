import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Users, UserPlus, ShieldCheck, Mail, Calendar } from 'lucide-react';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    department: 'Water Operations',
    designation: 'SCADA Operator',
    assigned_shift: 'Shift A',
    role: 'Operator',
    password: 'pass123'
  });

  const loadEmployees = async () => {
    try {
      const data = await fetchApi('/api/employees');
      setEmployees(data);
    } catch (e) {
      console.warn('Employees fetch error:', e);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/api/employees', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowAddModal(false);
      setFormData({
        employee_id: '',
        name: '',
        department: 'Water Operations',
        designation: 'SCADA Operator',
        assigned_shift: 'Shift A',
        role: 'Operator',
        password: 'pass123'
      });
      loadEmployees();
      alert('Employee created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create employee');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users className="w-6 h-6 text-blue-600" />
            SCADA Operator & Employee Management
          </h1>
          <p className="page-subtitle">
            Plant Personnel Registry • Role-Based Access Control • Shift Assignment
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="scada-btn scada-btn-primary">
          <UserPlus size={16} /> Register New Operator
        </button>
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#ffffff', width: '440px', borderRadius: '10px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px' }}>Add New Operator</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>EMPLOYEE ID</label>
                <input 
                  type="text" required placeholder="e.g. EMP004"
                  value={formData.employee_id}
                  onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'JetBrains Mono' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>FULL NAME</label>
                <input 
                  type="text" required placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>SHIFT</label>
                  <select 
                    value={formData.assigned_shift}
                    onChange={e => setFormData({ ...formData, assigned_shift: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option>Shift A</option>
                    <option>Shift B</option>
                    <option>Shift C</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>ROLE</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option>Operator</option>
                    <option>Admin</option>
                    <option>Supervisor</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>PASSWORD</label>
                <input 
                  type="password" required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="scada-btn scada-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Operator</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="scada-btn scada-btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee List Table */}
      <div className="scada-card">
        <table className="scada-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Full Name</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Assigned Shift</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joining Date</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.employee_id}>
                <td style={{ fontFamily: 'JetBrains Mono', fontWeight: '700', color: '#0284c7' }}>
                  {emp.employee_id}
                </td>
                <td style={{ fontWeight: '600' }}>{emp.name}</td>
                <td>{emp.department}</td>
                <td>{emp.designation}</td>
                <td><span className="status-badge normal">{emp.assigned_shift}</span></td>
                <td><strong>{emp.role}</strong></td>
                <td><span className="status-badge online">{emp.status}</span></td>
                <td style={{ color: '#64748b' }}>{emp.joining_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
