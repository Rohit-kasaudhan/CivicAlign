import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, XCircle, Info, Trophy, X } from 'lucide-react';

export const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

let _nextId = 0;

const STYLES = {
  success: {
    wrap:  'bg-green-50 border-green-200 text-green-800',
    icon:  CheckCircle,
    iCls:  'text-green-500',
  },
  error: {
    wrap:  'bg-red-50 border-red-200 text-red-800',
    icon:  XCircle,
    iCls:  'text-red-500',
  },
  info: {
    wrap:  'bg-blue-50 border-blue-200 text-blue-800',
    icon:  Info,
    iCls:  'text-blue-500',
  },
  badge: {
    wrap:  'bg-amber-50 border-amber-200 text-amber-800',
    icon:  Trophy,
    iCls:  'text-amber-500',
  },
};

const ToastItem = ({ id, type, message, onClose }) => {
  const s = STYLES[type] || STYLES.info;
  const Icon = s.icon;
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm max-w-sm w-full
        animate-in slide-in-from-right-4 duration-200 ${s.wrap}`}
    >
      <Icon size={16} className={`mt-0.5 shrink-0 ${s.iCls}`} />
      <span className="flex-1 leading-snug">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = {
    success: (msg, dur) => show(msg, 'success', dur),
    error:   (msg, dur) => show(msg, 'error',   dur),
    info:    (msg, dur) => show(msg, 'info',     dur),
    badge:   (msg, dur) => show(msg, 'badge',    dur ?? 6000),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onClose={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
