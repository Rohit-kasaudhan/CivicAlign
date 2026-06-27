import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, LogOut, Menu, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationContext } from '../../context/NotificationContext';
import { getBadgeInfo } from '../../utils/helpers';
import { useLanguage } from '../../hooks/useLanguage';

const CITIZEN_LINKS = [
  { path: '/dashboard',        tKey: 'nav_dashboard',     label: 'Dashboard' },
  { path: '/report-complaint', tKey: 'nav_report',        label: 'Report' },
  { path: '/my-complaints',    tKey: 'nav_my_complaints', label: 'My Complaints' },
  { path: '/community',        tKey: 'nav_community',     label: 'Community' },
  { path: '/map',              tKey: 'nav_map',           label: 'Map' },
  { path: '/leaderboard',      tKey: 'nav_leaderboard',   label: 'Leaderboard' },
];

const ADMIN_LINKS = [
  { path: '/admin/dashboard',  label: 'Dashboard' },
  { path: '/admin/review',     label: 'Review' },
  { path: '/admin/initiatives',label: 'Initiatives' },
  { path: '/admin/analytics',  label: 'Analytics' },
  { path: '/admin/map',          label: 'Map' },
  { path: '/admin/leaderboard',label: 'Leaderboard' },
  { path: '/admin/copilot',    label: 'AI Copilot' },
];

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const { notifications, markRead, markAllAsRead, unreadCount } = useContext(NotificationContext);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const badgeInfo = getBadgeInfo(user?.points || 0);
  const initials = user?.full_name
    ? user.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const navLinks = user?.role === 'admin' ? ADMIN_LINKS : CITIZEN_LINKS;

  return (
    <nav className="bg-white border-b border-[#DDE3ED] fixed z-[1050] w-full h-16 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">

        {/* Left: hamburger + logo + badge */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="text-xl font-extrabold text-[#1A3A6B] tracking-tight font-poppins">Civic</span>
              <span className="text-xl font-extrabold text-[#5A6A7A] tracking-tight font-poppins">Align</span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop navigation links */}
        {user && (
          <div className="hidden md:flex h-full items-center gap-6">
            {navLinks.map(({ path, tKey, label }) => {
              const active = location.pathname === path || (path !== '/dashboard' && path !== '/admin/dashboard' && location.pathname.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  className={`relative flex items-center h-full text-sm font-semibold transition-colors px-1 border-b-2 ${
                    active
                      ? 'border-[#1A3A6B] text-[#1A3A6B]'
                      : 'border-transparent text-[#5A6A7A] hover:text-[#1A3A6B]'
                  }`}
                >
                  {tKey ? t(tKey) : label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notification bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative p-2 text-[#5A6A7A] hover:text-[#1A3A6B] hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-[#C0392B] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#DDE3ED] z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-[#F4F6FA] border-b border-[#DDE3ED] flex items-center justify-between">
                      <span className="font-bold text-[#1A1A2E] text-sm">{t('notifications')}</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-[#1A3A6B] font-bold hover:underline"
                        >
                          {t('mark_all_read')}
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-gray-400 text-center">
                          {t('no_notifications')}
                        </div>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                              !n.is_read ? 'bg-[#1A3A6B]/5' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {!n.is_read && (
                                <span className="mt-2 w-2 h-2 rounded-full bg-[#1A3A6B] flex-shrink-0" />
                              )}
                              <div className={!n.is_read ? '' : 'ml-4.5'}>
                                <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-normal">{n.message}</p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar + Role Badge */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="w-8 h-8 rounded-full bg-[#1A3A6B] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm border border-[#1A3A6B]/10 font-poppins">
                  {initials}
                </div>
                
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-gray-800 leading-none">
                    {user.full_name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {user.role === 'admin' ? (
                      <span className="text-[9px] font-bold bg-[#1A3A6B]/10 text-[#1A3A6B] border border-[#1A3A6B]/20 px-1.5 py-0.5 rounded uppercase">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-[#0F7B6C]/10 text-[#0F7B6C] border border-[#0F7B6C]/20 px-1.5 py-0.5 rounded uppercase">
                        Citizen
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400 font-medium">
                      ★ {user.points || 0} pts
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title={t('nav_logout')}
                  className="ml-1 p-2 text-[#5A6A7A] hover:text-[#C0392B] hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="text-gray-700 hover:bg-gray-100 font-semibold rounded-lg text-sm px-3.5 py-2 transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                className="text-white bg-[#1A3A6B] hover:bg-[#132c52] font-semibold rounded-lg text-sm px-3.5 py-2 shadow-sm transition-colors"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
