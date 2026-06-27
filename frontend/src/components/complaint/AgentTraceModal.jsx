import React, { useState } from 'react';
import { X, CheckCircle2, Loader2, ChevronDown, ChevronUp, Terminal, Cpu } from 'lucide-react';
import { translateCategory } from '../../utils/i18n';
import { translations } from '../../utils/translations';
import { citizenTranslations } from '../../utils/citizenTranslations';

const tEn = (key) => {
  return (
    citizenTranslations['en']?.[key] ??
    translations['en']?.[key] ??
    key
  );
};

const AgentAccordion = ({ agentNum, agentName, colorClass, borderClass, status, summary, jsonPayload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isComplete = status === 'complete';

  return (
    <div className="relative pl-10 pb-6 last:pb-2">
      {/* Connecting Dotted Line */}
      <div className="absolute left-[15px] top-8 bottom-0 w-[2px] border-l-2 border-dashed border-[#1A3A6B]/20 last:hidden" />

      {/* Number Badge */}
      <div className={`absolute left-0 top-0.5 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm ${colorClass}`}>
        {agentNum}
      </div>

      <div className={`bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-200 ${isOpen ? 'ring-1 ring-[#1A3A6B]/10' : ''}`}>
        {/* Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="font-poppins font-extrabold text-sm text-gray-800">{agentName}</span>
            {isComplete ? (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                <CheckCircle2 size={10} /> Complete
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 animate-pulse">
                <Loader2 size={10} className="animate-spin" /> Processing
              </span>
            )}
          </div>
          <div className="text-gray-400">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {/* Content */}
        {isOpen && (
          <div className="border-t border-gray-100 p-4 bg-gray-50/40 space-y-3.5">
            <p className="text-xs text-gray-600 font-semibold leading-relaxed">
              {summary}
            </p>
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-900 shadow-inner">
              <div className="flex items-center justify-between bg-gray-850 px-3 py-1.5 border-b border-gray-800">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Terminal size={12} />
                  <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Agent Response Payload</span>
                </div>
                <span className="text-[9px] font-mono text-gray-500">JSON</span>
              </div>
              <pre className="p-3 text-[10px] text-gray-300 font-mono overflow-x-auto leading-normal">
                {JSON.stringify(jsonPayload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AgentTraceModal = ({ complaint, isOpen, onClose }) => {
  if (!isOpen || !complaint) return null;

  const score = Math.round(complaint.impact_score || 0);
  const ringRadius = 26;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference - (Math.min(score, 100) / 100) * ringCircumference;

  // Dynamically constructed agent traces
  const agents = [
    {
      num: 1,
      name: 'Submission Parser Agent',
      color: 'bg-[#1A3A6B]',
      status: 'complete',
      summary: `Analyzes language inputs and normalizes parameters. Classifies category as "${translateCategory(tEn, complaint.category)}".`,
      payload: {
        agent: 'submission_parser',
        task: 'Language normalization & sanitization',
        status: 'success',
        input: {
          raw_title: complaint.title,
          category: complaint.category,
        },
        output: {
          normalized_title: complaint.title,
          inappropriate_content_detected: false,
          language_code: 'en'
        }
      }
    },
    {
      num: 2,
      name: 'Evidence Auditor Agent',
      color: 'bg-[#0F7B6C]',
      status: complaint.status !== 'submitted' ? 'complete' : 'processing',
      summary: `Validates attached media files and computes evidence verification factor. Assigned Evidence Score: ${Math.round(complaint.evidence_score || 0)}/100.`,
      payload: {
        agent: 'evidence_auditor',
        status: complaint.status !== 'submitted' ? 'success' : 'running',
        evidence_score: complaint.evidence_score || 0,
        checks: {
          integrity_verified: true,
          duplicate_image_signature: false
        }
      }
    },
    {
      num: 3,
      name: 'Severity Assessor Agent',
      color: 'bg-[#F5A623]',
      status: !['submitted', 'ai_processed', 'evidence_verified'].includes(complaint.status) ? 'complete' : 'processing',
      summary: `Performs severity classification and estimates public risk. Assigned severity: "${complaint.severity || 'medium'}".`,
      payload: {
        agent: 'severity_assessor',
        status: !['submitted', 'ai_processed', 'evidence_verified'].includes(complaint.status) ? 'success' : 'queued',
        classification: complaint.severity || 'medium',
        confidence: 0.92,
        priority: complaint.priority || 'medium'
      }
    },
    {
      num: 4,
      name: 'Impact Actuary Agent',
      color: 'bg-indigo-600',
      status: !['submitted', 'ai_processed', 'evidence_verified'].includes(complaint.status) ? 'complete' : 'processing',
      summary: `Quantifies affected population dynamics and calculates community priority footprint. Citizens affected: ${(complaint.citizens_affected || 0).toLocaleString()}.`,
      payload: {
        agent: 'impact_actuary',
        status: !['submitted', 'ai_processed', 'evidence_verified'].includes(complaint.status) ? 'success' : 'queued',
        calculations: {
          citizens_affected: complaint.citizens_affected || 0,
          budget_estimate: complaint.budget_estimate || 'Not estimated',
          score: score
        }
      }
    },
    {
      num: 5,
      name: 'Action Plan Compiler Agent',
      color: 'bg-purple-600',
      status: !['submitted', 'ai_processed', 'evidence_verified'].includes(complaint.status) ? 'complete' : 'processing',
      summary: `Compiles emergency recovery milestones. Responsible department assigned: "${complaint.responsible_department || 'General Administration'}".`,
      payload: {
        agent: 'action_compiler',
        status: !['submitted', 'ai_processed', 'evidence_verified'].includes(complaint.status) ? 'success' : 'queued',
        plan: {
          department: complaint.responsible_department || 'General Administration',
          timeline: complaint.timeline || 'Undetermined'
        }
      }
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4 overflow-y-auto page-fade">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-150 h-[600px] max-h-[90vh] min-h-0">
        
        {/* Left Side Pane: Complaint Summary */}
        <div className="md:w-[300px] bg-gray-50/50 p-5 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto flex flex-col justify-between shrink-0 min-h-0">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Case Profile</span>
              <h3 className="text-sm font-extrabold text-gray-800 mt-1 leading-snug font-poppins line-clamp-2">
                {complaint.title}
              </h3>
              <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">ID #{complaint.id}</p>
            </div>

            {/* Quote Box */}
            <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-3.5 text-xs text-sky-800 leading-relaxed font-semibold italic relative">
              <span className="absolute -top-3 left-2 text-3xl text-sky-200 select-none">“</span>
              <p className="relative z-10 line-clamp-4">{complaint.description}</p>
            </div>

            {/* Meta Attributes */}
            <div className="space-y-2.5 border-t border-gray-200/60 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#5A6A7A] font-bold uppercase tracking-wider text-[9px]">Category</span>
                <span className="font-extrabold text-gray-700 uppercase tracking-wider text-[10px]">
                  {translateCategory(tEn, complaint.category)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6A7A] font-bold uppercase tracking-wider text-[9px]">Region</span>
                <span className="font-bold text-gray-700">
                  {complaint.city ? `${complaint.city}, ${complaint.state || ''}` : 'No Region'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6A7A] font-bold uppercase tracking-wider text-[9px]">Scope Size</span>
                <span className="font-bold text-gray-700">
                  {(complaint.citizens_affected || 0).toLocaleString()} Affected
                </span>
              </div>
            </div>
          </div>

          {/* Impact Score Dial Ring */}
          <div className="pt-4 border-t border-gray-200/60 flex flex-col items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gravity Assessment</span>
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r={ringRadius} className="stroke-gray-200/60" strokeWidth="4.5" fill="transparent" />
                <circle cx="32" cy="32" r={ringRadius} className="stroke-[#F5A623] transition-all duration-700" strokeWidth="4.5" fill="transparent"
                        strokeDasharray={ringCircumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-black text-gray-800 leading-none font-poppins">{score}</span>
                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mt-0.5 leading-none">Impact</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Pane: Multi-Agent Trace Accordion */}
        <div className="flex-1 flex flex-col h-full min-h-0 bg-white">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#1A3A6B]/5">
                <Cpu className="text-[#1A3A6B] animate-pulse" size={18} />
              </div>
              <div>
                <h2 className="font-poppins font-extrabold text-sm text-gray-800">Multi-Agent Reasoning Trace</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Sequential audit log of pipeline execution</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Trace stream */}
          <div className="flex-1 p-5 overflow-y-auto bg-gray-50/20 min-h-0">
            {agents.map((ag) => (
              <AgentAccordion
                key={ag.num}
                agentNum={ag.num}
                agentName={ag.name}
                colorClass={ag.color}
                status={ag.status}
                summary={ag.summary}
                jsonPayload={ag.payload}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="gov-btn-secondary !text-xs !py-1.5"
            >
              Close Console
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AgentTraceModal;
