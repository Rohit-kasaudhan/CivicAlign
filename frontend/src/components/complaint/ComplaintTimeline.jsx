import React from 'react';
import { Check } from 'lucide-react';
import { STATUS_FLOW } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

const ComplaintTimeline = ({ currentStatus, statusHistory = [] }) => {
  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === currentStatus);

  // Build a map: status key → timestamp from history
  const timestampMap = {};
  statusHistory.forEach((h) => {
    if (h.new_status) timestampMap[h.new_status] = h.created_at;
  });

  return (
    <ol className="relative border-l border-gray-200 ml-3 space-y-0">
      {STATUS_FLOW.map((step, idx) => {
        const isDone    = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;

        return (
          <li key={step.key} className="mb-0 ml-6 pb-5 last:pb-0">
            {/* Connector dot */}
            <span
              className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white
                ${isDone    ? 'bg-green-500' : ''}
                ${isCurrent ? 'bg-[#1e40af] animate-pulse' : ''}
                ${isPending ? 'bg-gray-200' : ''}
              `}
            >
              {isDone ? (
                <Check size={12} className="text-white" strokeWidth={3} />
              ) : (
                <span className={`text-[10px] font-bold ${isCurrent ? 'text-white' : 'text-gray-400'}`}>
                  {idx + 1}
                </span>
              )}
            </span>

            <div className="pt-0.5">
              <p className={`text-sm font-semibold leading-none ${
                isDone    ? 'text-green-700' :
                isCurrent ? 'text-[#1e40af]' :
                            'text-gray-400'
              }`}>
                {step.label}
              </p>
              {(isDone || isCurrent) && timestampMap[step.key] && (
                <time className="text-xs text-gray-400 mt-0.5 block">
                  {formatDate(timestampMap[step.key])}
                </time>
              )}
              {isPending && (
                <span className="text-xs text-gray-300">Pending</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default ComplaintTimeline;
