import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Layers, Users, FileText, FileDown } from 'lucide-react';
import { getAdminInitiatives, updateInitiative } from '../../api/admin';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const STATUS_OPTIONS = ['proposed', 'planning', 'active', 'completed'];

const STATUS_COLOR = {
  proposed:  'bg-blue-100 text-blue-700',
  planning:  'bg-yellow-100 text-yellow-700',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
};

const InitiativeCard = ({ initiative, onUpdate }) => {
  const toast = useToast();
  const [expanded,     setExpanded]     = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [status,       setStatus]       = useState(initiative.status);
  const [dept,         setDept]         = useState(initiative.department || '');
  const [saving,       setSaving]       = useState(false);
  const [downloading,  setDownloading]  = useState(false);

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/reports/initiative/${initiative.id}`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `civicalign_initiative_${initiative.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateInitiative(initiative.id, { status, department: dept });
      onUpdate();
    } catch {} finally { setSaving(false); setEditing(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{initiative.category}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${STATUS_COLOR[initiative.status] || STATUS_COLOR.proposed}`}>
                {initiative.status}
              </span>
            </div>
            <h3 className="font-bold text-gray-800 leading-tight">{initiative.title}</h3>
          </div>
          <button onClick={() => setExpanded((e) => !e)} className="text-gray-400 hover:text-gray-600 mt-1 shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-lg font-black text-gray-800">{initiative.total_complaints || 0}</p>
            <p className="text-xs text-gray-400">Complaints</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-lg font-black text-gray-800">{(initiative.total_citizens_affected || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-400">Citizens</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 col-span-2">
            <p className="text-sm font-bold text-gray-700 truncate">{initiative.estimated_budget || 'TBD'}</p>
            <p className="text-xs text-gray-400">Budget</p>
          </div>
        </div>

        {initiative.department && (
          <p className="text-xs text-gray-500 mt-2">Dept: <strong className="text-gray-700">{initiative.department}</strong></p>
        )}
        {initiative.timeline && (
          <p className="text-xs text-gray-500">Timeline: <strong className="text-gray-700">{initiative.timeline}</strong></p>
        )}
      </div>

      {/* Expandable detail */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
          {initiative.description && (
            <p className="text-sm text-gray-700 leading-relaxed">{initiative.description}</p>
          )}

          {/* Linked complaints */}
          {initiative.complaints?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase mb-2">Linked Complaints</p>
              <ul className="space-y-1.5">
                {initiative.complaints.map((c) => (
                  <li key={c.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                    <Link to={`/admin/complaints/${c.id}`} className="text-xs font-medium text-[#1e40af] hover:underline">
                      #{c.id} — {c.title}
                    </Link>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Edit controls */}
          {editing ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e40af]">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
                <input type="text" value={dept} onChange={(e) => setDept(e.target.value)}
                  placeholder="Department" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e40af]" />
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving}
                  className="px-4 py-2 bg-[#1e40af] text-white text-xs font-bold rounded-lg hover:bg-blue-800 disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => setEditing(true)}
                className="text-xs text-[#1e40af] font-semibold hover:underline">
                Edit Status / Department →
              </button>
              <button
                onClick={downloadReport}
                disabled={downloading}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-[#1e40af] text-[#1e40af] text-xs font-semibold rounded-lg hover:bg-blue-50 disabled:opacity-60 transition-colors"
              >
                {downloading
                  ? <Loader2 size={11} className="animate-spin" />
                  : <FileDown size={11} />}
                {downloading ? 'Generating…' : 'Download PDF'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Initiatives = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setData(await getAdminInitiatives()); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader2 className="animate-spin mr-2" size={18} /> Loading initiatives…
    </div>
  );

  const initiatives = data?.initiatives || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Development Initiatives</h1>
        <p className="text-xs text-gray-500 mt-0.5">AI-clustered complaint groups driving coordinated municipal action</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Layers,   label: 'Total Initiatives',   value: data?.total || 0 },
          { icon: FileText, label: 'Complaints Clustered', value: data?.total_clustered || 0 },
          { icon: Users,    label: 'Citizens Affected',   value: (data?.total_citizens || 0).toLocaleString() },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
            <div className="p-2 bg-blue-50 rounded-lg"><Icon size={18} className="text-[#1e40af]" /></div>
            <div>
              <p className="text-xl font-black text-gray-800">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {initiatives.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          <Layers size={32} className="mx-auto mb-2 opacity-40" />
          <p className="font-medium">No initiatives yet</p>
          <p className="text-sm mt-1">They are auto-created when 3+ similar complaints cluster together.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {initiatives.map((ini) => (
            <InitiativeCard key={ini.id} initiative={ini} onUpdate={load} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Initiatives;
