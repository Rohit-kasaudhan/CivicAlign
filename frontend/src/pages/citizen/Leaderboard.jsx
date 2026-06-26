import React, { useEffect, useState } from 'react';
import { Loader2, Trophy } from 'lucide-react';
import { getLeaderboard } from '../../api/admin';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
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
  'bg-yellow-50 border border-yellow-200',
  'bg-gray-50   border border-gray-200',
  'bg-orange-50 border border-orange-200',
];

const RANK_MEDAL = ['🥇', '🥈', '🥉'];

const AwardCard = ({ emoji, label, name, stat }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
    <p className="text-2xl mb-1">{emoji}</p>
    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
    <p className="font-bold text-gray-800 mt-1">{name || '—'}</p>
    {stat && <p className="text-xs text-gray-400 mt-0.5">{stat}</p>}
  </div>
);

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
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="animate-spin mr-2" size={18} /> {t('lb_loading')}
    </div>
  );

  const leaders = data?.leaderboard || [];
  const awards  = data?.monthly_awards || {};
  const myRank  = leaders.findIndex((l) => l.id === user?.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('lb_title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('lb_subtitle')}</p>
      </div>

      {/* My rank banner */}
      {myRank >= 0 && (
        <div className="bg-[#1e40af] text-white rounded-xl p-4 flex items-center gap-4">
          <Trophy size={24} className="text-yellow-300" />
          <div>
            <p className="font-bold">{t('lb_your_rank')}: #{myRank + 1}</p>
            <p className="text-sm text-blue-200">
              {(leaders[myRank]?.points || 0).toLocaleString()} pts · {BADGE_EMOJI[user?.current_badge] || '🌱'} {user?.current_badge}
            </p>
          </div>
        </div>
      )}

      {/* Monthly awards */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3">{t('lb_this_months')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AwardCard emoji="🥇" label={t('lb_best_reporter')} name={awards.best_reporter?.name}
            stat={awards.best_reporter ? `${awards.best_reporter.count} ${t('lb_reports_suffix')}` : null} />
          <AwardCard emoji="🤝" label={t('lb_community_champ')} name={awards.community_champ?.name}
            stat={awards.community_champ ? `${awards.community_champ.count} ${t('lb_verif_suffix')}` : null} />
          <AwardCard emoji="⚡" label={t('lb_impact_leader')} name={awards.impact_leader?.name}
            stat={awards.impact_leader ? `${Math.round(awards.impact_leader.score)} ${t('lb_impact_suffix')}` : null} />
        </div>
      </div>

      {/* Table */}
      {leaders.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">{t('lb_no_data')}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-semibold uppercase">
                {[
                  t('lb_rank'),
                  t('lb_citizen_col'),
                  t('lb_badge_col'),
                  t('lb_points_col'),
                  t('lb_reports_col'),
                  t('lb_resolved_col'),
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaders.map((u) => {
                const isMe = u.id === user?.id;
                const rankStyle = RANK_STYLES[u.rank - 1] || '';
                return (
                  <tr key={u.id}
                    className={`border-b border-gray-50 transition-colors
                      ${isMe ? 'ring-2 ring-inset ring-[#1e40af] bg-blue-50' : rankStyle || 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3 font-bold">
                      {RANK_MEDAL[u.rank - 1]
                        ? <span className="text-lg">{RANK_MEDAL[u.rank - 1]}</span>
                        : <span className="text-gray-500 text-sm">#{u.rank}</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isMe ? 'bg-[#1e40af]' : 'bg-gray-500'}`}>
                          {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${isMe ? 'text-[#1e40af]' : 'text-gray-800'}`}>
                            {u.full_name} {isMe && <span className="text-xs">({t('lb_you')})</span>}
                          </p>
                          <p className="text-xs text-gray-400">{u.city || t('lb_unknown_city')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm">{BADGE_EMOJI[u.current_badge] || '🌱'}</span>
                      <span className="text-xs text-gray-600 ml-1">{u.current_badge}</span>
                    </td>
                    <td className="px-4 py-3 font-black text-[#1e40af]">{(u.points || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600 font-medium">{u.complaints_count || 0}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{u.resolved_count || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CitizenLeaderboard;
