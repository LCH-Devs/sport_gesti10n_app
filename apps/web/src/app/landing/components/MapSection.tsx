"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useTranslation } from "@/lib/useTranslation";

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapContent = dynamic(() => import("./MapContent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-slate-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Cargando mapa...</p>
      </div>
    </div>
  ),
});

export function MapSection() {
  const { t } = useTranslation();
  return (
    <section className="max-w-7xl mx-auto px-6 py-8 border-t border-slate-200">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">
          {t("landing.clubsWorldwide")}
        </h2>
        <p className="text-lg text-slate-600">{t("landing.connectClubs")}</p>
      </div>

      <Suspense
        fallback={
          <div className="w-full h-96 bg-slate-100 rounded-lg flex items-center justify-center">
            <p className="text-slate-600">Cargando mapa...</p>
          </div>
        }
      >
        <MapContent />
      </Suspense>
    </section>
  );
}
