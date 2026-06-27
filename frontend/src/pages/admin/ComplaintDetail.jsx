import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle2, XCircle,
  MessageSquare, Building2, Wrench, CheckCheck, RefreshCw, FileDown,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import api from '../../api/axios';
import { getComplaint } from '../../api/complaints';
import { updateComplaintStatus, reprocessComplaint } from '../../api/admin';
import StatusBadge from '../../components/common/StatusBadge';
import ComplaintTimeline from '../../components/complaint/ComplaintTimeline';
import AIInsightsPanel from '../../components/complaint/AIInsightsPanel';
import { formatDate, formatRelativeTime } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

const STATUSES = [
  'submitted','ai_processed','evidence_verified','community_verified',
  'under_review','approved','assigned','in_progress','resolved','closed',
];

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const AdminComplaintDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const toast    = useToast();

  const [complaint, setComplaint]   = useState(null);
  const [loading,   setLoading]     = useState(true);
  const [error,     setError]       = useState(null);

  // Action state
  const [selStatus,   setSelStatus]   = useState('');
  const [note,        setNote]        = useState('');
  const [department,  setDepartment]  = useState('');
  const [actLoading,  setActLoading]  = useState(false);
  const [actMsg,      setActMsg]      = useState('');
  const [lightbox,    setLightbox]    = useState(null);
  const [downloading, setDownloading] = useState(false);

  const pollRef = useRef(null);

  const fetchComplaint = useCallback(async () => {
    try {
      const data = await getComplaint(id);
      const c = data.complaint;
      setComplaint(c);
      setSelStatus(c.status);
      setDepartment(c.responsible_department || '');
    } catch {
      setError('Failed to load complaint.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  // Poll until AI ready
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

  const applyStatus = async (status, extraNote = '', dept = '') => {
    setActLoading(true);
    setActMsg('');
    try {
      await updateComplaintStatus(id, status, extraNote || note, dept || department);
      const label = status.replace(/_/g, ' ');
      setActMsg(`Status updated to "${label}"`);
      toast.success(`Status changed to "${label}"`);
      fetchComplaint();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Action failed.';
      setActMsg(msg);
      toast.error(msg);
    } finally {
      setActLoading(false);
    }
  };

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/reports/complaint/${id}`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `civicalign_complaint_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setActMsg('PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleReprocess = async () => {
    setActLoading(true);
    setActMsg('');
    try {
      await reprocessComplaint(id);
      setActMsg('AI pipeline restarted. Refresh in ~30s to see results.');
    } catch (err) {
      setActMsg(err?.response?.data?.error || 'Reprocess failed.');
    } finally {
      setActLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="animate-spin mr-2" size={18} /> Loading…
    </div>
  );

  if (error || !complaint) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
      <AlertCircle size={28} />
      <p>{error || 'Not found'}</p>
      <button onClick={() => navigate(-1)} className="text-sm text-[#1e40af] hover:underline">Go back</button>
    </div>
  );

  const imagePaths = JSON.parse(complaint.image_paths || '[]');
  const videoPaths = JSON.parse(complaint.video_paths || '[]');

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-[#1e40af]">
          <ArrowLeft size={14} /> Back
        </button>
        <span>/</span>
        <Link to="/admin/review" className="hover:text-[#1e40af]">Review</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">#{complaint.id}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: complaint info */}
        <div className="xl:col-span-2 space-y-5">
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{complaint.category}</span>
                <h1 className="text-xl font-bold text-gray-800 mt-1 leading-tight">{complaint.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                  <span>By <strong className="text-gray-700">{complaint.submitter?.full_name || 'Unknown'}</strong></span>
                  <span>·</span>
                  <span>{formatRelativeTime(complaint.created_at)}</span>
                  {complaint.city && <><span>·</span><span>📍 {complaint.city}</span></>}
                  {complaint.duplicate_of_id && (
                    <span className="text-orange-600 font-semibold">⚠ Possible duplicate of #{complaint.duplicate_of_id}</span>
                  )}
                </div>
              </div>
              <StatusBadge status={complaint.status} />
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{complaint.description}</p>

            {/* Evidence gallery */}
            {(imagePaths.length > 0 || videoPaths.length > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Evidence</p>
                
                {imagePaths.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Evidence Photos</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {imagePaths.map((p, i) => (
                        <img key={i} src={`${API_BASE}/${p}`} alt=""
                          className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 border border-gray-100"
                          onClick={() => setLightbox(`${API_BASE}/${p}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {videoPaths.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Evidence Videos</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {videoPaths.map((p, i) => (
                        <video key={i} src={`${API_BASE}/${p}`} controls
                          className="w-full rounded-lg border border-gray-100 shadow-sm"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <AIInsightsPanel complaint={complaint} />
          </div>

          {/* Initiative */}
          {complaint.initiative && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-700 uppercase mb-1">Linked Initiative</p>
              <p className="font-bold text-gray-800">{complaint.initiative.title}</p>
              <p className="text-sm text-gray-600 mt-1">{complaint.initiative.description}</p>
            </div>
          )}
        </div>

        {/* Right: admin actions + meta */}
        <div className="space-y-5">
          {/* Action Panel */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-bold text-gray-800">Admin Actions</h3>

            {actMsg && (
              <div className={`text-xs px-3 py-2 rounded-lg font-medium ${actMsg.includes('fail') || actMsg.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {actMsg}
              </div>
            )}

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyStatus('approved')}
                disabled={actLoading || complaint.status === 'approved'}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 size={13} /> Approve
              </button>
              <button
                onClick={() => applyStatus('under_review', note)}
                disabled={actLoading}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                <XCircle size={13} /> Reject
              </button>
              <button
                onClick={() => applyStatus('in_progress')}
                disabled={actLoading || complaint.status === 'in_progress'}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                <Wrench size={13} /> In Progress
              </button>
              <button
                onClick={() => applyStatus('resolved')}
                disabled={actLoading || complaint.status === 'resolved'}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1e40af] text-white text-xs font-bold rounded-lg hover:bg-blue-800 disabled:opacity-50"
              >
                <CheckCheck size={13} /> Resolve
              </button>
            </div>

            {/* Note textarea */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Note / Rejection Reason</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add a note for the citizen…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e40af] resize-none"
              />
            </div>

            {/* Department assign */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assign Department</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Department name"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                />
                <button
                  onClick={() => applyStatus('assigned', note, department)}
                  disabled={actLoading || !department}
                  className="flex items-center gap-1 px-3 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  <Building2 size={12} /> Assign
                </button>
              </div>
            </div>

            {/* Manual status */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Set Status Manually</label>
              <div className="flex gap-2">
                <select
                  value={selStatus}
                  onChange={(e) => setSelStatus(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1e40af]"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <button
                  onClick={() => applyStatus(selStatus, note)}
                  disabled={actLoading || selStatus === complaint.status}
                  className="px-3 py-2 bg-gray-700 text-white text-xs font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  Set
                </button>
              </div>
            </div>

            {/* Download PDF Report */}
            <button
              onClick={downloadReport}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-[#1e40af] text-[#1e40af] text-xs font-semibold rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {downloading
                ? <Loader2 size={12} className="animate-spin" />
                : <FileDown size={12} />}
              {downloading ? 'Generating PDF…' : 'Download Report'}
            </button>

            {/* Reprocess */}
            <button
              onClick={handleReprocess}
              disabled={actLoading}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={12} /> Reprocess AI Pipeline
            </button>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">Complaint Lifecycle</h3>
            <ComplaintTimeline
              currentStatus={complaint.status}
              statusHistory={complaint.status_history || []}
            />
          </div>

          {/* Mini map */}
          {complaint.latitude && complaint.longitude && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-600 mb-2">Location</p>
              <div className="h-40 rounded-lg overflow-hidden">
                <MapContainer center={[complaint.latitude, complaint.longitude]} zoom={15}
                  style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false} scrollWheelZoom={false}>
                  <TileLayer attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" />
                  <CircleMarker center={[complaint.latitude, complaint.longitude]} radius={10}
                    pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.85 }} />
                </MapContainer>
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-xs space-y-2">
            {[
              ['ID',         `#${complaint.id}`],
              ['Submitted',  formatDate(complaint.created_at)],
              ['Submitter',  complaint.submitter?.full_name || '—'],
              ['Verifications', complaint.verify_count ?? 0],
              ['Supporters',    complaint.support_count ?? 0],
              ['Initiative', complaint.initiative_id ? `#${complaint.initiative_id}` : 'None'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-400">{k}</span>
                <span className="font-semibold text-gray-700">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Evidence" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default AdminComplaintDetail;
