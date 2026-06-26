import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet marker icon configuration fix for Webpack/Vite compilation
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapEvents = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const defaultPos = initialLocation?.latitude && initialLocation?.longitude
    ? [initialLocation.latitude, initialLocation.longitude]
    : [28.6139, 77.2090]; // Default to New Delhi (or another default)

  const [position, setPosition] = useState(defaultPos);

  const handleSelect = (lat, lng) => {
    setPosition([lat, lng]);
    if (onLocationSelect) {
      onLocationSelect({ latitude: lat, longitude: lng });
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Issue Location
      </label>
      <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          />
          <Marker position={position} />
          <MapEvents onLocationSelect={handleSelect} />
        </MapContainer>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Click on the map to drag or pin the exact coordinate: {position[0].toFixed(5)}, {position[1].toFixed(5)}
      </p>
    </div>
  );
};

export default LocationPicker;
