import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, FileText, Users,
  Map, Trophy, User, Shield, ClipboardList, BarChart3,
  Lightbulb, Bot, X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

const CITIZEN_NAV = [
  { path: '/dashboard',        tKey: 'nav_dashboard',     label: 'Dashboard',       icon: LayoutDashboard },
  { path: '/report-complaint', tKey: 'nav_report',        label: 'Report Complaint', icon: PlusCircle },
  { path: '/my-complaints',    tKey: 'nav_my_complaints', label: 'My Complaints',    icon: FileText },
  { path: '/community',        tKey: 'nav_community',     label: 'Community Feed',   icon: Users },
  { path: '/map',              tKey: 'nav_map',           label: 'Public Map',       icon: Map },
  { path: '/leaderboard',      tKey: 'nav_leaderboard',   label: 'Leaderboard',      icon: Trophy },
  { path: '/profile',          tKey: 'nav_profile',       label: 'Profile',          icon: User },
];

const ADMIN_NAV = [
  { path: '/admin/dashboard',  label: 'Dashboard',          icon: LayoutDashboard },
  { path: '/admin/review',     label: 'Review Complaints',  icon: ClipboardList },
  { path: '/admin/analytics',  label: 'Analytics',          icon: BarChart3 },
  { path: '/admin/initiatives',label: 'Initiatives',        icon: Lightbulb },
  { path: '/admin/leaderboard',label: 'Leaderboard',        icon: Trophy },
  { path: '/admin/copilot',    label: 'AI Copilot',         icon: Bot },
];

const Sidebar = ({ isOpen = false, onClose }) => {
  const { user } = useAuth();
  const { t }    = useLanguage();
  const location = useLocation();

  const navItems = user?.role === 'admin' ? ADMIN_NAV : CITIZEN_NAV;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Mobile close button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 md:hidden">
        <span className="font-bold text-[#1e40af] text-lg">Menu</span>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ path, tKey, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-50 text-[#1e40af] font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon
                size={18}
                className={active ? 'text-[#1e40af]' : 'text-gray-400'}
              />
              {tKey ? t(tKey) : label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1e40af]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role badge at bottom */}
      {user && (
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Shield size={13} />
            <span className="capitalize">{user.role} account</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-white flex-col z-20">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[1040] md:hidden"
            onClick={onClose}
          />
          <aside className="fixed top-0 left-0 h-full w-64 bg-white z-[1060] md:hidden shadow-xl flex flex-col">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
