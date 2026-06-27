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
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#DDE3ED]">
        <ShieldCheck size={22} className="text-[#1A3A6B]" />
        <div>
          <p className="text-[#1A1A2E] font-bold text-sm leading-tight font-poppins">CivicAlign</p>
          <p className="text-[#1A3A6B] text-[10px] font-bold uppercase tracking-wider">Admin Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || (path !== '/admin/dashboard' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all h-10
                ${active
                  ? 'bg-[#1A3A6B]/10 border-l-[3px] border-[#1A3A6B] text-[#1A3A6B]'
                  : 'text-[#5A6A7A] hover:bg-[#F4F6FA] hover:text-[#1A1A2E]'
                }`}
            >
              <Icon size={17} className={active ? 'text-[#1A3A6B]' : 'text-[#5A6A7A]'} />
              <span className="flex-1 truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin info + logout */}
      <div className="px-4 py-4 border-t border-[#DDE3ED] bg-[#F4F6FA]/50">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#1A3A6B] flex items-center justify-center text-white text-xs font-bold shrink-0 font-poppins shadow-sm">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[#1A1A2E] text-xs font-bold truncate leading-normal">{user?.full_name || 'Admin'}</p>
            <span className="text-[9px] font-bold bg-[#1A3A6B]/10 text-[#1A3A6B] border border-[#1A3A6B]/20 px-1 py-0.2 rounded uppercase">
              Administrator
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-100 hover:border-red-200 rounded-lg text-[#C0392B] bg-red-50/50 hover:bg-red-50 text-xs font-bold transition-colors"
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-[#DDE3ED] fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-60 bg-white border-r border-[#DDE3ED] z-50 lg:hidden flex flex-col">
            {mobileOpen && (
              <div className="absolute top-4 right-4 z-50 lg:hidden">
                <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                  <X size={18} />
                </button>
              </div>
            )}
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-[#DDE3ED] px-4 sm:px-6 h-16 flex items-center gap-4 sticky top-0 z-25 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Menu size={18} />
          </button>
          <div>
            <p className="text-sm font-extrabold text-[#1A1A2E] font-poppins leading-none">Administrator Portal</p>
            <p className="text-[10px] text-[#5A6A7A] mt-1 font-semibold uppercase tracking-wider hidden sm:block">
              {NAV.find((n) => location.pathname.startsWith(n.path))?.label || 'CivicAlign'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-[#1A1A2E]">
              <ShieldCheck size={14} className="text-[#1A3A6B]" />
              <span className="font-bold">{user?.full_name || 'Admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-[#5A6A7A] hover:text-[#C0392B] font-bold transition-colors border border-transparent hover:border-red-100 hover:bg-red-50 px-2.5 py-1.5 rounded-lg"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto page-fade">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
