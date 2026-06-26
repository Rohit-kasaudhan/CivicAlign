import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const tokenKey = isAdminPath ? 'civicalign_admin_token' : 'civicalign_citizen_token';

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(tokenKey));
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async (savedToken) => {
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      setUser(res.data.user);
    } catch {
      localStorage.removeItem(tokenKey);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [tokenKey]);

  // Synchronize token state on route/path changes
  useEffect(() => {
    const activeToken = localStorage.getItem(tokenKey);
    setToken(activeToken);
    restoreSession(activeToken);
  }, [location.pathname, tokenKey, restoreSession]);

  const login = (newToken, userData) => {
    const targetTokenKey = userData.role === 'admin' ? 'civicalign_admin_token' : 'civicalign_citizen_token';
    localStorage.setItem(targetTokenKey, newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(tokenKey);
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, loading: isLoading, login, logout, updateUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
