import React from 'react';

const Badge = ({ name, description, iconName = 'Award' }) => {
  return (
    <div className="flex items-center p-3 bg-white shadow rounded-lg border border-gray-100">
      <div className="p-3 bg-blue-50 text-civic-blue rounded-full mr-4">
        {/* Simple mock badge icon */}
        <span className="text-xl">🏆</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{name}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
};

export default Badge;
