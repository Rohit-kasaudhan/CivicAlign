import React, { useEffect, useState } from 'react';
import { Loader2, SlidersHorizontal, X } from 'lucide-react';
import { getMapData } from '../../api/complaints';
import IssueMap from '../../components/map/IssueMap';
import { CATEGORIES } from '../../utils/constants';
import { translateCategory, translatePriority } from '../../utils/i18n';
import { translations } from '../../utils/translations';
import { citizenTranslations } from '../../utils/citizenTranslations';

const tEn = (key) => {
  return (
    citizenTranslations['en']?.[key] ??
    translations['en']?.[key] ??
    key
  );
};

const PRIORITY_COLORS = {
  critical: '#dc2626',
  high:     '#ea580c',
  medium:   '#ca8a04',
  low:      '#16a34a',
};

const Legend = ({ t }) => (
  <div>
    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('priority_legend')}</p>
    <div className="space-y-1.5">
      {Object.entries(PRIORITY_COLORS).map(([key, color]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-sm text-gray-700">{translatePriority(t, key)}</span>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full flex-shrink-0 bg-[#16a34a]" />
        <span className="text-sm text-gray-700">{t('resolved_closed')}</span>
      </div>
    </div>
  </div>
);

const AdminMap = () => {
  const t = tEn;
  const [allIssues, setAllIssues]               = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [filterCat, setFilterCat]               = useState('');
  const [filterPriority, setFilterPriority]     = useState('');
  const [filterStatus, setFilterStatus]         = useState('');
  const [panelOpen, setPanelOpen]               = useState(true);

  useEffect(() => {
    getMapData()
      .then((data) => setAllIssues(data.complaints || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = allIssues.filter((c) => {
    if (filterCat      && c.category !== filterCat)        return false;
    if (filterPriority && c.priority !== filterPriority)   return false;
    if (filterStatus   && c.status   !== filterStatus)     return false;
    return true;
  });

  const hasFilters = filterCat || filterPriority || filterStatus;

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] gap-4">
      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 flex flex-wrap items-center gap-3 z-10">
        <h1 className="text-lg font-bold text-gray-800 mr-2">Admin Map View</h1>
        <span className="text-xs text-gray-400">Showing {filtered.length} of {allIssues.length} issues</span>

        <div className="flex flex-wrap gap-2 ml-auto items-center">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
          >
            <option value="">{t('all_categories')}</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{translateCategory(t, c)}</option>)}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
          >
            <option value="">{t('all_priorities')}</option>
            {['critical','high','medium','low'].map((p) => (
              <option key={p} value={p}>{translatePriority(t, p)}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
          >
            <option value="">{t('all_statuses')}</option>
            {['submitted','ai_processed','community_verified','under_review','in_progress','resolved','closed'].map((s) => (
              <option key={s} value={s}>{t(`status_${s}`)}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setFilterCat(''); setFilterPriority(''); setFilterStatus(''); }}
              className="flex items-center gap-1 text-xs text-red-500 hover:underline font-medium"
            >
              <X size={12} /> {t('clear')}
            </button>
          )}

          <button
            onClick={() => setPanelOpen((o) => !o)}
            className={`flex items-center gap-1 px-2 py-1.5 border rounded-lg text-xs font-medium transition-colors
              ${panelOpen ? 'bg-[#1e40af] border-[#1e40af] text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-[#1e40af]'}`}
          >
            <SlidersHorizontal size={12} /> {t('priority_legend')}
          </button>
        </div>
      </div>

      {/* Map area + optional legend panel */}
      <div className="flex flex-1 relative overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <Loader2 className="animate-spin mr-2" /> {t('loading_map')}
          </div>
        ) : (
          <div className="flex-1">
            <IssueMap complaints={filtered} height="100%" fitBounds={true} isAdmin={true} />
          </div>
        )}

        {/* Floating legend panel */}
        {panelOpen && (
          <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 w-44">
            <Legend t={t} />
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('stats')}</p>
              <p className="text-xs text-gray-600">{t('total')}: <strong>{allIssues.length}</strong></p>
              <p className="text-xs text-gray-600">{t('filtered')}: <strong>{filtered.length}</strong></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMap;
