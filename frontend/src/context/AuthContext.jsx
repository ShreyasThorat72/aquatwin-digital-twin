import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('aquatwin_user');
    return saved ? JSON.parse(saved) : {
      employee_id: 'EMP001',
      name: 'Operator 1',
      department: 'Water Operations',
      designation: 'Senior SCADA Operator',
      assigned_shift: 'Shift A',
      role: 'Operator'
    };
  });

  const [token, setToken] = useState(() => localStorage.getItem('aquatwin_token') || 'demo_token');

  const login = async (employee_id, password) => {
    const data = await fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ employee_id, password }),
    });

    setToken(data.access_token);
    setUser(data.employee);
    localStorage.setItem('aquatwin_token', data.access_token);
    localStorage.setItem('aquatwin_user', JSON.stringify(data.employee));
    return data;
  };

  const logout = async () => {
    try {
      if (user) {
        await fetchApi('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ employee_id: user.employee_id, name: user.name }),
        });
      }
    } catch (e) {
      console.warn('Logout log error:', e);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('aquatwin_token');
    localStorage.removeItem('aquatwin_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
