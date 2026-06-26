import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { formatDate } from '../../utils/helpers';

const ComplaintCard = ({ complaint }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-150 p-5 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
          {complaint.category}
        </span>
        <StatusBadge status={complaint.status} />
      </div>
      
      <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">
        {complaint.title}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {complaint.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
        <span>Reported on {formatDate(complaint.created_at)}</span>
        <Link
          to={`/complaints/${complaint.id}`}
          className="text-civic-blue font-bold hover:underline"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
};

export default ComplaintCard;
