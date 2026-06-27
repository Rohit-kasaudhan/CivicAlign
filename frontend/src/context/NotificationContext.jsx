import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { ToastContext } from './ToastContext';

export const NotificationContext = createContext(null);

const POLL_INTERVAL = 30_000; // 30 s

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { token } = useAuth();
  const toast     = useContext(ToastContext);
  const seenRef   = useRef(new Set());

  const fetchNotifications = async () => {
    try {
      const res  = await api.get('/notifications');
      const list = res.data.notifications || [];

      // Fire toast for new badge notifications not yet seen
      list.forEach((n) => {
        if (n.type === 'badge' && !n.is_read && !seenRef.current.has(n.id)) {
          const isPublicPage = ['/', '/login', '/register', '/forgot-password'].includes(window.location.pathname);
          if (!isPublicPage) {
            seenRef.current.add(n.id);
            toast?.badge(n.message || n.title, 6000);
          }
        }
      });

      setNotifications(list);
    } catch {}
  };

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      seenRef.current.clear();
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [token]);

  const markRead = (id) => {
    api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = () => {
    api.put('/notifications/read-all').catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const addNotification = (title, message, type = 'info') => {
    setNotifications((prev) => [
      { id: Date.now(), title, message, type, is_read: false },
      ...prev,
    ]);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, markRead, markAllAsRead, unreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
