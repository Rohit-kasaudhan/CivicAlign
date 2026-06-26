import React, { useEffect, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Doughnut, Line, Bar, Pie } from 'react-chartjs-2';
import { BarChart2, Loader2 } from 'lucide-react';
import {
  getAnalyticsOverview, getByCategory, getMonthlyTrend,
  getByStatus, getByPriority, getByCity, getDeptPerformance,
} from '../../api/analytics';

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler,
);

// ── Constants ──────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Last 7 days',    days: 7   },
  { label: 'Last 30 days',   days: 30  },
  { label: 'Last 3 months',  days: 90  },
  { label: 'Last 12 months', days: 365 },
  { label: 'All time',       days: null },
];

const CATEGORY_COLORS = [
  '#3b82f6', '#06b6d4', '#0ea5e9', '#10b981', '#84cc16',
  '#f59e0b', '#f97316', '#8b5cf6', '#ef4444', '#ec4899',
];

const STATUS_COLORS = {
  submitted:          '#9ca3af',
  ai_processed:       '#a78bfa',
  evidence_verified:  '#60a5fa',
  community_verified: '#34d399',
  under_review:       '#fbbf24',
  approved:           '#4ade80',
  assigned:           '#38bdf8',
  in_progress:        '#3b82f6',
  resolved:           '#16a34a',
  closed:             '#6b7280',
};

const STATUS_LABELS = {
  submitted:          'Submitted',
  ai_processed:       'AI Processed',
  evidence_verified:  'Evidence Verified',
  community_verified: 'Community Verified',
  under_review:       'Under Review',
  approved:           'Approved',
  assigned:           'Assigned',
  in_progress:        'In Progress',
  resolved:           'Resolved',
  closed:             'Closed',
};

const PRIORITY_COLORS = {
  critical: '#dc2626',
  high:     '#ea580c',
  medium:   '#ca8a04',
  low:      '#16a34a',
  unknown:  '#9ca3af',
};

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatMonth = (m) => {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return `${MONTHS_SHORT[+mo - 1]} '${y.slice(2)}`;
};

const effColorBar  = (s) => s >= 80 ? 'bg-green-500'  : s >= 50 ? 'bg-amber-500'  : 'bg-red-500';
const effColorText = (s) => s >= 80 ? 'text-green-700' : s >= 50 ? 'text-amber-700' : 'text-red-700';

const buildParams = (presetIdx) => {
  const days = PRESETS[presetIdx].days;
  if (days === null) return {};
  const end   = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    start_date: start.toISOString().split('T')[0],
    end_date:   end.toISOString().split('T')[0],
  };
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const Skeleton = ({ h = 'h-24', className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${h} ${className}`} />
);

const StatCard = ({ label, value, color = 'text-gray-800', sub }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 truncate">{label}</p>
    <p className={`text-xl font-black leading-tight ${color}`}>{value ?? '—'}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100">
      <h2 className="font-bold text-gray-800 text-sm">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Empty = ({ h = 300 }) => (
  <div style={{ height: h }} className="flex flex-col items-center justify-center text-gray-300 gap-2">
    <BarChart2 size={28} />
    <p className="text-sm">No data for this period</p>
  </div>
);

// ── Shared chart defaults ──────────────────────────────────────────────────────

const BASE_OPTS = {
  responsive:          true,
  maintainAspectRatio: false,
  plugins: {
    legend:  { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
    tooltip: { mode: 'index', intersect: false },
  },
};

// ── Analytics ─────────────────────────────────────────────────────────────────

const Analytics = () => {
  const [preset,     setPreset]     = useState(3);
  const [loading,    setLoading]    = useState(true);
  const [overview,   setOverview]   = useState(null);
  const [categories, setCategories] = useState([]);
  const [monthly,    setMonthly]    = useState([]);
  const [statuses,   setStatuses]   = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [cities,     setCities]     = useState([]);
  const [depts,      setDepts]      = useState([]);

  const fetchAll = useCallback(async (idx) => {
    setLoading(true);
    const params = buildParams(idx);
    try {
      const [ov, cat, trend, stat, pri, city, dept] = await Promise.all([
        getAnalyticsOverview(params),
        getByCategory(params),
        getMonthlyTrend(params),
        getByStatus(params),
        getByPriority(params),
        getByCity(params),
        getDeptPerformance(params),
      ]);
      setOverview(ov);
      setCategories(Array.isArray(cat) ? cat : []);
      setMonthly(Array.isArray(trend) ? trend : []);
      setStatuses(Array.isArray(stat) ? stat : []);
      setPriorities(Array.isArray(pri) ? pri : []);
      setCities(Array.isArray(city) ? city : []);
      setDepts(Array.isArray(dept) ? dept : []);
    } catch (e) {
      console.error('Analytics fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(preset); }, [fetchAll]);

  const handlePreset = (idx) => { setPreset(idx); fetchAll(idx); };

  // ── Chart datasets ──────────────────────────────────────────────────────────

  const catChartData = {
    labels:   categories.map(d => d.category),
    datasets: [{
      data:            categories.map(d => d.count),
      backgroundColor: CATEGORY_COLORS.slice(0, categories.length),
      borderWidth:     2,
      borderColor:     '#fff',
    }],
  };
  const doughnutOpts = {
    ...BASE_OPTS,
    cutout: '62%',
    plugins: {
      ...BASE_OPTS.plugins,
      legend:  { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw}` } },
    },
  };

  const lineChartData = {
    labels:   monthly.map(d => formatMonth(d.month)),
    datasets: [
      {
        label:           'Submitted',
        data:            monthly.map(d => d.submitted),
        borderColor:     '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill:            true,
        tension:         0.4,
        pointRadius:     3,
      },
      {
        label:           'Resolved',
        data:            monthly.map(d => d.resolved),
        borderColor:     '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill:            true,
        tension:         0.4,
        pointRadius:     3,
      },
    ],
  };
  const lineOpts = {
    ...BASE_OPTS,
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } },
    },
  };

  const statusChartData = {
    labels:   statuses.map(d => STATUS_LABELS[d.status] || d.status),
    datasets: [{
      label:           'Count',
      data:            statuses.map(d => d.count),
      backgroundColor: statuses.map(d => STATUS_COLORS[d.status] || '#9ca3af'),
      borderRadius:    4,
    }],
  };
  const hbarOpts = {
    ...BASE_OPTS,
    indexAxis: 'y',
    plugins: { ...BASE_OPTS.plugins, legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      y: { grid: { display: false } },
    },
  };

  const priorityChartData = {
    labels:   priorities.map(d => d.priority.charAt(0).toUpperCase() + d.priority.slice(1)),
    datasets: [{
      data:            priorities.map(d => d.count),
      backgroundColor: priorities.map(d => PRIORITY_COLORS[d.priority] || '#9ca3af'),
      borderWidth:     2,
      borderColor:     '#fff',
    }],
  };
  const pieOpts = {
    ...BASE_OPTS,
    plugins: {
      ...BASE_OPTS.plugins,
      legend:  { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw}` } },
    },
  };

  const cityChartData = {
    labels:   cities.map(d => d.city),
    datasets: [{
      label:           'Complaints',
      data:            cities.map(d => d.count),
      backgroundColor: '#3b82f6',
      borderRadius:    4,
    }],
  };
  const cityBarOpts = {
    ...BASE_OPTS,
    plugins: { ...BASE_OPTS.plugins, legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } },
    },
  };

  // ── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Analytics Dashboard</h1>
        <p className="text-xs text-gray-500 mt-0.5">Insights across all civic complaint activity</p>
      </div>

      {/* Date preset filter */}
      <div className="flex gap-2 flex-wrap items-center">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => handlePreset(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border
              ${preset === i
                ? 'bg-[#1e40af] text-white border-[#1e40af]'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            {p.label}
          </button>
        ))}
        {loading && <Loader2 size={15} className="animate-spin text-gray-400" />}
      </div>

      {/* Row 1 — Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {loading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} h="h-[76px]" />)
        ) : overview ? (
          <>
            <StatCard
              label="Total Complaints"
              value={overview.total_complaints?.toLocaleString()}
              color="text-[#1e40af]"
            />
            <StatCard
              label="Resolved This Month"
              value={overview.resolved_this_month?.toLocaleString()}
              color="text-emerald-600"
            />
            <StatCard
              label="Avg Resolution"
              value={`${overview.avg_resolution_days}d`}
              color="text-amber-600"
              sub="to close"
            />
            <StatCard
              label="Resolution Rate"
              value={`${overview.resolution_rate}%`}
              color={overview.resolution_rate >= 60 ? 'text-green-600' : 'text-red-600'}
            />
            <StatCard label="Top Category"       value={overview.top_category} />
            <StatCard label="Most Affected City" value={overview.most_affected_city} />
          </>
        ) : (
          <div className="col-span-6 text-center text-sm text-gray-400 py-6">
            Could not load overview data.
          </div>
        )}
      </div>

      {/* Row 2 — Category doughnut + Monthly line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Category Distribution" subtitle="Complaint volume per civic category">
          {loading ? <Skeleton h="h-[300px]" /> : categories.length === 0 ? <Empty /> : (
            <div style={{ height: 300 }}>
              <Doughnut data={catChartData} options={doughnutOpts} />
            </div>
          )}
        </ChartCard>

        <ChartCard title="Monthly Trend" subtitle="Submitted vs resolved complaints over time">
          {loading ? <Skeleton h="h-[300px]" /> : monthly.length === 0 ? <Empty /> : (
            <div style={{ height: 300 }}>
              <Line data={lineChartData} options={lineOpts} />
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 3 — Status horizontal bar + Priority pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Status Distribution" subtitle="Complaints at each lifecycle stage">
          {loading ? <Skeleton h="h-[300px]" /> : statuses.length === 0 ? <Empty /> : (
            <div style={{ height: Math.max(300, statuses.length * 38) }}>
              <Bar data={statusChartData} options={hbarOpts} />
            </div>
          )}
        </ChartCard>

        <ChartCard title="Priority Breakdown" subtitle="Urgency level distribution">
          {loading ? <Skeleton h="h-[300px]" /> : priorities.length === 0 ? <Empty /> : (
            <div style={{ height: 300 }}>
              <Pie data={priorityChartData} options={pieOpts} />
            </div>
          )}
        </ChartCard>
      </div>

      {/* Row 4 — Top 10 cities */}
      <ChartCard title="Top 10 Cities by Complaints" subtitle="Cities with highest complaint volume">
        {loading ? <Skeleton h="h-[280px]" /> : cities.length === 0 ? <Empty h={280} /> : (
          <div style={{ height: 280 }}>
            <Bar data={cityChartData} options={cityBarOpts} />
          </div>
        )}
      </ChartCard>

      {/* Row 5 — Department performance table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-sm">Department Performance</h2>
          <p className="text-xs text-gray-400 mt-0.5">Sorted by efficiency score · resolved ÷ assigned</p>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} h="h-10" />)}
          </div>
        ) : depts.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            No department data yet. Assign complaints to departments to track performance.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-semibold uppercase">
                  {['Department', 'Assigned', 'Resolved', 'Avg Days', 'Efficiency Score'].map(h => (
                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {depts.map((d) => (
                  <tr key={d.department} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{d.department}</td>
                    <td className="px-4 py-3 text-gray-600">{d.total_assigned}</td>
                    <td className="px-4 py-3 text-gray-600">{d.total_resolved}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {d.avg_resolution_days > 0 ? `${d.avg_resolution_days}d` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${effColorBar(d.efficiency_score)}`}
                            style={{ width: `${Math.min(d.efficiency_score, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold w-10 text-right tabular-nums ${effColorText(d.efficiency_score)}`}>
                          {d.efficiency_score}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
