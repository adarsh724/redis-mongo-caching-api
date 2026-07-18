import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (token) {
        const decoded = decodeJwt(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setUser({ id: decoded.userId, username: decoded.username, role: decoded.role });
          setLoading(false);
          return;
        }
      }

      // access token missing/expired — try refreshing silently before giving up
      if (refreshToken) {
        try {
          const { data } = await api.post('/api/users/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          const decoded = decodeJwt(data.accessToken);
          setUser({ id: decoded.userId, username: decoded.username, role: decoded.role });
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }

      setLoading(false);
    }

    initAuth();
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/api/users/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    const decoded = decodeJwt(data.accessToken);
    const loggedInUser = { id: decoded.userId, username: decoded.username, role: decoded.role };
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function signup(payload) {
    await api.post('/api/users/create', payload);
    return login(payload.email, payload.password);
  }

  async function logout() {
    try {
      await api.post('/api/users/logout');
    } catch {
      // even if the server call fails (e.g. already expired), clear local state anyway
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
