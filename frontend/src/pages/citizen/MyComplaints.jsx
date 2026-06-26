import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronUp, ChevronDown, Search, Loader2, FileX } from 'lucide-react';
import { getMyComplaints } from '../../api/complaints';
import StatusBadge from '../../components/common/StatusBadge';
import { formatRelativeTimeLocalized, translateCategory } from '../../utils/i18n';
import { translations } from '../../utils/translations';
import { citizenTranslations } from '../../utils/citizenTranslations';

const tEn = (key) => {
  return (
    citizenTranslations['en']?.[key] ??
    translations['en']?.[key] ??
    key
  );
};

const TABS = [
  { key: 'all', tKey: 'all' },
  { key: 'active', tKey: 'active_short' },
  { key: 'resolved', tKey: 'resolved' },
];

const ACTIVE_STATUSES = ['submitted','ai_processed','evidence_verified','community_verified','under_review','approved','assigned','in_progress'];
const RESOLVED_STATUSES = ['resolved','closed'];

const MyComplaints = () => {
  const t = tEn;
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('all');
  const [search, setSearch]         = useState('');
  const [sortField, setSortField]   = useState('created_at');
  const [sortDir, setSortDir]       = useState('desc');

  useEffect(() => {
    getMyComplaints()
      .then((data) => setComplaints(data.complaints || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = complaints;
    if (tab === 'active')   list = list.filter((c) => ACTIVE_STATUSES.includes(c.status));
    if (tab === 'resolved') list = list.filter((c) => RESOLVED_STATUSES.includes(c.status));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const va = a[sortField] ?? '';
      const vb = b[sortField] ?? '';
      const cmp = String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [complaints, tab, search, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-gray-300" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-[#1e40af]" /> : <ChevronDown size={12} className="text-[#1e40af]" />;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">{t('nav_my_complaints')}</h1>
        <Link
          to="/report-complaint"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1e40af] text-white text-sm font-semibold rounded-lg hover:bg-blue-800"
        >
          <Plus size={14} /> {t('new_report')}
        </Link>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors
                ${tab === tabItem.key ? 'bg-white shadow text-[#1e40af]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t(tabItem.tKey)}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_title_category')}
            className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af] w-56"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <Loader2 className="animate-spin mr-2" /> {t('loading')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
          <FileX size={36} />
          <p className="font-medium">{t('no_complaints_found')}</p>
          <Link to="/report-complaint" className="text-sm text-[#1e40af] hover:underline">{t('report_first_issue')}</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {[
                  ['title', t('title')],
                  ['category', t('category')],
                  ['status', t('status')],
                  ['created_at', t('reported')],
                ].map(([field, label]) => (
                  <th
                    key={field}
                    onClick={() => toggleSort(field)}
                    className="text-left px-4 py-3 font-semibold text-gray-500 cursor-pointer hover:text-gray-800 select-none"
                  >
                    <span className="flex items-center gap-1">{label} <SortIcon field={field} /></span>
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-semibold text-gray-500">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[220px] truncate">
                    <Link to={`/complaints/${c.id}`} className="hover:text-[#1e40af] hover:underline">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{translateCategory(t, c.category)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatRelativeTimeLocalized(c.created_at, t)}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/complaints/${c.id}`}
                      className="text-xs text-[#1e40af] font-semibold hover:underline"
                    >
                      {t('view')} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyComplaints;



