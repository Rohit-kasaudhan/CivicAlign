import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, FileText, Map, User } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

const ITEMS = [
  { path: '/dashboard',        icon: LayoutDashboard, tKey: 'nav_dashboard' },
  { path: '/my-complaints',    icon: FileText,        tKey: 'nav_my_complaints' },
  { path: '/report-complaint', icon: PlusCircle,      tKey: 'nav_report', primary: true },
  { path: '/map',              icon: Map,             tKey: 'nav_map' },
  { path: '/profile',          icon: User,            tKey: 'nav_profile' },
];

const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { t } = useLanguage();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-center justify-around h-16 px-2 safe-b">
      {ITEMS.map(({ path, icon: Icon, tKey, primary }) => {
        const active = pathname === path;
        const label = t(tKey);
        if (primary) {
          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center justify-center -mt-5 w-14 h-14 rounded-2xl bg-[#1e40af] text-white shadow-lg shadow-blue-200"
            >
              <Icon size={22} />
              <span className="text-[9px] font-bold mt-0.5 max-w-full px-1 truncate">{label}</span>
            </Link>
          );
        }
        return (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-0
              ${active ? 'text-[#1e40af]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span className={`text-[10px] font-medium max-w-14 truncate ${active ? 'font-bold' : ''}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
