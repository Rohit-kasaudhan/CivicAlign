import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { translatePriority } from '../../utils/i18n';
import AgentTraceModal from './AgentTraceModal';

const ScoreBar = ({ label, value, color = 'bg-[#1e40af]' }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-700">{Math.round(value)}/100</span>
    </div>
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  </div>
);

const ActionList = ({ title, items, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  if (!items?.length) return null;
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 text-sm font-semibold text-gray-700 hover:bg-gray-100"
      >
        {title}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <ul className="px-4 py-2 space-y-1.5">
          {items.map((action, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-[#1e40af] mt-0.5">•</span>
              {action}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const PRIORITY_COLORS = {
  low:      'bg-blue-100 text-blue-700 border border-blue-200',
  medium:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
  high:     'bg-orange-100 text-orange-700 border border-orange-200',
  critical: 'bg-red-100 text-red-700 border border-red-200',
};

const AIInsightsPanel = ({ complaint }) => {
  const { t } = useLanguage();
  const [isTraceOpen, setIsTraceOpen] = useState(false);

  if (!complaint?.ai_summary) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🤖</span>
          <span className="text-sm font-semibold text-slate-500">{t('ai_analyzing')}</span>
        </div>
        <div className="space-y-3">
          {[80, 60, 90, 50].map((w, i) => (
            <div key={i} className={`h-3 bg-slate-200 rounded`} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  let immediateActions = [], shortTermActions = [], longTermActions = [];
  try { immediateActions  = JSON.parse(complaint.immediate_actions  || '[]'); } catch {}
  try { shortTermActions  = JSON.parse(complaint.short_term_actions || '[]'); } catch {}
  try { longTermActions   = JSON.parse(complaint.long_term_actions  || '[]'); } catch {}

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="font-extrabold text-slate-800 flex items-center gap-2 font-poppins text-sm uppercase tracking-wider">
          🤖 {t('ai_analysis')}
        </h3>
        <button
          onClick={() => setIsTraceOpen(true)}
          className="text-xs font-bold text-[#1A3A6B] hover:underline flex items-center gap-1 border border-[#1A3A6B]/25 px-2.5 py-1.5 rounded-lg bg-[#1A3A6B]/5 hover:bg-[#1A3A6B]/10 transition-colors"
        >
          View Reasoning Trace →
        </button>
      </div>

      {/* Scores */}
      <div className="space-y-3">
        <ScoreBar label={t('evidence_score')}  value={complaint.evidence_score || 0} color="bg-green-500" />
        <ScoreBar label={t('impact_score')}    value={complaint.impact_score   || 0} color="bg-orange-500" />
        <ScoreBar label={t('trust_score')}     value={complaint.trust_score    || 0} color="bg-[#1e40af]" />
      </div>

      {/* Key meta */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {complaint.priority && (
          <div className="bg-white rounded-lg p-3 border border-slate-100">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{t('priority')}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${PRIORITY_COLORS[complaint.priority] || PRIORITY_COLORS.medium}`}>
              {translatePriority(t, complaint.priority)}
            </span>
          </div>
        )}
        {complaint.citizens_affected > 0 && (
          <div className="bg-white rounded-lg p-3 border border-slate-100">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{t('citizens_affected')}</p>
            <p className="text-sm font-bold text-gray-800">{complaint.citizens_affected.toLocaleString()}</p>
          </div>
        )}
        {complaint.severity && (
          <div className="bg-white rounded-lg p-3 border border-slate-100">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{t('severity')}</p>
            <p className="text-sm font-bold text-gray-800 capitalize">{translatePriority(t, complaint.severity)}</p>
          </div>
        )}
        {complaint.budget_estimate && (
          <div className="bg-white rounded-lg p-3 border border-slate-100">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{t('est_budget')}</p>
            <p className="text-sm font-bold text-gray-800">{complaint.budget_estimate}</p>
          </div>
        )}
        {complaint.timeline && (
          <div className="bg-white rounded-lg p-3 border border-slate-100">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{t('timeline')}</p>
            <p className="text-sm font-bold text-gray-800">{complaint.timeline}</p>
          </div>
        )}
        {complaint.responsible_department && (
          <div className="bg-white rounded-lg p-3 border border-slate-100">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{t('department')}</p>
            <p className="text-sm font-bold text-gray-800">{complaint.responsible_department}</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {complaint.ai_summary && (
        <div className="bg-white rounded-lg p-4 border border-slate-100">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{t('ai_summary')}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{complaint.ai_summary}</p>
        </div>
      )}

      {/* Formal description */}
      {complaint.ai_formal_description && (
        <div className="bg-white rounded-lg p-4 border border-slate-100">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{t('formal_description')}</p>
          <p className="text-sm text-gray-600 italic leading-relaxed">{complaint.ai_formal_description}</p>
        </div>
      )}

      {/* Action plans */}
      <div className="space-y-2">
        <ActionList title={`⚡ ${t('immediate_actions')}`} items={immediateActions} defaultOpen={true} />
        <ActionList title={`📋 ${t('short_term_actions')}`} items={shortTermActions} />
        <ActionList title={`🏗️ ${t('long_term_actions')}`}  items={longTermActions} />
      </div>

      <AgentTraceModal
        complaint={complaint}
        isOpen={isTraceOpen}
        onClose={() => setIsTraceOpen(false)}
      />
    </div>
  );
};

export default AIInsightsPanel;
