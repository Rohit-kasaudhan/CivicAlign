import React from 'react';

const HeatmapCard = ({ locations }) => {
  const defaultHotspots = locations || [
    { name: 'Central Sector', count: 45, intensity: 'High', color: 'bg-red-500' },
    { name: 'North Boulevard', count: 28, intensity: 'Medium', color: 'bg-amber-500' },
    { name: 'East Commercial Hub', count: 19, intensity: 'Medium', color: 'bg-amber-400' },
    { name: 'South Suburban Hills', count: 8, intensity: 'Low', color: 'bg-green-500' }
  ];

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
      <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>📍</span> Location Hotspots (Report Density)
      </h3>
      <div className="space-y-4">
        {defaultHotspots.map((spot, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-gray-700">{spot.name}</span>
                <span className="text-gray-500">{spot.count} complaints</span>
              </div>
              <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${spot.color}`}
                  style={{ width: `${(spot.count / 50) * 100}%` }}
                />
              </div>
            </div>
            <span className="ml-4 text-xs font-bold text-gray-500 w-12 text-right">
              {spot.intensity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeatmapCard;
