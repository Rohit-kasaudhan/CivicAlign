import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Loader2, FileX } from 'lucide-react';
import { getAdminComplaints } from '../../api/admin';
import StatusBadge from '../../components/common/StatusBadge';
import { CATEGORIES } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/helpers';

const PRIORITY_PILL = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-yellow-100 text-yellow-700',
  low:      'bg-green-100 text-green-700',
};

const STATUSES = [
  'submitted','ai_processed','evidence_verified','community_verified',
  'under_review','approved','assigned','in_progress','resolved','closed',
];

const ComplaintReview = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);

  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCity,     setFilterCity]     = useState('');
  const [search,         setSearch]         = useState('');

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, per_page: 20 };
      if (filterStatus)   params.status   = filterStatus;
      if (filterCategory) params.category = filterCategory;
      if (filterPriority) params.priority = filterPriority;
      if (filterCity)     params.city     = filterCity;
      const data = await getAdminComplaints(params);
      setComplaints(data.complaints || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(1); }, [filterStatus, filterCategory, filterPriority, filterCity]);

  const visible = useMemo(() => {
    if (!search.trim()) return complaints;
    const q = search.toLowerCase();
    return complaints.filter((c) =>
      c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  }, [complaints, search]);

  const clearFilters = () => {
    setFilterStatus(''); setFilterCategory('');
    setFilterPriority(''); setFilterCity('');
  };

  const hasFilters = filterStatus || filterCategory || filterPriority || filterCity;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Complaint Review</h1>
          <p className="text-xs text-gray-500 mt-0.5">{total} total complaints</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title…"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
          />
        </div>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e40af]">
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>

        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e40af]">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e40af]">
          <option value="">All Priorities</option>
          {['critical','high','medium','low'].map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>

        <input
          type="text" value={filterCity} onChange={(e) => setFilterCity(e.target.value)}
          placeholder="City…"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
        />

        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-red-500 hover:underline font-medium">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <Loader2 className="animate-spin mr-2" size={18} /> Loading…
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
          <FileX size={32} />
          <p className="font-medium">No complaints found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-semibold uppercase">
                  {['ID','Title','Category','Priority','Status','City','Evidence','Trust','Impact','Date',''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">#{c.id}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <Link to={`/admin/complaints/${c.id}`} className="font-medium text-gray-800 hover:text-[#1e40af] hover:underline line-clamp-1">
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{c.category}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${PRIORITY_PILL[c.priority] || PRIORITY_PILL.medium}`}>
                        {c.priority || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.city || '—'}</td>
                    <td className="px-4 py-3 text-center text-xs font-semibold text-gray-700">{Math.round(c.evidence_score || 0)}</td>
                    <td className="px-4 py-3 text-center text-xs font-semibold text-gray-700">{Math.round(c.trust_score || 0)}</td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-[#1e40af]">{Math.round(c.impact_score || 0)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatRelativeTime(c.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/complaints/${c.id}`}
                        className="text-xs bg-[#1e40af] text-white px-2.5 py-1 rounded-lg hover:bg-blue-800 font-semibold whitespace-nowrap">
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-500">Showing {complaints.length} of {total}</p>
              <div className="flex gap-2">
                <button onClick={() => load(page - 1)} disabled={page === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 text-xs font-medium">
                  Previous
                </button>
                <button onClick={() => load(page + 1)} disabled={complaints.length < 20}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 text-xs font-medium">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ComplaintReview;
