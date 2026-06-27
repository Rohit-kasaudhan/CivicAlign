import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, CheckCircle2, Clock, Star, Plus, Bell,
  ChevronRight, TrendingUp, Sparkles, Award
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { NotificationContext } from '../../context/NotificationContext';
import { getMyComplaints } from '../../api/complaints';
import { getBadgeInfo, formatDate } from '../../utils/helpers';
import StatusBadge from '../../components/common/StatusBadge';
import {
  formatRelativeTimeLocalized,
  translateBadge,
  translateCategory,
  translateNotification,
} from '../../utils/i18n';

const StatCard = ({ icon: Icon, value, label, bgIcon, textIcon, loading }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5 flex items-center gap-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] transition-all">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgIcon}`}>
      <Icon size={22} className={textIcon} />
    </div>
    <div>
      <div className="text-2xl font-extrabold text-gray-900 font-poppins">
        {loading ? <span className="animate-pulse bg-gray-200 rounded w-8 h-6 inline-block" /> : value}
      </div>
      <div className="text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  </div>
);

const BadgeCard = ({ user, t }) => {
  const { current, next, progress } = getBadgeInfo(user?.points || 0);
  const currentName = user?.current_badge || current.name;
  return (
    <div className="bg-gradient-to-br from-[#1A3A6B] to-[#0D1E3A] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <p className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">{t('dash_badge')}</p>
          <h3 className="text-2xl font-extrabold mt-1 font-poppins flex items-center gap-2">
            <span>{current.emoji}</span>
            <span>{translateBadge(t, currentName)}</span>
          </h3>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold font-poppins text-[#F5A623]">{(user?.points || 0).toLocaleString()}</div>
          <p className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">{t('total_points')}</p>
        </div>
      </div>

      {next ? (
        <div className="relative z-10">
          <div className="flex justify-between text-xs text-slate-300 mb-2">
            <span className="font-semibold">{translateBadge(t, current.name)}</span>
            <span className="font-semibold text-[#F5A623]">
              {next.emoji} {t('next_badge_at').replace('{badge}', translateBadge(t, next.name)).replace('{points}', next.min)}
            </span>
          </div>
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div className="h-full bg-gradient-to-r from-[#0F7B6C] to-[#F5A623] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-slate-300 mt-2.5">
            {t('points_to_badge')
              .replace('{points}', Math.max(0, next.min - (user?.points || 0)))
              .replace('{badge}', translateBadge(t, next.name))}
          </p>
        </div>
      ) : (
        <p className="text-slate-300 text-sm mt-2 font-medium flex items-center gap-2">
          <Award size={16} className="text-[#F5A623]" /> {t('highest_badge')}
        </p>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { notifications, markRead, unreadCount } = useContext(NotificationContext);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyComplaints()
      .then((data) => setComplaints(data.complaints || []))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  }, []);

  const total = complaints.length;
  const active = complaints.filter((c) => !['resolved', 'closed'].includes(c.status)).length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;
  const recent = complaints.slice(0, 5);

  const quickLinks = [
    { to: '/report-complaint', label: t('report_new_issue'), icon: '📝' },
    { to: '/community', label: t('nav_community'), icon: '👥' },
    { to: '/map', label: t('view_public_map'), icon: '🗺️' },
    { to: '/leaderboard', label: t('nav_leaderboard'), icon: '🏆' },
  ];

  return (
    <div className="space-y-6 max-w-6xl page-fade">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1A3A6B] to-[#0F7B6C] rounded-xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-10 -translate-y-10">
          <Sparkles size={160} />
        </div>
        <h1 className="text-2xl font-extrabold font-poppins">
          {t('dash_welcome')}, {user?.full_name?.split(' ')[0] || t('citizen')}! 👋
        </h1>
        <p className="text-slate-100 text-sm mt-1 leading-normal font-medium">{t('dash_hero_subtitle')}</p>
      </div>

      {/* Grid of stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} value={total} label={t('dash_total')} bgIcon="bg-[#1A3A6B]/10" textIcon="text-[#1A3A6B]" loading={loading} />
        <StatCard icon={Clock} value={active} label={t('active_short')} bgIcon="bg-amber-50" textIcon="text-amber-600" loading={loading} />
        <StatCard icon={CheckCircle2} value={resolved} label={t('dash_resolved')} bgIcon="bg-emerald-50" textIcon="text-emerald-600" loading={loading} />
        <StatCard icon={Star} value={(user?.points || 0).toLocaleString()} label={t('dash_points')} bgIcon="bg-[#F5A623]/10" textIcon="text-[#F5A623]" loading={false} />
      </div>

      {/* Detailed Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left main columns */}
        <div className="lg:col-span-2 space-y-6">
          <BadgeCard user={user} t={t} />

          {/* Recent Complaints */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-150 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2 font-poppins">
                <FileText size={16} className="text-[#1A3A6B]" /> {t('dash_recent')}
              </h2>
              <Link to="/my-complaints" className="text-xs text-[#1A3A6B] font-bold hover:underline flex items-center gap-1">
                {t('view_all')} <ChevronRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm font-semibold">{t('loading')}</div>
            ) : recent.length === 0 ? (
              <div className="p-8 text-center bg-gray-50/50">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500 text-sm font-medium">{t('no_complaints_yet')}</p>
                <Link to="/report-complaint" className="gov-btn-primary mt-4 text-xs">
                  {t('report_first_issue')}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recent.map((c) => (
                  <div key={c.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#F4F6FA]/30 transition-colors">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-sm font-bold text-gray-800 truncate leading-snug">{c.title}</p>
                      <p className="text-[11px] text-[#5A6A7A] font-semibold mt-1 uppercase tracking-wider">
                        {translateCategory(t, c.category)} · {formatDate(c.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3.5 flex-shrink-0">
                      <StatusBadge status={c.status} localized />
                      <Link to={`/complaints/${c.id}`} className="text-xs text-[#1A3A6B] font-bold hover:underline whitespace-nowrap">
                        {t('view')} →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column items */}
        <div className="space-y-6">
          
          {/* Notifications */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-150 flex items-center justify-between bg-[#F4F6FA]/50">
              <h2 className="font-bold text-gray-900 flex items-center gap-2 font-poppins">
                <Bell size={16} className="text-[#1A3A6B]" /> {t('notifications')}
              </h2>
              {unreadCount > 0 && (
                <span className="bg-[#C0392B] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                  {unreadCount} new
                </span>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm bg-gray-50/20">
                <Bell size={28} className="mx-auto mb-2 opacity-20 text-gray-600" />
                {t('no_notifications_yet')}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                {notifications.slice(0, 5).map((n) => {
                  const translated = translateNotification(n, t);
                  return (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-[#1A3A6B]/5' : ''}`}
                    >
                      <div className="flex gap-2">
                        {!n.is_read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1A3A6B] flex-shrink-0" />}
                        <div className={!n.is_read ? '' : 'ml-3'}>
                          <p className="text-xs font-bold text-gray-800 leading-snug">{translated.title}</p>
                          <p className="text-[11px] text-gray-500 mt-1 leading-normal line-clamp-2">{translated.message}</p>
                          {n.created_at && <p className="text-[10px] text-gray-400 mt-1 font-semibold">{formatRelativeTimeLocalized(n.created_at, t)}</p>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-extrabold text-sm text-gray-800 mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
              <TrendingUp size={15} className="text-[#1A3A6B]" /> {t('quick_actions')}
            </h3>
            <div className="space-y-1.5">
              {quickLinks.map(({ to, label, icon }) => (
                <Link key={to} to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-semibold text-[#5A6A7A] hover:text-[#1A1A2E] transition-colors border border-transparent hover:border-gray-100">
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                  <ChevronRight size={13} className="ml-auto text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Action Button */}
      <Link
        to="/report-complaint"
        title={t('report_new_issue')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#1A3A6B] hover:bg-[#132c52] text-white rounded-full shadow-2xl flex items-center justify-center z-20 transition-all hover:scale-110 active:scale-95"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
};

export default Dashboard;
