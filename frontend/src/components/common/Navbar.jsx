import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useContext } from 'react';
import { NotificationContext } from '../../context/NotificationContext';
import { getBadgeInfo } from '../../utils/helpers';
import { useLanguage } from '../../hooks/useLanguage';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
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

  return (
    <nav className="bg-white border-b border-gray-200 fixed z-[1050] w-full h-16">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">

        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
          )}
          <Link to="/" className="flex items-center gap-1">
            <span className="text-xl font-extrabold text-[#1e40af]">Civic</span>
            <span className="text-xl font-extrabold text-gray-800">Align</span>
          </Link>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">

          {user ? (
            <>
              {/* Notification bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen((o) => !o)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-semibold text-gray-800 text-sm">{t('notifications')}</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-[#1e40af] font-medium hover:underline"
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
                              !n.is_read ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {!n.is_read && (
                                <span className="mt-1.5 w-2 h-2 rounded-full bg-[#1e40af] flex-shrink-0" />
                              )}
                              <div className={!n.is_read ? '' : 'ml-4'}>
                                <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User avatar + name + badge */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#1e40af] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {initials}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold text-gray-800 leading-none">
                    {user.full_name}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {badgeInfo.current.emoji} {user.current_badge || badgeInfo.current.name}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title={t('nav_logout')}
                  className="ml-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="text-gray-700 hover:bg-gray-100 font-medium rounded-lg text-sm px-3 py-1.5"
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                className="text-white bg-[#1e40af] hover:bg-blue-800 font-medium rounded-lg text-sm px-3 py-1.5"
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


