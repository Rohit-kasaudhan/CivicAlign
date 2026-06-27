import React, { useEffect, useState } from 'react';
import { Loader2, Trophy, Award, TrendingUp } from 'lucide-react';
import { getLeaderboard } from '../../api/admin';
import { useAuth } from '../../hooks/useAuth';
import { translations } from '../../utils/translations';
import { citizenTranslations } from '../../utils/citizenTranslations';

const tEn = (key) => {
  return (
    citizenTranslations['en']?.[key] ??
    translations['en']?.[key] ??
    key
  );
};

const BADGE_EMOJI = {
  'Reporter':        '🌱',
  'Community Voice': '📢',
  'Change Maker':    '⚡',
  'Civic Guardian':  '🛡️',
  'Civic Hero':      '🦸',
  'Civic Legend':    '🌟',
};

const RANK_STYLES = [
  'bg-yellow-50/40 border-l-4 border-l-yellow-400',
  'bg-gray-50/40 border-l-4 border-l-gray-300',
  'bg-orange-50/40 border-l-4 border-l-orange-300',
];

const RANK_MEDAL = ['🥇', '🥈', '🥉'];

const Sparkline = () => (
  <svg className="w-20 h-6 text-[#0F7B6C] overflow-visible" viewBox="0 0 100 30">
    <path
      d="M0 25 L15 22 L30 24 L45 12 L60 14 L75 5 L100 2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M0 25 L15 22 L30 24 L45 12 L60 14 L75 5 L100 2 L100 30 L0 30 Z"
      fill="rgba(15, 123, 108, 0.08)"
    />
  </svg>
);

const PodiumColumn = ({ user, rank, heightClass, bgClass, borderClass, medal, badgeColor }) => {
  if (!user) return <div className="flex-1 opacity-0" />;
  return (
    <div className="flex-1 flex flex-col items-center justify-end min-w-0">
      <div className="relative mb-2 flex flex-col items-center w-full">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-extrabold shadow-md border-2 ${borderClass} bg-[#1A3A6B]/80 relative`}>
          {user.full_name?.charAt(0)?.toUpperCase()}
          <span className="absolute -bottom-1 -right-1 text-sm">{medal}</span>
        </div>
        <p className="text-[11px] font-bold text-gray-800 mt-2 truncate w-full text-center font-poppins px-1">
          {user.full_name}
        </p>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{user.points?.toLocaleString()} pts</p>
      </div>
      
      {/* Podium Base */}
      <div className={`w-full ${heightClass} ${bgClass} border-t-2 ${borderClass} rounded-t-xl flex flex-col items-center justify-center p-2 shadow-sm`}>
        <span className={`text-xl font-black leading-none ${badgeColor}`}>{rank}</span>
        <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 mt-1 truncate w-full text-center">
          {user.current_badge || 'Reporter'}
        </span>
      </div>
    </div>
  );
};

const Podium = ({ leaders }) => {
  const second = leaders[1];
  const first = leaders[0];
  const third = leaders[2];

  return (
    <div className="flex items-end gap-3 max-w-md w-full h-56 bg-gray-50/50 p-4 rounded-xl border border-gray-150 shadow-inner">
      <PodiumColumn user={second} rank="2" heightClass="h-20" bgClass="bg-gray-100/70" borderClass="border-gray-300" medal="🥈" badgeColor="text-gray-500" />
      <PodiumColumn user={first} rank="1" heightClass="h-28" bgClass="bg-yellow-50/70" borderClass="border-yellow-400" medal="🥇" badgeColor="text-yellow-600" />
      <PodiumColumn user={third} rank="3" heightClass="h-16" bgClass="bg-orange-50/70" borderClass="border-orange-300" medal="🥉" badgeColor="text-orange-600" />
    </div>
  );
};

const CitizenLeaderboard = () => {
  const { user }           = useAuth();
  const t                  = tEn;
  const [data, setData]    = useState(null);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoad(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
      <Loader2 className="animate-spin text-[#1A3A6B]" size={24} />
      <span className="text-sm font-semibold">{t('lb_loading')}</span>
    </div>
  );

  const leaders = data?.leaderboard || [];
  const awards  = data?.monthly_awards || {};
  const myRank  = leaders.findIndex((l) => l.id === user?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6 page-fade">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 font-poppins">{t('lb_title')}</h1>
        <p className="text-xs text-gray-500 mt-0.5">{t('lb_subtitle')}</p>
      </div>

      {/* Podium and Pinned Stats Block */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Podium display */}
        <div className="flex-1 bg-white border border-[#DDE3ED] p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <h3 className="font-extrabold text-sm text-gray-800 font-poppins border-b border-gray-100 pb-2 mb-3">Top Contributors Podium</h3>
          <Podium leaders={leaders} />
        </div>

        {/* Pinned Stats and Sparkline */}
        {myRank >= 0 && (
          <div className="lg:w-[320px] bg-gradient-to-br from-[#1A3A6B] to-[#0D1E3A] text-white rounded-xl p-5 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="text-[#F5A623]" size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Your Standing</span>
              </div>
              <div>
                <p className="text-3xl font-extrabold font-poppins">Rank #{myRank + 1}</p>
                <p className="text-xs text-slate-300 mt-1 font-semibold">
                  {(leaders[myRank]?.points || 0).toLocaleString()} points total
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg border border-white/10 w-max">
                <span className="text-base">{BADGE_EMOJI[user?.current_badge] || '🌱'}</span>
                <span className="text-xs font-bold uppercase tracking-wider">{user?.current_badge || 'Reporter'}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 block">Weekly Growth</span>
                <span className="text-xs font-bold text-[#0F7B6C] flex items-center gap-0.5 mt-0.5">
                  <TrendingUp size={12} /> +120 pts
                </span>
              </div>
              <Sparkline />
            </div>
          </div>
        )}
      </div>

      {/* Monthly Awards Grid */}
      <div className="bg-white border border-[#DDE3ED] p-5 rounded-xl shadow-sm">
        <h3 className="font-extrabold text-sm text-gray-800 font-poppins border-b border-gray-100 pb-2 mb-4 flex items-center gap-1.5">
          <Award size={16} className="text-[#1A3A6B]" /> {t('lb_this_months')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50/50 rounded-xl border border-gray-150 p-4 text-center hover:shadow-sm transition-shadow">
            <span className="text-2xl">🥇</span>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{t('lb_best_reporter')}</p>
            <p className="font-extrabold text-gray-800 mt-1 font-poppins text-sm">{awards.best_reporter?.name || '—'}</p>
            {awards.best_reporter && <p className="text-[10px] text-[#0F7B6C] font-semibold mt-0.5">{awards.best_reporter.count} reports</p>}
          </div>

          <div className="bg-gray-50/50 rounded-xl border border-gray-150 p-4 text-center hover:shadow-sm transition-shadow">
            <span className="text-2xl">🤝</span>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{t('lb_community_champ')}</p>
            <p className="font-extrabold text-gray-800 mt-1 font-poppins text-sm">{awards.community_champ?.name || '—'}</p>
            {awards.community_champ && <p className="text-[10px] text-[#0F7B6C] font-semibold mt-0.5">{awards.community_champ.count} verifications</p>}
          </div>

          <div className="bg-gray-50/50 rounded-xl border border-gray-150 p-4 text-center hover:shadow-sm transition-shadow">
            <span className="text-2xl">⚡</span>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1.5">{t('lb_impact_leader')}</p>
            <p className="font-extrabold text-gray-800 mt-1 font-poppins text-sm">{awards.impact_leader?.name || '—'}</p>
            {awards.impact_leader && <p className="text-[10px] text-[#0F7B6C] font-semibold mt-0.5">{Math.round(awards.impact_leader.score)} total impact</p>}
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-white rounded-xl border border-[#DDE3ED] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-150">
          <h3 className="font-extrabold text-sm text-gray-800 font-poppins">Citizen Rankings</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Global standings sorted by points earned</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <th className="px-5 py-3 text-left w-20">{t('lb_rank')}</th>
                <th className="px-5 py-3 text-left">{t('lb_citizen_col')}</th>
                <th className="px-5 py-3 text-left">{t('lb_badge_col')}</th>
                <th className="px-5 py-3 text-left">{t('lb_points_col')}</th>
                <th className="px-5 py-3 text-left">{t('lb_reports_col')}</th>
                <th className="px-5 py-3 text-left">{t('lb_resolved_col')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaders.map((u) => {
                const isMe = u.id === user?.id;
                const topRankClass = RANK_STYLES[u.rank - 1] || '';
                return (
                  <tr
                    key={u.id}
                    className={`transition-colors odd:bg-white even:bg-gray-50/20
                      ${isMe ? 'border-l-4 border-l-[#1A3A6B] bg-[#1A3A6B]/5 font-bold' : topRankClass || 'hover:bg-gray-50/40'}`}
                  >
                    <td className="px-5 py-3.5 font-bold">
                      {RANK_MEDAL[u.rank - 1]
                        ? <span className="text-lg">{RANK_MEDAL[u.rank - 1]}</span>
                        : <span className="text-gray-400 font-mono">#{u.rank}</span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isMe ? 'bg-[#1A3A6B]' : 'bg-[#5A6A7A]'}`}>
                          {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isMe ? 'text-[#1A3A6B]' : 'text-gray-800'}`}>
                            {u.full_name} {isMe && <span className="text-xs font-normal text-gray-500">({t('lb_you')})</span>}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{u.city || t('lb_unknown_city')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-base">{BADGE_EMOJI[u.current_badge] || '🌱'}</span>
                      <span className="text-xs font-semibold text-gray-600 ml-1.5">{u.current_badge}</span>
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-[#1A3A6B]">{(u.points || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-[#5A6A7A] font-semibold text-xs font-mono">{u.complaints_count || 0}</td>
                    <td className="px-5 py-3.5 text-[#0F7B6C] font-semibold text-xs font-mono">{u.resolved_count || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CitizenLeaderboard;
