import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ThumbsUp, ShieldCheck, Loader2, MapPin } from 'lucide-react';
import { getFeed } from '../../api/complaints';
import { verifyComplaint, supportComplaint } from '../../api/community';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import { CATEGORIES } from '../../utils/constants';
import { formatRelativeTimeLocalized, localizedCategoryOptions, translateCategory, translatePriority, translateNotification } from '../../utils/i18n';
import { translations } from '../../utils/translations';
import { citizenTranslations } from '../../utils/citizenTranslations';

const tEn = (key) => {
  return (
    citizenTranslations['en']?.[key] ??
    translations['en']?.[key] ??
    key
  );
};

const PRIORITY_PILL = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-yellow-100 text-yellow-700',
  low:      'bg-green-100 text-green-700',
};

const ComplaintCard = ({ complaint, onAction }) => {
  const t = tEn;
  const { user } = useAuth();
  const toast    = useToast();
  const [verifying, setVerifying]   = useState(false);
  const [supporting, setSupporting] = useState(false);

  const isOwner = user && complaint.submitter?.id === user.id;

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await verifyComplaint(complaint.id);
      toast.success(t('notif_verified_title'));
      onAction();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || t('comm_verify'));
    } finally {
      setVerifying(false);
    }
  };

  const handleSupport = async (e) => {
    e.preventDefault();
    setSupporting(true);
    try {
      await supportComplaint(complaint.id);
      toast.success(t('notif_supported_title'));
      onAction();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || t('comm_support'));
    } finally {
      setSupporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{translateCategory(t, complaint.category)}</span>
            {complaint.priority && (
              <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${PRIORITY_PILL[complaint.priority] || PRIORITY_PILL.medium}`}>
                {translatePriority(t, complaint.priority)}
              </span>
            )}
          </div>
          <Link to={`/complaints/${complaint.id}`} className="font-bold text-gray-800 hover:text-[#1e40af] hover:underline line-clamp-2 leading-tight">
            {complaint.title}
          </Link>
        </div>
        <StatusBadge status={complaint.status} />
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{complaint.description}</p>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="font-medium text-gray-500">{complaint.submitter?.full_name || t('anonymous')}</span>
        {complaint.city && <><span>·</span><span className="flex items-center gap-0.5"><MapPin size={10} />{complaint.city}</span></>}
        <span>·</span>
        <span>{formatRelativeTimeLocalized(complaint.created_at, t)}</span>
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        {user && !isOwner ? (
          <button
            onClick={handleVerify}
            disabled={verifying || complaint.user_verified}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
              ${complaint.user_verified ? 'bg-teal-50 border-teal-300 text-teal-700 cursor-default' :
                'bg-white border-gray-300 hover:border-teal-500 hover:text-teal-600'}`}
          >
            {verifying ? <Loader2 size={10} className="animate-spin" /> : <ShieldCheck size={12} />}
            {complaint.user_verified ? t('verified') : t('verify')} · {complaint.verify_count || 0}
          </button>
        ) : (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <ShieldCheck size={12} /> {complaint.verify_count || 0} {t('verifications_lower')}
          </span>
        )}

        {user ? (
          <button
            onClick={handleSupport}
            disabled={supporting || complaint.user_supported}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
              ${complaint.user_supported ? 'bg-blue-50 border-blue-300 text-[#1e40af] cursor-default' :
                'bg-white border-gray-300 hover:border-blue-500 hover:text-[#1e40af]'}`}
          >
            {supporting ? <Loader2 size={10} className="animate-spin" /> : <ThumbsUp size={12} />}
            {complaint.user_supported ? t('supported') : t('support')} · {complaint.support_count || 0}
          </button>
        ) : (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <ThumbsUp size={12} /> {complaint.support_count || 0} {t('supporters')}
          </span>
        )}
      </div>
    </div>
  );
};

const CommunityFeed = () => {
  const t = tEn;
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterCat, setFilterCat]   = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    try {
      const params = {};
      if (filterCat)    params.category = filterCat;
      if (filterCity)   params.city     = filterCity;
      if (filterStatus) params.status   = filterStatus;
      const data = await getFeed(params);
      setComplaints(data.complaints || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterCat, filterCity, filterStatus]);

  const visible = useMemo(() => {
    if (!search.trim()) return complaints;
    const q = search.toLowerCase();
    return complaints.filter((c) =>
      c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );
  }, [complaints, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">{t('nav_community')}</h1>
        <p className="text-sm text-gray-500">{t('issues_count').replace('{count}', visible.length)}</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
          />
        </div>

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
        >
          <option value="">{t('all_categories')}</option>
          {localizedCategoryOptions(t).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
        >
          <option value="">{t('all_statuses')}</option>
          {['submitted','ai_processed','community_verified','under_review','in_progress','resolved'].map((s) => (
            <option key={s} value={s}>{t(`status_${s}`)}</option>
          ))}
        </select>

        <input
          type="text"
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          placeholder={t('city')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af] w-32"
        />

        {(filterCat || filterStatus || filterCity) && (
          <button
            onClick={() => { setFilterCat(''); setFilterStatus(''); setFilterCity(''); }}
            className="text-xs text-red-500 hover:underline font-medium"
          >
            {t('clear_filters')}
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <Loader2 className="animate-spin mr-2" /> {t('loading_feed')}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
          <p className="font-medium">{t('no_filter_matches')}</p>
          <Link to="/report" className="text-sm text-[#1e40af] hover:underline">{t('first_to_report')}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((c) => (
            <ComplaintCard key={c.id} complaint={c} onAction={load} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityFeed;


