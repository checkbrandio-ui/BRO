import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const TOKEN_KEY = 'base44_access_token';
const API_BASE = import.meta.env.VITE_API_URL || 'https://api.bro-crm.ru';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    setIsLoadingAuth(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timeout);
        const json = await res.json();
        if (res.ok && json.data) {
          setUser(json.data);
          setIsAuthenticated(true);
        } else if (res.status === 401) {
          // Только явный 401 — токен невалиден, удаляем
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setIsAuthenticated(false);
        }
        // Иные ошибки (403, 500) — токен не трогаем
      })
      .catch((err) => {
        clearTimeout(timeout);
        // Сетевая ошибка или таймаут — НЕ удаляем токен
        // Пользователь может быть авторизован, просто сеть дала сбой
        // CrmProtectedRoute использует crmSession независимо от AuthContext
        console.warn('[AuthContext] /api/auth/me failed (network/timeout) — token preserved:', err?.message);
      })
      .finally(() => setIsLoadingAuth(false));
  }, []);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('crm_admin_session');
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const checkUserAuth = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setUser(null); setIsAuthenticated(false); return; }
    setIsLoadingAuth(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setUser(json.data);
        setIsAuthenticated(true);
      } else if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      // Сетевая ошибка — не трогаем токен
      console.warn('[AuthContext] checkUserAuth network error — token preserved');
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
