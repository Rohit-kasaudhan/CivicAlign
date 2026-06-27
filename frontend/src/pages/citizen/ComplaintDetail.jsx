import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { ThumbsUp, ShieldCheck, ArrowLeft, Loader2, AlertCircle, FileDown } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import api from '../../api/axios';
import { getComplaint } from '../../api/complaints';
import { verifyComplaint, supportComplaint } from '../../api/community';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../hooks/useLanguage';
import StatusBadge from '../../components/common/StatusBadge';
import ComplaintTimeline from '../../components/complaint/ComplaintTimeline';
import AIInsightsPanel from '../../components/complaint/AIInsightsPanel';
import { formatDate } from '../../utils/helpers';
import { formatRelativeTimeLocalized, translateCategory, translatePriority } from '../../utils/i18n';

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const ComplaintDetail = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const toast       = useToast();
  const { t }       = useLanguage();

  const [complaint, setComplaint]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [verifying,   setVerifying]   = useState(false);
  const [supporting,  setSupporting]  = useState(false);
  const [lightbox,    setLightbox]    = useState(null);
  const [downloading, setDownloading] = useState(false);

  const pollRef = useRef(null);

  const fetchComplaint = useCallback(async () => {
    try {
      const data = await getComplaint(id);
      setComplaint(data.complaint);
    } catch {
      setError(t('no_data'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  // Poll until AI analysis is complete
  useEffect(() => {
    if (!complaint) return;
    const status = complaint.status;
    if (status && status !== 'submitted' && status !== 'ai_processed' && status !== 'evidence_verified') {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(fetchComplaint, 3000);
    return () => clearInterval(pollRef.current);
  }, [complaint?.status, fetchComplaint]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await verifyComplaint(complaint.id);
      toast.success(t('notif_verified_title'));
      fetchComplaint();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || t('comm_verify'));
    } finally {
      setVerifying(false);
    }
  };

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/reports/complaint/${complaint.id}`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `civicalign_complaint_${complaint.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not generate report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSupport = async () => {
    setSupporting(true);
    try {
      await supportComplaint(complaint.id);
      toast.success(t('notif_supported_title'));
      fetchComplaint();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || t('comm_support'));
    } finally {
      setSupporting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="animate-spin mr-2" /> {t('loading')}
    </div>
  );

  if (error || !complaint) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
      <AlertCircle size={32} />
      <p>{error || t('no_data')}</p>
      <button onClick={() => navigate(-1)} className="text-sm text-[#1e40af] hover:underline">{t('form_back')}</button>
    </div>
  );

  const imagePaths     = JSON.parse(complaint.image_paths || '[]');
  const videoPaths     = JSON.parse(complaint.video_paths || '[]');
  const isOwner        = user && complaint.submitter?.id === user.id;
  const alreadyVerified  = complaint.user_verified;
  const alreadySupported = complaint.user_supported;
  const canVerify  = user && !isOwner && !alreadyVerified;
  const canSupport = user && !alreadySupported;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1e40af]">
        <ArrowLeft size={14} /> {t('form_back')}
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{translateCategory(t, complaint.category)}</span>
            <h1 className="text-2xl font-bold text-gray-800 mt-1 leading-tight">{complaint.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
              <span>By <strong className="text-gray-700">{complaint.submitter?.full_name || t('anonymous')}</strong></span>
              <span>·</span>
              <span title={formatDate(complaint.created_at)}>{formatRelativeTimeLocalized(complaint.created_at, t)}</span>
              {complaint.city && <><span>·</span><span>📍 {complaint.city}</span></>}
            </div>
          </div>
          <StatusBadge status={complaint.status} localized />
        </div>

        {/* Description */}
        <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4 text-sm">{complaint.description}</p>

        {/* Community actions */}
        <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-gray-100">
          <button
            onClick={handleVerify}
            disabled={!canVerify || verifying}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors
              ${alreadyVerified ? 'bg-teal-50 border-teal-300 text-teal-700 cursor-default' :
                canVerify ? 'bg-white border-gray-300 hover:border-teal-500 hover:text-teal-600' :
                'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {verifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            {alreadyVerified ? t('you_verified') : t('verify')} · {complaint.verify_count || 0}
          </button>

          <button
            onClick={handleSupport}
            disabled={!canSupport || supporting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors
              ${alreadySupported ? 'bg-blue-50 border-blue-300 text-[#1e40af] cursor-default' :
                canSupport ? 'bg-white border-gray-300 hover:border-blue-500 hover:text-[#1e40af]' :
                'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            {supporting ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
            {alreadySupported ? t('you_supported') : t('support')} · {complaint.support_count || 0}
          </button>

          {!user && (
            <p className="text-xs text-gray-400 self-center">
              <Link to="/login" className="text-[#1e40af] hover:underline">{t('login')}</Link> {t('login_to_interact')}
            </p>
          )}
          {isOwner && (
            <p className="text-xs text-gray-400 self-center">{t('cannot_verify_own')}</p>
          )}

          {/* Download Report — only for the owner */}
          {isOwner && (
            <button
              onClick={downloadReport}
              disabled={downloading}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-[#1e40af] text-[#1e40af] hover:bg-blue-50 disabled:opacity-60 transition-colors"
            >
              {downloading
                ? <Loader2 size={14} className="animate-spin" />
                : <FileDown size={14} />}
              {downloading ? t('generating') : t('download_report')}
            </button>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evidence gallery */}
          {(imagePaths.length > 0 || videoPaths.length > 0) && (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-5 space-y-4">
              <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">{t('evidence')}</h3>
              
              {imagePaths.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('evidence_photos')}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {imagePaths.map((path, i) => (
                      <img
                        key={i}
                        src={`${API_BASE}/${path}`}
                        alt={`Evidence ${i + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightbox(`${API_BASE}/${path}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {videoPaths.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Evidence Videos</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {videoPaths.map((path, i) => (
                      <video
                        key={i}
                        src={`${API_BASE}/${path}`}
                        controls
                        className="w-full rounded-lg border border-gray-100 shadow-sm"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Insights */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
            <AIInsightsPanel complaint={complaint} />
          </div>

          {/* Initiative panel */}
          {complaint.initiative && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">{t('linked_initiative')}</p>
              <p className="font-bold text-gray-800">{complaint.initiative.title}</p>
              <p className="text-sm text-gray-600 mt-1">{complaint.initiative.description}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>{t('status')}: <strong>{complaint.initiative.status}</strong></span>
                <span>{t('dept')}: <strong>{complaint.initiative.department}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Status timeline */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4">{t('complaint_lifecycle')}</h3>
            <ComplaintTimeline
              currentStatus={complaint.status}
              statusHistory={complaint.status_history || []}
            />
          </div>

          {/* Mini map */}
          {complaint.latitude && complaint.longitude && (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-5">
              <h3 className="font-bold text-gray-800 mb-3">{t('location')}</h3>
              <div className="h-44 rounded-lg overflow-hidden">
                <MapContainer
                  center={[complaint.latitude, complaint.longitude]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                  />
                  <CircleMarker
                    center={[complaint.latitude, complaint.longitude]}
                    radius={10}
                    pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.85 }}
                  />
                </MapContainer>
              </div>
              {complaint.address && (
                <p className="text-xs text-gray-500 mt-2">📍 {complaint.address}{complaint.city ? `, ${complaint.city}` : ''}</p>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-5 text-sm space-y-2">
            <h3 className="font-bold text-gray-800 mb-3">{t('details')}</h3>
            {[
              [t('complaint_id'), `#${complaint.id}`],
              [t('submitted'),    formatDate(complaint.created_at)],
              [t('category'),     translateCategory(t, complaint.category)],
              [t('priority'),     complaint.priority ? translatePriority(t, complaint.priority) : t('pending')],
              [t('verifications_lower'), complaint.verify_count || 0],
              [t('supporters'),   complaint.support_count || 0],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium text-gray-700 capitalize">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Evidence" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default ComplaintDetail;
