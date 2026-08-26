'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapContent = dynamic(() => import('./MapContent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-slate-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading map...</p>
      </div>
    </div>
  ),
});

export function MapSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Clubs Worldwide</h2>
        <p className="text-lg text-slate-600">Connect with sports organizations around the globe</p>
      </div>

      <Suspense
        fallback={
          <div className="w-full h-96 bg-slate-100 rounded-lg flex items-center justify-center">
            <p className="text-slate-600">Loading map...</p>
          </div>
        }
      >
        <MapContent />
      </Suspense>
    </section>
  );
}
