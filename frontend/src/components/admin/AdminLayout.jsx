import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Inbox, Layers, BarChart3,
  Trophy, Sparkles, LogOut, Menu, X, ShieldCheck, Map,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const NAV = [
  { path: '/admin/dashboard',   label: 'Dashboard',         icon: LayoutDashboard },
  { path: '/admin/review',      label: 'Complaint Review',  icon: Inbox },
  { path: '/admin/initiatives', label: 'Initiatives',       icon: Layers },
  { path: '/admin/analytics',   label: 'Analytics',         icon: BarChart3 },
  { path: '/admin/map',         label: 'Map View',          icon: Map },
  { path: '/admin/leaderboard', label: 'Leaderboard',       icon: Trophy },
  { path: '/admin/copilot',     label: 'AI Copilot',        icon: Sparkles },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <ShieldCheck size={22} className="text-blue-400" />
        <div>
          <p className="text-white font-bold text-sm leading-tight">CivicAlign</p>
          <p className="text-blue-400 text-xs font-medium">Admin Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-white/15 text-white'
                  : 'text-slate-400 hover:bg-white/8 hover:text-white'
                }`}
            >
              <Icon size={17} className={active ? 'text-blue-400' : 'text-slate-500'} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Admin info + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.full_name || 'Admin'}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-slate-900 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-60 bg-slate-900 z-50 lg:hidden flex flex-col">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-4 sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <Menu size={18} />
          </button>
          <div>
            <p className="text-sm font-bold text-gray-800">Administrator Portal</p>
            <p className="text-xs text-gray-400 hidden sm:block">
              {NAV.find((n) => location.pathname.startsWith(n.path))?.label || 'CivicAlign'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <ShieldCheck size={14} className="text-blue-600" />
              <span className="font-medium">{user?.full_name || 'Admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 font-medium transition-colors"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
