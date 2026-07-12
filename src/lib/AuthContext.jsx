import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const TOKEN_KEY = 'base44_access_token';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false); // не блокируем старт

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    // Если токен не наш JWT (наши начинаются с eyJ и имеют тип crm_admin/agency)
    // проверяем его валидность с таймаутом чтобы не зависать
    setIsLoadingAuth(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 сек таймаут

    fetch(`${import.meta.env.VITE_API_URL || 'https://api.bro-crm.ru'}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timeout);
        const json = await res.json();
        if (res.ok && json.data) {
          setUser(json.data);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        clearTimeout(timeout);
        // Таймаут или сеть — удаляем токен чтобы не зависать
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setIsAuthenticated(false);
      })
      .finally(() => setIsLoadingAuth(false));
  }, []);

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // base44.auth.logout();
    window.location.href = '/';
  };

  const checkUserAuth = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setUser(null); setIsAuthenticated(false); return; }
    setIsLoadingAuth(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.bro-crm.ru'}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (res.ok && json.data) { setUser(json.data); setIsAuthenticated(true); }
      else throw new Error('invalid');
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null); setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, logout, checkUserAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
