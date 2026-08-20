'use client';

import React, { useEffect, useState } from 'react';
import L from 'leaflet';

// Mock club data - in production this would come from an API
const mockClubs = [
  { id: 1, name: 'Metro City FC', lat: 40.7128, lng: -74.006, country: 'USA' },
  { id: 2, name: 'European United', lat: 48.8566, lng: 2.3522, country: 'France' },
  { id: 3, name: 'Pacific Athletic', lat: 35.6762, lng: 139.6503, country: 'Japan' },
  { id: 4, name: 'South American Stars', lat: -23.5505, lng: -46.6333, country: 'Brazil' },
  { id: 5, name: 'Australian Legends', lat: -33.8688, lng: 151.2093, country: 'Australia' },
];

export default function MapContent() {
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer) return;

    // Initialize the map
    const leafletMap = L.map(mapContainer).setView([20, 0], 2);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(leafletMap);

    // Add markers for each club
    mockClubs.forEach((club) => {
      const marker = L.marker([club.lat, club.lng]);
      marker.bindPopup(`
        <div class="p-3">
          <h3 class="font-bold text-slate-900">${club.name}</h3>
          <p class="text-sm text-slate-600">${club.country}</p>
          <button class="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            View Club
          </button>
        </div>
      `);
      marker.addTo(leafletMap);
    });

    setMap(leafletMap);

    // Cleanup
    return () => {
      leafletMap.remove();
    };
  }, [mapContainer]);

  return (
    <div
      ref={setMapContainer}
      className="w-full h-96 rounded-lg border border-slate-200 overflow-hidden shadow-sm"
      style={{ zIndex: 0 }}
    />
  );
}
