import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Loader2, FileX, MapPin, Calendar, CheckCheck, ChevronRight, Filter } from 'lucide-react';
import { getMyComplaints } from '../../api/complaints';
import StatusBadge from '../../components/common/StatusBadge';
import { formatRelativeTimeLocalized, translateCategory } from '../../utils/i18n';
import { translations } from '../../utils/translations';
import { citizenTranslations } from '../../utils/citizenTranslations';
import { CATEGORIES } from '../../utils/constants';
import AgentTraceModal from '../../components/complaint/AgentTraceModal';

const tEn = (key) => {
  return (
    citizenTranslations['en']?.[key] ??
    translations['en']?.[key] ??
    key
  );
};

const STATUS_OPTIONS = [
  'submitted',
  'ai_processed',
  'evidence_verified',
  'community_verified',
  'under_review',
  'approved',
  'assigned',
  'in_progress',
  'resolved',
  'closed'
];

const categoryColors = {
  'Roads/Potholes': 'bg-blue-50 text-blue-700 border-blue-150',
  'Sanitation/Garbage': 'bg-emerald-50 text-emerald-700 border-emerald-150',
  'Water Supply': 'bg-sky-50 text-sky-700 border-sky-150',
  'Streetlights': 'bg-amber-50 text-amber-700 border-amber-150',
  'Other': 'bg-gray-50 text-gray-700 border-gray-150',
};

const MyComplaints = () => {
  const t = tEn;
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  
  // Trace Modal State
  const [selectedComplaintForTrace, setSelectedComplaintForTrace] = useState(null);
  const [isTraceModalOpen, setIsTraceModalOpen]                   = useState(false);
  
  // Custom Filter State
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus]     = useState('all');
  const [startDate, setStartDate]           = useState('');
  const [endDate, setEndDate]               = useState('');
  const [showFilters, setShowFilters]       = useState(false);

  useEffect(() => {
    getMyComplaints()
      .then((data) => setComplaints(data.complaints || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = complaints;
    
    // Category Filter
    if (filterCategory !== 'all') {
      list = list.filter((c) => c.category === filterCategory);
    }
    
    // Status Filter
    if (filterStatus !== 'all') {
      list = list.filter((c) => c.status === filterStatus);
    }
    
    // Date Filters
    if (startDate) {
      list = list.filter((c) => new Date(c.created_at) >= new Date(startDate));
    }
    if (endDate) {
      list = list.filter((c) => new Date(c.created_at) <= new Date(endDate + 'T23:59:59'));
    }

    // Search bar filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }
    
    // Sort by created_at desc consistently
    return [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [complaints, filterCategory, filterStatus, startDate, endDate, search]);

  const clearFilters = () => {
    setFilterCategory('all');
    setFilterStatus('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  return (
    <div className="space-y-6 page-fade">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 font-poppins">{t('nav_my_complaints')}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Audit, trace, and inspect the status of your reported grievances</p>
        </div>
        <Link
          to="/report-complaint"
          className="gov-btn-primary"
        >
          <Plus size={16} /> {t('new_report')}
        </Link>
      </div>

      {/* Filter Action Bar */}
      <div className="bg-white rounded-xl border border-[#DDE3ED] p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_title_category')}
              className="gov-input !pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 border rounded-lg text-xs font-bold transition-all ${
                showFilters || filterCategory !== 'all' || filterStatus !== 'all' || startDate || endDate
                  ? 'bg-[#1A3A6B]/5 border-[#1A3A6B] text-[#1A3A6B]'
                  : 'bg-white border-[#DDE3ED] text-[#5A6A7A] hover:bg-gray-50'
              }`}
            >
              <Filter size={14} /> Filters
            </button>
            {(filterCategory !== 'all' || filterStatus !== 'all' || startDate || endDate || search) && (
              <button
                onClick={clearFilters}
                className="text-xs font-bold text-[#C0392B] hover:underline px-2 py-1"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Expandable filter options */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-gray-100 page-fade">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="gov-input !py-2"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{translateCategory(t, c)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="gov-input !py-2 capitalize"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="gov-input !py-2"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="gov-input !py-2"
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
          <Loader2 className="animate-spin text-[#1A3A6B]" size={24} />
          <span className="text-sm font-semibold">{t('loading')}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-[#DDE3ED] rounded-xl text-gray-400 gap-3 shadow-sm">
          <FileX size={42} className="opacity-40" />
          <div className="text-center">
            <p className="font-bold text-gray-700">{t('no_complaints_found')}</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting the search or category filters.</p>
          </div>
          <Link to="/report-complaint" className="gov-btn-primary mt-2">{t('report_first_issue')}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((c) => {
            const isAdminViewed = !['submitted', 'ai_processed', 'evidence_verified'].includes(c.status);
            const score = Math.round(c.impact_score || 0);
            let scoreCls = 'bg-gray-50 text-gray-600 border-gray-150';
            if (score >= 85) scoreCls = 'bg-red-50 text-[#C0392B] border-red-200 font-bold';
            else if (score >= 70) scoreCls = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
            
            return (
              <div key={c.id} className="gov-card flex flex-col justify-between h-full bg-white border border-[#DDE3ED] p-5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-[1.5px] transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    {/* Category Badge */}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      categoryColors[c.category] || categoryColors.Other
                    }`}>
                      {translateCategory(t, c.category)}
                    </span>
                    {/* Status Badge */}
                    <StatusBadge status={c.status} />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-sm font-extrabold text-gray-900 line-clamp-2 leading-snug font-poppins">
                    <Link to={`/complaints/${c.id}`} className="hover:text-[#1A3A6B] hover:underline">
                      {c.title}
                    </Link>
                  </h3>

                  {/* Location & Date */}
                  <div className="space-y-1 text-xs text-[#5A6A7A]">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-gray-400 shrink-0" />
                      <span className="truncate font-semibold">{c.city ? `${c.city}, ${c.state || ''}` : 'No location pinned'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-400 shrink-0" />
                      <span className="font-semibold">Reported {formatRelativeTimeLocalized(c.created_at, t)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer card controls */}
                <div className="border-t border-gray-100 pt-3.5 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Double tick mark */}
                    <div className="flex items-center gap-1" title={isAdminViewed ? 'Viewed by Admin' : 'Submitted'}>
                      <CheckCheck size={16} className={isAdminViewed ? 'text-[#1A3A6B]' : 'text-gray-300'} />
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        {isAdminViewed ? 'Reviewed' : 'Sent'}
                      </span>
                    </div>
                    
                    {/* Impact Pill */}
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${scoreCls}`}>
                      Impact {score}
                    </span>
                  </div>

                  {/* Action link */}
                  <button
                    onClick={() => {
                      setSelectedComplaintForTrace(c);
                      setIsTraceModalOpen(true);
                    }}
                    className="text-xs text-[#1A3A6B] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    View Trace <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reasoning Trace Modal */}
      <AgentTraceModal
        complaint={selectedComplaintForTrace}
        isOpen={isTraceModalOpen}
        onClose={() => {
          setIsTraceModalOpen(false);
          setSelectedComplaintForTrace(null);
        }}
      />
    </div>
  );
};

export default MyComplaints;
