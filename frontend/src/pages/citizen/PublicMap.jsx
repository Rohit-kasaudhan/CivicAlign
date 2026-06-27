import React, { useEffect, useState } from 'react';
import { Loader2, SlidersHorizontal, X, MapPin } from 'lucide-react';
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
  critical: '#C0392B', // Danger Red
  high:     '#E67E22', // Orange
  medium:   '#F1C40F', // Yellow
  low:      '#2ECC71', // Emerald Green
};

const Legend = ({ t }) => (
  <div className="space-y-3">
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Priority Levels</p>
      <div className="space-y-2">
        {Object.entries(PRIORITY_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-xs font-semibold text-gray-700 capitalize">{translatePriority(t, key)}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#0F7B6C]" />
          <span className="text-xs font-semibold text-gray-700">Resolved / Closed</span>
        </div>
      </div>
    </div>
  </div>
);

const PublicMap = () => {
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
    <div className="flex flex-col h-[calc(100vh-10rem)] gap-4 page-fade">
      {/* Header and Toolbar Toolbar */}
      <div className="bg-white border border-[#DDE3ED] rounded-xl shadow-sm px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#1A3A6B]/5">
            <MapPin className="text-[#1A3A6B]" size={18} />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-800 leading-none font-poppins">{t('public_issues_map')}</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Geographic master board</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="gov-input !py-1.5 !px-2.5 !text-xs w-40"
          >
            <option value="">{t('all_categories')}</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{translateCategory(t, c)}</option>)}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="gov-input !py-1.5 !px-2.5 !text-xs w-36"
          >
            <option value="">{t('all_priorities')}</option>
            {['critical','high','medium','low'].map((p) => (
              <option key={p} value={p}>{translatePriority(t, p)}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="gov-input !py-1.5 !px-2.5 !text-xs w-36"
          >
            <option value="">{t('all_statuses')}</option>
            {['submitted','ai_processed','community_verified','under_review','in_progress','resolved','closed'].map((s) => (
              <option key={s} value={s}>{t(`status_${s}`)}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setFilterCat(''); setFilterPriority(''); setFilterStatus(''); }}
              className="text-xs text-[#C0392B] font-bold hover:underline px-1 py-1"
            >
              Reset
            </button>
          )}

          <button
            onClick={() => setPanelOpen((o) => !o)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-bold transition-all
              ${panelOpen ? 'bg-[#1A3A6B]/5 border-[#1A3A6B] text-[#1A3A6B]' : 'bg-white border-[#DDE3ED] text-[#5A6A7A] hover:bg-gray-50'}`}
          >
            <SlidersHorizontal size={13} /> Legend
          </button>
        </div>
      </div>

      {/* Map area + floating panel */}
      <div className="flex-1 relative overflow-hidden rounded-xl border border-[#DDE3ED] shadow-inner bg-gray-50">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2.5">
            <Loader2 className="animate-spin text-[#1A3A6B]" size={24} />
            <span className="text-sm font-semibold">{t('loading_map')}</span>
          </div>
        ) : (
          <div className="w-full h-full">
            <IssueMap complaints={filtered} height="100%" fitBounds={true} />
          </div>
        )}

        {/* Floating panel */}
        {!loading && panelOpen && (
          <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 w-48 space-y-4">
            <Legend t={t} />
            <div className="pt-3 border-t border-gray-150">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Map Statistics</p>
              <div className="flex justify-between text-xs font-semibold text-gray-600">
                <span>Total Pinned:</span>
                <span className="text-gray-800 font-extrabold">{allIssues.length}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-gray-600 mt-1">
                <span>Matches:</span>
                <span className="text-gray-800 font-extrabold">{filtered.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicMap;
