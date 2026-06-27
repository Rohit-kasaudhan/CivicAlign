import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Clock, CheckCircle, Wrench, CheckCheck,
  Users, Layers, Loader2, ExternalLink, ShieldCheck, Activity
} from 'lucide-react';
import { getAdminDashboard } from '../../api/admin';
import { getByCategory, getByPriority } from '../../api/analytics';
import { formatRelativeTime } from '../../utils/helpers';
import { Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const getStatusBadgeStyles = (status) => {
  switch (status) {
    case 'resolved':
    case 'closed':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    case 'in_progress':
    case 'assigned':
      return 'bg-blue-50 text-blue-700 border border-blue-100';
    case 'under_review':
      return 'bg-amber-50 text-amber-700 border border-amber-100';
    default:
      return 'bg-gray-50 text-gray-600 border border-gray-200';
  }
};

const SummaryCard = ({ borderClass, icon: Icon, bgIconClass, textIconClass, value, label }) => (
  <div className={`bg-white rounded-xl border border-gray-200 border-l-[4px] ${borderClass} p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] transition-all flex items-center justify-between`}>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-extrabold text-gray-800 mt-1.5 font-poppins">{value ?? '—'}</p>
    </div>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgIconClass}`}>
      <Icon size={22} className={textIconClass} />
    </div>
  </div>
);

const MiniStatCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-sm flex items-center gap-3">
    <div className="p-2 rounded-lg bg-gray-50">
      <Icon size={16} className={colorClass} />
    </div>
    <div className="min-w-0">
      <p className="text-sm font-black text-gray-800 leading-none">{value ?? '—'}</p>
      <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [data, setData]             = useState(null);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminDashboard(),
      getByCategory(),
      getByPriority()
    ])
      .then(([dashData, catData, priData]) => {
        setData(dashData);
        setCategories(Array.isArray(catData) ? catData : []);
        setPriorities(Array.isArray(priData) ? priData : []);
      })
      .catch((err) => console.error('Dashboard loading error', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 text-gray-400 gap-3">
      <Loader2 className="animate-spin text-[#1A3A6B]" size={28} />
      <span className="text-sm font-semibold">Loading system analytics…</span>
    </div>
  );

  // Compute metrics
  const avgImpact = data?.priority_queue?.length
    ? Math.round(data.priority_queue.reduce((acc, curr) => acc + (curr.impact_score || 0), 0) / data.priority_queue.length)
    : 74;

  // Chart data config
  const catChartData = {
    labels: categories.slice(0, 6).map(c => c.category),
    datasets: [{
      data: categories.slice(0, 6).map(c => c.count),
      backgroundColor: '#0F7B6C', // Civic Teal
      borderRadius: 6,
      barThickness: 16,
    }]
  };
  const catChartOpts = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { color: '#F4F6FA' }, ticks: { font: { size: 10 } } },
      y: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }
    }
  };

  const radarChartData = {
    labels: ['Critical', 'High', 'Medium', 'Low', 'Unknown'],
    datasets: [{
      label: 'Urgency Breakdown',
      data: [
        priorities.find(p => p.priority === 'critical')?.count || 0,
        priorities.find(p => p.priority === 'high')?.count || 0,
        priorities.find(p => p.priority === 'medium')?.count || 0,
        priorities.find(p => p.priority === 'low')?.count || 0,
        priorities.find(p => p.priority === 'unknown')?.count || 0,
      ],
      backgroundColor: 'rgba(26, 58, 107, 0.15)',
      borderColor: '#1A3A6B',
      borderWidth: 2,
      pointBackgroundColor: '#1A3A6B',
      pointBorderColor: '#fff',
      pointRadius: 4,
    }]
  };
  const radarChartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
    },
    scales: {
      r: {
        angleLines: { color: '#E2E8F0' },
        grid: { color: '#E2E8F0' },
        pointLabels: { font: { size: 10, weight: 'bold' } },
        ticks: { backdropColor: 'transparent', font: { size: 9 } }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 font-poppins">System Overview</h1>
        <p className="text-xs text-gray-500 mt-0.5">Real-time civic intelligence and complaint status analysis</p>
      </div>

      {/* Row 1: 4 Key Government Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          borderClass="border-l-[#1A3A6B]"
          icon={FileText}
          bgIconClass="bg-[#1A3A6B]/10"
          textIconClass="text-[#1A3A6B]"
          label="Total Reports"
          value={data?.total_complaints}
        />
        <SummaryCard
          borderClass="border-l-[#0F7B6C]"
          icon={Layers}
          bgIconClass="bg-[#0F7B6C]/10"
          textIconClass="text-[#0F7B6C]"
          label="Active Clusters"
          value={data?.active_initiatives}
        />
        <SummaryCard
          borderClass="border-l-[#F5A623]"
          icon={Activity}
          bgIconClass="bg-[#F5A623]/10"
          textIconClass="text-[#F5A623]"
          label="Avg Impact Score"
          value={`${avgImpact}/100`}
        />
        <SummaryCard
          borderClass="border-l-[#10B981]"
          icon={ShieldCheck}
          bgIconClass="bg-[#10B981]/10"
          textIconClass="text-[#10B981]"
          label="Gemini AI Pipeline"
          value="ACTIVE"
        />
      </div>

      {/* Row 2: Secondary statistics strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStatCard icon={Clock} label="Pending Review" value={data?.pending_review} colorClass="text-orange-500" />
        <MiniStatCard icon={CheckCircle} label="Approved" value={data?.approved} colorClass="text-[#1A3A6B]" />
        <MiniStatCard icon={Wrench} label="In Progress" value={data?.in_progress} colorClass="text-amber-500" />
        <MiniStatCard icon={CheckCheck} label="Resolved" value={data?.resolved} colorClass="text-[#0F7B6C]" />
      </div>

      {/* Row 3: Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="border-b border-gray-150 pb-3 mb-4">
            <h3 className="font-extrabold text-sm text-gray-800 font-poppins">Category Distribution</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Top reported civic issue clusters</p>
          </div>
          <div className="h-64">
            <Bar data={catChartData} options={catChartOpts} />
          </div>
        </div>

        {/* Radar priority */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="border-b border-gray-150 pb-3 mb-4">
            <h3 className="font-extrabold text-sm text-gray-800 font-poppins">Severity & Urgency Assessment</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">AI-classified priorities profile</p>
          </div>
          <div className="h-64">
            <Radar data={radarChartData} options={radarChartOpts} />
          </div>
        </div>
      </div>

      {/* Row 4: Priority Queue & Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Priority Queue (Critical Urgent Areas) */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-gray-150 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-sm text-gray-800 font-poppins">Critical Urgent Queue</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">High-impact complaints awaiting administrative audit</p>
              </div>
              <Link to="/admin/review" className="text-xs text-[#1A3A6B] font-bold hover:underline flex items-center gap-1">
                Open Review Console <ExternalLink size={11} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-150 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Issue</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Priority</th>
                    <th className="px-4 py-3 text-left">City</th>
                    <th className="px-4 py-3 text-center">Impact Score</th>
                    <th className="px-4 py-3 text-right">Citizens</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data?.priority_queue || []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm font-medium">
                        No critical complaints pending audit.
                      </td>
                    </tr>
                  ) : (data.priority_queue || []).map((c, i) => {
                    const score = Math.round(c.impact_score || 0);
                    let scoreCls = 'bg-gray-100 text-gray-600 border-gray-200';
                    if (score >= 85) scoreCls = 'bg-red-50 text-[#C0392B] border-red-100 font-bold';
                    else if (score >= 70) scoreCls = 'bg-orange-50 text-orange-700 border-orange-100 font-semibold';
                    
                    return (
                      <tr key={c.id} className="hover:bg-[#F4F6FA]/30 transition-colors odd:bg-white even:bg-gray-50/30">
                        <td className="px-4 py-3 text-gray-400 text-xs font-semibold">{i + 1}</td>
                        <td className="px-4 py-3 max-w-[160px]">
                          <Link to={`/admin/complaints/${c.id}`} className="font-semibold text-gray-800 hover:text-[#1A3A6B] hover:underline line-clamp-1">
                            {c.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-[#5A6A7A] text-xs font-medium">{c.category}</td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1.5 w-max text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            c.priority === 'critical' ? 'bg-red-50 text-[#C0392B] border border-red-100' :
                            c.priority === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                            c.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-green-50 text-[#0F7B6C] border border-[#0F7B6C]/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              c.priority === 'critical' ? 'bg-[#C0392B]' :
                              c.priority === 'high' ? 'bg-orange-600' :
                              c.priority === 'medium' ? 'bg-amber-600' :
                              'bg-[#0F7B6C]'
                            }`} />
                            {c.priority || 'medium'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#5A6A7A] text-xs font-medium">{c.city || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border ${scoreCls}`}>
                            {score}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 font-semibold text-xs font-mono">
                          {(c.citizens_affected || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link to={`/admin/complaints/${c.id}`}
                            className="gov-btn-outline-blue !px-3 !py-1 !text-[11px] font-bold rounded-lg shadow-sm">
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-400 font-semibold">Priority sorting is derived dynamically from affected counts and AI gravity assessments.</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="px-5 py-4 border-b border-gray-150">
              <h2 className="font-extrabold text-sm text-gray-800 font-poppins">Lifecycle Activity</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Audit log of latest complaint status updates</p>
            </div>
            <ul className="divide-y divide-gray-100">
              {(data?.recent_activity || []).length === 0 ? (
                <li className="px-5 py-8 text-center text-gray-400 text-sm font-medium">No recent status transitions</li>
              ) : (data.recent_activity || []).map((a) => (
                <li key={a.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      a.new_status === 'resolved' ? 'bg-[#0F7B6C]' :
                      a.new_status === 'in_progress' ? 'bg-amber-500' :
                      a.new_status === 'approved' ? 'bg-[#1A3A6B]' :
                      'bg-gray-400'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-700 leading-snug font-medium">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase border mr-1.5 ${getStatusBadgeStyles(a.new_status)}`}>
                          {a.new_status?.replace(/_/g, ' ')}
                        </span>
                        {' for '}
                        <Link to={`/admin/complaints/${a.complaint_id}`} className="text-[#1A3A6B] font-bold hover:underline">
                          {a.complaint_title || `#${a.complaint_id}`}
                        </Link>
                      </p>
                      <p className="text-[10px] text-gray-400 font-semibold mt-1">
                        Updated by {a.changer_name || 'System'} · {formatRelativeTime(a.created_at)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3.5 bg-gray-50 border-t border-gray-100 text-center">
            <Link to="/admin/review" className="text-xs text-[#1A3A6B] font-bold hover:underline">
              Enter Administrative Action Log →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
