import React, { useEffect, useRef } from 'react';
import { Intersection } from '../../types/index.js';
import L from 'leaflet';

interface IntersectionMapViewProps {
  intersections: Intersection[];
  onSelectIntersection?: (intersection: Intersection) => void;
  className?: string;
}

export const IntersectionMapView: React.FC<IntersectionMapViewProps> = ({
  intersections,
  onSelectIntersection,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to Hosanna coordinates (8.0200, 37.8500)
      const map = L.map(mapContainerRef.current).setView([8.018, 37.853], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for intersections
    intersections.forEach((item) => {
      const isOnline = item.controller?.connectionStatus === 'ONLINE';
      const isEmergency = item.liveStatus?.isEmergencyActive;

      const markerColor = isEmergency ? '#ef4444' : isOnline ? '#10b981' : '#64748b';

      const customIcon = L.divIcon({
        className: 'custom-traffic-pin',
        html: `
          <div style="background-color: ${markerColor}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            🚦
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([Number(item.latitude), Number(item.longitude)], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="font-size: 13px;">${item.name}</strong><br/>
          <span style="color: #64748b;">Code: ${item.code}</span><br/>
          <span>Controller: <strong>${item.controller?.deviceId || 'None'}</strong></span><br/>
          <span>Status: <strong style="color: ${isOnline ? '#10b981' : '#ef4444'}">${item.controller?.connectionStatus || 'OFFLINE'}</strong></span>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectIntersection) {
          onSelectIntersection(item);
        }
      });
    });

    return () => {
      // Don't necessarily destroy on every small re-render
    };
  }, [intersections, onSelectIntersection]);

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-200 shadow-sm relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-80 z-0" />
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-sm z-[1000] flex items-center space-x-3">
        <span className="flex items-center text-slate-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5 inline-block" /> Online
        </span>
        <span className="flex items-center text-slate-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-1.5 inline-block" /> Offline
        </span>
        <span className="flex items-center text-slate-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5 inline-block" /> Emergency
        </span>
      </div>
    </div>
  );
};
