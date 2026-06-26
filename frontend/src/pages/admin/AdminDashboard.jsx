import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Clock, CheckCircle, Wrench, CheckCheck,
  Users, Layers, TrendingUp, Loader2, ExternalLink,
} from 'lucide-react';
import { getAdminDashboard } from '../../api/admin';
import StatusBadge from '../../components/common/StatusBadge';
import { formatRelativeTime, getStatusColor } from '../../utils/helpers';

const PRIORITY_PILL = {
  critical: 'bg-red-100 text-red-700 border border-red-200',
  high:     'bg-orange-100 text-orange-700 border border-orange-200',
  medium:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
  low:      'bg-green-100 text-green-700 border border-green-200',
};

const StatCard = ({ icon: Icon, label, value, color = 'text-gray-800', bg = 'bg-white' }) => (
  <div className={`${bg} rounded-xl border border-gray-200 p-5 shadow-sm flex items-start gap-4`}>
    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
      <Icon size={20} className={color} />
    </div>
    <div>
      <p className="text-2xl font-black text-gray-800">{value ?? '—'}</p>
      <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="animate-spin mr-2" size={20} /> Loading dashboard…
    </div>
  );

  const stats = [
    { icon: FileText,    label: 'Total Complaints',         value: data?.total_complaints,       color: 'text-slate-600' },
    { icon: Clock,       label: 'Pending Review',           value: data?.pending_review,          color: 'text-orange-500' },
    { icon: CheckCircle, label: 'Approved',                 value: data?.approved,                color: 'text-blue-600' },
    { icon: Wrench,      label: 'In Progress',              value: data?.in_progress,             color: 'text-amber-500' },
    { icon: CheckCheck,  label: 'Resolved',                 value: data?.resolved,                color: 'text-green-600' },
    { icon: Users,       label: 'Citizens Participating',   value: data?.citizens_participating,  color: 'text-violet-600' },
    { icon: Layers,      label: 'Active Initiatives',       value: data?.active_initiatives,      color: 'text-teal-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-xs text-gray-500 mt-0.5">Real-time civic complaint management stats</p>
      </div>

      {/* 7 stat cards — 4 col on xl, 3 on lg, 2 on sm */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Priority Queue */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-800">Priority Queue</h2>
              <p className="text-xs text-gray-400 mt-0.5">Top complaints awaiting review, sorted by impact</p>
            </div>
            <Link to="/admin/review" className="text-xs text-[#1e40af] font-semibold hover:underline flex items-center gap-1">
              View all <ExternalLink size={10} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-semibold uppercase">
                  <th className="px-4 py-2.5 text-left">#</th>
                  <th className="px-4 py-2.5 text-left">Title</th>
                  <th className="px-4 py-2.5 text-left">Category</th>
                  <th className="px-4 py-2.5 text-left">Priority</th>
                  <th className="px-4 py-2.5 text-left">City</th>
                  <th className="px-4 py-2.5 text-right">Impact</th>
                  <th className="px-4 py-2.5 text-right">Citizens</th>
                  <th className="px-4 py-2.5 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {(data?.priority_queue || []).length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No complaints pending review</td></tr>
                ) : (data?.priority_queue || []).map((c, i) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs font-semibold">{i + 1}</td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <Link to={`/admin/complaints/${c.id}`} className="font-medium text-gray-800 hover:text-[#1e40af] hover:underline line-clamp-1">
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.category}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${PRIORITY_PILL[c.priority] || PRIORITY_PILL.medium}`}>
                        {c.priority || 'medium'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.city || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-700">{Math.round(c.impact_score || 0)}</td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{(c.citizens_affected || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/complaints/${c.id}`}
                        className="text-xs bg-[#1e40af] text-white px-2.5 py-1 rounded-lg hover:bg-blue-800 font-semibold">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Recent Activity</h2>
            <p className="text-xs text-gray-400 mt-0.5">Latest status changes</p>
          </div>
          <ul className="divide-y divide-gray-50">
            {(data?.recent_activity || []).length === 0 ? (
              <li className="px-5 py-8 text-center text-gray-400 text-sm">No recent activity</li>
            ) : (data?.recent_activity || []).map((a) => (
              <li key={a.id} className="px-5 py-3.5">
                <div className="flex items-start gap-2.5">
                  <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${getStatusColor(a.new_status).split(' ')[0]}`} />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">
                      <span className="font-semibold capitalize">{a.new_status?.replace(/_/g, ' ')}</span>
                      {' — '}
                      <Link to={`/admin/complaints/${a.complaint_id}`} className="text-[#1e40af] hover:underline truncate">
                        {a.complaint_title || `#${a.complaint_id}`}
                      </Link>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.changer_name || 'System'} · {formatRelativeTime(a.created_at)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
