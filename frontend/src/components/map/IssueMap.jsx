import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerPopup from './MarkerPopup';

const PRIORITY_COLORS = {
  critical: '#dc2626',
  high:     '#ea580c',
  medium:   '#ca8a04',
  low:      '#16a34a',
  resolved: '#16a34a',
};

const getPriorityColor = (priority, status) => {
  if (status === 'resolved' || status === 'closed') return PRIORITY_COLORS.resolved;
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium;
};

// Recenter map when complaints change
const MapFitter = ({ complaints }) => {
  const map = useMap();
  useEffect(() => {
    if (complaints.length > 0) {
      const lats = complaints.map((c) => c.lat);
      const lngs = complaints.map((c) => c.lng);
      map.fitBounds(
        [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
        { padding: [40, 40], maxZoom: 13 }
      );
    }
  }, [complaints]);
  return null;
};

const IssueMap = ({ complaints = [], height = '100%', fitBounds = false, isAdmin = false }) => {
  const defaultCenter = complaints.length > 0
    ? [complaints[0].lat, complaints[0].lng]
    : [20.5937, 78.9629]; // India center

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden shadow border border-gray-200">
      <MapContainer center={defaultCenter} zoom={complaints.length === 0 ? 5 : 12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        />
        {fitBounds && <MapFitter complaints={complaints} />}
        {complaints.map((issue) => (
          <CircleMarker
            key={issue.id}
            center={[issue.lat, issue.lng]}
            radius={8}
            pathOptions={{
              color: getPriorityColor(issue.priority, issue.status),
              fillColor: getPriorityColor(issue.priority, issue.status),
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup minWidth={200}>
              <MarkerPopup issue={issue} isAdmin={isAdmin} />
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default IssueMap;
