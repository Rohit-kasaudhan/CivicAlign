import React from 'react';
import { Link } from 'react-router-dom';

const PRIORITY_PILL = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-yellow-100 text-yellow-700',
  low:      'bg-green-100 text-green-700',
};

const MarkerPopup = ({ issue, isAdmin = false }) => (
  <div className="text-sm w-48">
    <p className="font-semibold text-gray-800 leading-tight mb-1">{issue.title}</p>
    <div className="flex flex-wrap gap-1 mb-2">
      <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{issue.category}</span>
      {issue.priority && (
        <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${PRIORITY_PILL[issue.priority] || PRIORITY_PILL.medium}`}>
          {issue.priority}
        </span>
      )}
    </div>
    <p className="text-xs text-gray-500 mb-2">
      Status: <span className="font-medium text-gray-700 capitalize">{issue.status?.replace(/_/g, ' ')}</span>
    </p>
    <Link
      to={isAdmin ? `/admin/complaints/${issue.id}` : `/complaints/${issue.id}`}
      className="text-xs text-[#1e40af] font-semibold hover:underline"
    >
      View details →
    </Link>
  </div>
);

export default MarkerPopup;
