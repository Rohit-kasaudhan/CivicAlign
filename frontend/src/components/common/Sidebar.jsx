import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, PlusCircle, FileText, Users,
  Map, Trophy, User, X, Star
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

const Sidebar = ({ isOpen = false, onClose }) => {
  const { user } = useAuth();
  const { t }    = useLanguage();
  const location = useLocation();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile close button */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#DDE3ED] md:hidden bg-[#F4F6FA]">
        <span className="font-bold text-[#1A3A6B] text-base font-poppins">Navigation Menu</span>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {CITIZEN_NAV.map(({ path, tKey, label, icon: Icon }) => {
          const active = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all h-10 ${
                active
                  ? 'bg-[#1A3A6B]/10 border-l-[3px] border-[#1A3A6B] text-[#1A3A6B]'
                  : 'text-[#5A6A7A] hover:bg-[#F4F6FA] hover:text-[#1A1A2E]'
              }`}
            >
              <Icon
                size={18}
                className={active ? 'text-[#1A3A6B]' : 'text-[#5A6A7A]'}
              />
              <span className="flex-1 truncate">{tKey ? t(tKey) : label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Card at bottom */}
      {user && (
        <div className="px-4 py-4 border-t border-[#DDE3ED] bg-[#F4F6FA]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1A3A6B]/15 text-[#1A3A6B] text-xs font-bold flex items-center justify-center flex-shrink-0 font-poppins">
              {user.full_name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#1A1A2E] truncate leading-normal">{user.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-bold bg-[#0F7B6C]/10 text-[#0F7B6C] border border-[#0F7B6C]/20 px-1 py-0.2 rounded uppercase">
                  Citizen
                </span>
                <span className="text-[10px] text-[#5A6A7A] font-bold flex items-center gap-0.5">
                  <Star size={10} className="text-[#F5A623] fill-[#F5A623]" /> {user.points || 0} pts
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-16 left-0 h-[calc(100vh-4rem)] w-60 border-r border-[#DDE3ED] bg-white flex-col z-20">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[1040] md:hidden"
            onClick={onClose}
          />
          <aside className="fixed top-0 left-0 h-full w-60 bg-white z-[1060] md:hidden shadow-xl flex flex-col">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
