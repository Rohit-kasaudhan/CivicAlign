import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Layers, Users, FileText, FileDown, Calendar, Award, Play, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';
import { getAdminInitiatives, updateInitiative } from '../../api/admin';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const STATUS_OPTIONS = ['proposed', 'planning', 'active', 'completed'];

const STATUS_COLOR = {
  proposed:  'bg-blue-50 text-blue-700 border border-blue-100',
  planning:  'bg-yellow-50 text-yellow-700 border border-yellow-100',
  active:    'bg-green-50 text-green-700 border border-green-100',
  completed: 'bg-gray-50 text-gray-600 border border-gray-150',
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded uppercase tracking-wider">{initiative.category}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${STATUS_COLOR[initiative.status] || STATUS_COLOR.proposed}`}>
                {initiative.status}
              </span>
            </div>
            <h3 className="font-extrabold text-sm text-gray-800 leading-snug font-poppins">{initiative.title}</h3>
          </div>
          <button onClick={() => setExpanded((e) => !e)} className="text-gray-400 hover:text-gray-600 mt-1 shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center my-3.5">
          <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
            <p className="text-base font-extrabold text-gray-800">{initiative.total_complaints || 0}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reports</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
            <p className="text-base font-extrabold text-gray-800">{(initiative.total_citizens_affected || 0).toLocaleString()}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Citizens</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 col-span-2 border border-gray-100">
            <p className="text-xs font-bold text-gray-700 truncate leading-snug">{initiative.estimated_budget || 'TBD'}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Budget</p>
          </div>
        </div>

        {initiative.department && (
          <p className="text-xs text-[#5A6A7A] mt-2 font-semibold">Dept: <strong className="text-gray-700">{initiative.department}</strong></p>
        )}
        {initiative.timeline && (
          <p className="text-xs text-[#5A6A7A] font-semibold">Timeline: <strong className="text-gray-700">{initiative.timeline}</strong></p>
        )}
      </div>

      {/* Expandable detail */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-5 space-y-4">
          {initiative.description && (
            <p className="text-xs text-gray-600 leading-relaxed font-medium">{initiative.description}</p>
          )}

          {/* Linked complaints */}
          {initiative.complaints?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#5A6A7A] uppercase tracking-wider mb-2">Linked Complaints</p>
              <ul className="space-y-1.5">
                {initiative.complaints.map((c) => (
                  <li key={c.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-150 shadow-sm">
                    <Link to={`/admin/complaints/${c.id}`} className="text-xs font-bold text-[#1A3A6B] hover:underline truncate mr-2">
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
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex gap-2">
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
                <input type="text" value={dept} onChange={(e) => setDept(e.target.value)}
                  placeholder="Department" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(false)}
                  className="gov-btn-secondary !text-[11px] !py-1 !px-2.5">
                  Cancel
                </button>
                <button onClick={save} disabled={saving}
                  className="gov-btn-primary !text-[11px] !py-1 !px-3 shadow-sm">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-3 border-t border-gray-150">
              <button onClick={() => setEditing(true)}
                className="text-xs text-[#1A3A6B] font-bold hover:underline">
                Edit Details
              </button>
              <button
                onClick={downloadReport}
                disabled={downloading}
                className="ml-auto flex items-center gap-1 px-3 py-1 border border-[#1A3A6B] text-[#1A3A6B] text-[11px] font-bold rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
              >
                {downloading ? <Loader2 size={11} className="animate-spin" /> : <FileDown size={11} />}
                Download PDF
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Initiatives = () => {
  const toast = useToast();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'year1', 'year3'
  
  // Agent running state simulation
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentStep, setAgentStep] = useState(0);

  const load = async () => {
    setLoading(true);
    try { setData(await getAdminInitiatives()); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const triggerAgentPipeline = () => {
    setRunningAgent(true);
    setAgentStep(1);
    toast.success("Planning Agent activated. Scanning complaints...");
    
    // Step 1: Scanning
    setTimeout(() => {
      setAgentStep(2);
      toast.success("Semantic Clustering Agent matching geographical nodes...");
    }, 2000);

    // Step 2: Budgeting
    setTimeout(() => {
      setAgentStep(3);
      toast.success("Reporting Agent compiling investment estimates...");
    }, 4000);

    // Step 3: Complete
    setTimeout(() => {
      setRunningAgent(false);
      setAgentStep(0);
      toast.success("AI Development Planning Agent Pipeline complete!");
      load();
    }, 6000);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
      <Loader2 className="animate-spin text-[#1A3A6B]" size={24} />
      <span className="text-sm font-semibold">Loading initiatives console…</span>
    </div>
  );

  const initiatives = data?.initiatives || [];

  return (
    <div className="space-y-6 page-fade">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 font-poppins">Development Console</h1>
        <p className="text-xs text-gray-500 mt-0.5">Cluster municipal reports and manage multi-year master plans with Agentic AI</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Pane: Console Tools, Stats, Timeline */}
        <div className="xl:col-span-4 space-y-6">
          {/* Agent Runner Box */}
          <div className="bg-white rounded-xl border border-[#DDE3ED] p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-gray-800 font-poppins border-b border-gray-100 pb-2">AI Master Planner</h3>
            {runningAgent ? (
              <div className="space-y-3.5 py-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1A3A6B]">
                  <Loader2 className="animate-spin" size={14} />
                  <span>
                    {agentStep === 1 && 'Scanning municipal database...'}
                    {agentStep === 2 && 'Clustering geographical categories...'}
                    {agentStep === 3 && 'Formulating roadmap models...'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#1A3A6B] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(agentStep / 3) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={triggerAgentPipeline}
                className="w-full gov-btn-primary flex items-center justify-center gap-2 py-3 shadow-md"
              >
                <Play size={14} fill="currentColor" /> Run Planning Agents
              </button>
            )}
            <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
              Runs semantic scanners to groups 3+ complaints into capital investment initiatives.
            </p>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-white rounded-xl border border-[#DDE3ED] p-5 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-gray-800 font-poppins border-b border-gray-100 pb-2">Console Summary</h3>
            {[
              { icon: Layers,   label: 'Initiatives', value: data?.total || 0, color: 'text-[#1A3A6B]' },
              { icon: FileText, label: 'Clustered Reports', value: data?.total_clustered || 0, color: 'text-[#0F7B6C]' },
              { icon: Users,    label: 'Affected Citizens', value: (data?.total_citizens || 0).toLocaleString(), color: 'text-[#F5A623]' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <Icon size={14} className={color} />
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</span>
                </div>
                <span className="text-sm font-black text-gray-800 font-poppins">{value}</span>
              </div>
            ))}
          </div>

          {/* Historical timeline & ranking */}
          <div className="bg-white rounded-xl border border-[#DDE3ED] p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-gray-800 font-poppins border-b border-gray-100 pb-2">Investment Priority</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-red-50 text-[#C0392B] border border-red-100 flex items-center justify-center font-bold font-mono">1</div>
                <div>
                  <p className="font-bold text-gray-800">Road Infrastructure</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">High citizens impact · 3 Active</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-5 h-5 rounded-full bg-orange-50 text-orange-700 border border-orange-100 flex items-center justify-center font-bold font-mono">2</div>
                <div>
                  <p className="font-bold text-gray-800">Water Supply Network</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Medium urgency · 1 Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Pane: Master tabs */}
        <div className="xl:col-span-8 space-y-5">
          <div className="flex bg-[#F4F6FA] p-1 border border-[#DDE3ED] rounded-xl">
            {[
              { key: 'list', label: 'Active Clusters' },
              { key: 'year1', label: '1-Year Roadmap' },
              { key: 'year3', label: '3-Year Master Plan' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === key ? 'bg-white text-[#1A3A6B] shadow-sm' : 'text-[#5A6A7A] hover:text-[#1A1A2E]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'list' && (
            <div className="space-y-4">
              {initiatives.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#DDE3ED] p-10 text-center text-gray-400 shadow-sm">
                  <Layers size={36} className="mx-auto mb-2 opacity-40 text-gray-500" />
                  <p className="font-bold text-gray-700">No active initiative clusters yet</p>
                  <p className="text-xs text-gray-400 mt-1">Initiatives are auto-created when 3+ similar complaints are scanned in a region.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {initiatives.map((ini) => (
                    <InitiativeCard key={ini.id} initiative={ini} onUpdate={load} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'year1' && (
            <div className="bg-white border border-[#DDE3ED] rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-extrabold text-sm text-gray-800 font-poppins">1-Year Capital Projects Roadmap</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Short-term municipal budget allocation and deadlines</p>
              </div>
              
              <div className="relative pl-6 border-l-2 border-[#1A3A6B]/25 space-y-6">
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-[#1A3A6B] border-4 border-white shadow-sm" />
                  <h4 className="text-xs font-bold text-gray-800">Q1: Pothole & Road Repair Program</h4>
                  <p className="text-xs text-[#5A6A7A] mt-1">Status: Budget approved (Est. $45,000) · 3 linked locations</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-[#0F7B6C] border-4 border-white shadow-sm" />
                  <h4 className="text-xs font-bold text-gray-800">Q2: Water Main Restoration</h4>
                  <p className="text-xs text-[#5A6A7A] mt-1">Status: Feasibility study in progress · 1 linked location</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-gray-300 border-4 border-white shadow-sm" />
                  <h4 className="text-xs font-bold text-gray-800">Q3-Q4: Smart Streetlighting Upgrade</h4>
                  <p className="text-xs text-[#5A6A7A] mt-1">Status: Proposed allocation phase</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'year3' && (
            <div className="bg-white border border-[#DDE3ED] rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="font-extrabold text-sm text-gray-800 font-poppins">3-Year Infrastructure Development Plan</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Long-term capital works planning model</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-gray-150 rounded-xl p-4 bg-gray-50/50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Year 1</span>
                  <p className="font-extrabold text-sm text-gray-800 mt-2 font-poppins">Emergency Restorations</p>
                  <p className="text-[11px] text-[#5A6A7A] mt-1 leading-normal">Focusing on high-priority road blockages, structural sewer fixes, and basic street illumination.</p>
                </div>
                <div className="border border-gray-150 rounded-xl p-4 bg-gray-50/50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Year 2</span>
                  <p className="font-extrabold text-sm text-gray-800 mt-2 font-poppins">Utility Networks</p>
                  <p className="text-[11px] text-[#5A6A7A] mt-1 leading-normal">Expanding water pipeline capacities and upgrading clean drainage systems across scanned hotspots.</p>
                </div>
                <div className="border border-gray-150 rounded-xl p-4 bg-gray-50/50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Year 3</span>
                  <p className="font-extrabold text-sm text-gray-800 mt-2 font-poppins">Smart City Integration</p>
                  <p className="text-[11px] text-[#5A6A7A] mt-1 leading-normal">Implementing centralized sensor networks, smart traffic routing, and clean energy grid nodes.</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Initiatives;
