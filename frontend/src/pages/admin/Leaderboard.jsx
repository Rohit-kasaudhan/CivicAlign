import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Loader2 } from 'lucide-react';
import { getLeaderboard } from '../../api/admin';
import { getBadgeInfo } from '../../utils/helpers';

const BADGE_EMOJI = {
  'Reporter':        '🌱',
  'Community Voice': '📢',
  'Change Maker':    '⚡',
  'Civic Guardian':  '🛡️',
  'Civic Hero':      '🦸',
  'Civic Legend':    '🌟',
};

const RANK_STYLES = [
  { bg: 'bg-yellow-50 border-yellow-200', rank: '🥇', num: 'text-yellow-600' },
  { bg: 'bg-gray-50  border-gray-200',    rank: '🥈', num: 'text-gray-500'   },
  { bg: 'bg-orange-50 border-orange-200', rank: '🥉', num: 'text-orange-500' },
];

const AwardCard = ({ emoji, label, name, stat }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
    <p className="text-2xl mb-1">{emoji}</p>
    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
    <p className="font-bold text-gray-800">{name || '—'}</p>
    {stat && <p className="text-xs text-gray-500 mt-0.5">{stat}</p>}
  </div>
);

const AdminLeaderboard = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="animate-spin mr-2" size={18} /> Loading leaderboard…
    </div>
  );

  const leaders = data?.leaderboard || [];
  const awards  = data?.monthly_awards || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Leaderboard</h1>
        <p className="text-xs text-gray-500 mt-0.5">Top civic contributors ranked by points</p>
      </div>

      {/* Monthly awards */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3">Monthly Awards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AwardCard emoji="🥇" label="Best Reporter" name={awards.best_reporter?.name}
            stat={awards.best_reporter ? `${awards.best_reporter.count} reports this month` : null} />
          <AwardCard emoji="🤝" label="Community Champion" name={awards.community_champ?.name}
            stat={awards.community_champ ? `${awards.community_champ.count} verifications` : null} />
          <AwardCard emoji="⚡" label="Impact Leader" name={awards.impact_leader?.name}
            stat={awards.impact_leader ? `${Math.round(awards.impact_leader.score)} total impact score` : null} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-semibold uppercase">
              {['Rank','Citizen','Badge','Points','Submitted','Resolved'].map((h) => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leaders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No data yet</td></tr>
            ) : leaders.map((u) => {
              const style = RANK_STYLES[u.rank - 1];
              return (
                <tr key={u.id}
                  className={`border-b border-gray-50 transition-colors ${style ? style.bg + ' border' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-3 font-bold text-sm">
                    {style ? <span className="text-lg">{style.rank}</span> : <span className="text-gray-500">#{u.rank}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1e40af] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{u.full_name}</p>
                        <p className="text-xs text-gray-400">{u.city || 'Unknown city'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
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
    </div>
  );
};

export default AdminLeaderboard;
