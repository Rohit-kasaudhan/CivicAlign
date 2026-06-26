import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, CheckCircle2, Clock, Star, Plus, Bell,
  ChevronRight, TrendingUp,
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

const StatCard = ({ icon: Icon, value, label, accent, loading }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <div className="text-2xl font-extrabold text-gray-900">
        {loading ? <span className="animate-pulse bg-gray-200 rounded w-8 h-6 inline-block" /> : value}
      </div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  </div>
);

const BadgeCard = ({ user, t }) => {
  const { current, next, progress } = getBadgeInfo(user?.points || 0);
  const currentName = user?.current_badge || current.name;
  return (
    <div className="bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">{t('dash_badge')}</p>
          <h3 className="text-2xl font-extrabold mt-1">
            {current.emoji} {translateBadge(t, currentName)}
          </h3>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold">{(user?.points || 0).toLocaleString()}</div>
          <div className="text-blue-200 text-xs">{t('total_points')}</div>
        </div>
      </div>

      {next ? (
        <>
          <div className="flex justify-between text-xs text-blue-200 mb-1.5">
            <span>{translateBadge(t, current.name)}</span>
            <span>{next.emoji} {t('next_badge_at').replace('{badge}', translateBadge(t, next.name)).replace('{points}', next.min)}</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-blue-200 mt-2">
            {t('points_to_badge')
              .replace('{points}', Math.max(0, next.min - (user?.points || 0)))
              .replace('{badge}', translateBadge(t, next.name))}
          </p>
        </>
      ) : (
        <p className="text-blue-200 text-sm mt-2">{t('highest_badge')}</p>
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
    <div className="space-y-6 max-w-6xl">
      <div className="bg-gradient-to-r from-[#1e3a8a] to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-extrabold">
          {t('dash_welcome')}, {user?.full_name?.split(' ')[0] || t('citizen')}! 👋
        </h1>
        <p className="text-blue-100 text-sm mt-1">{t('dash_hero_subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} value={total} label={t('dash_total')} accent="bg-[#1e40af]" loading={loading} />
        <StatCard icon={Clock} value={active} label={t('active_short')} accent="bg-amber-500" loading={loading} />
        <StatCard icon={CheckCircle2} value={resolved} label={t('dash_resolved')} accent="bg-green-600" loading={loading} />
        <StatCard icon={Star} value={(user?.points || 0).toLocaleString()} label={t('dash_points')} accent="bg-purple-600" loading={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BadgeCard user={user} t={t} />

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText size={16} className="text-[#1e40af]" /> {t('dash_recent')}
              </h2>
              <Link to="/my-complaints" className="text-xs text-[#1e40af] font-semibold hover:underline flex items-center gap-1">
                {t('view_all')} <ChevronRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">{t('loading')}</div>
            ) : recent.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500 text-sm">{t('no_complaints_yet')}</p>
                <Link to="/report-complaint" className="inline-block mt-3 text-sm font-semibold text-[#1e40af] hover:underline">
                  {t('report_first_issue')} →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recent.map((c) => (
                  <div key={c.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{translateCategory(t, c.category)} · {formatDate(c.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={c.status} localized />
                      <Link to={`/complaints/${c.id}`} className="text-xs text-[#1e40af] font-semibold hover:underline whitespace-nowrap">
                        {t('view')} →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Bell size={16} className="text-[#1e40af]" /> {t('notifications')}
                {unreadCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </h2>
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                {t('no_notifications_yet')}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.slice(0, 5).map((n) => {
                  const translated = translateNotification(n, t);
                  return (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className="flex gap-2">
                        {!n.is_read && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#1e40af] flex-shrink-0" />}
                        <div className={!n.is_read ? '' : 'ml-4'}>
                          <p className="text-sm font-semibold text-gray-800 leading-snug">{translated.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{translated.message}</p>
                          {n.created_at && <p className="text-xs text-gray-300 mt-1">{formatRelativeTimeLocalized(n.created_at, t)}</p>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <TrendingUp size={15} className="text-[#1e40af]" /> {t('quick_actions')}
            </h3>
            <div className="space-y-2">
              {quickLinks.map(({ to, label, icon }) => (
                <Link key={to} to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700 hover:text-gray-900 transition-colors">
                  <span>{icon}</span>
                  <span>{label}</span>
                  <ChevronRight size={13} className="ml-auto text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Link
        to="/report-complaint"
        title={t('report_new_issue')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-[#1e40af] hover:bg-blue-800 text-white rounded-full shadow-xl flex items-center justify-center z-20 transition-all hover:scale-110"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
};

export default Dashboard;
