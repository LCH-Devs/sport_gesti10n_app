"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, mediaUrl } from "@/lib/api";

type LandingClub = {
  id: number;
  slug: string;
  nombre: string;
  logo_url: string | null;
  color_primario: string | null;
};

export function HeroSection() {
  const [clubs, setClubs] = useState<LandingClub[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadClubs() {
      try {
        const data = await apiFetch<LandingClub[]>("/clubs/buscar");
        if (!cancelled) {
          setClubs(data);
        }
      } catch {
        if (!cancelled) {
          setClubs([]);
        }
      }
    }

    void loadClubs();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 py-20 md:py-32">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_380px] lg:items-start">
        <div className="text-center lg:text-left">
          <h1 className="mb-6 text-5xl font-bold leading-tight text-slate-900 md:text-6xl">
            Manage Your Sports Clubs Like a Pro
          </h1>
          <p className="mb-8 max-w-3xl text-xl text-slate-600 md:text-2xl lg:mx-0 mx-auto">
            Streamline team management, track events, manage members, and grow your sports organization efficiently.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
            <button className="rounded-md bg-blue-600 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700">
              Start Free Trial
            </button>
            <button className="rounded-md border-2 border-slate-300 bg-white px-8 py-3 text-lg font-medium text-slate-900 transition-colors hover:bg-slate-50">
              Watch Demo
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 py-2 px-4">
          <div>
            {clubs.map((club) => {
              const accentColor = club.color_primario || "#2563eb";

              return (
                <Link
                  key={club.id}
                  href="/login"
                  className="group flex items-center mb-3 gap-4 rounded-2xl transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md"
                >
                  <div
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full"
                    style={{ boxShadow: `0 0 0 4px ${accentColor}12` }}
                  >
                    {club.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(club.logo_url)}
                        alt={club.nombre}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span
                        className="text-xl font-bold"
                        style={{ color: accentColor }}
                      >
                        {club.nombre.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">
                      {club.nombre}
                    </p>
                  </div>
                </Link>
              );
            })}

            {clubs.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Todavia no hay clubes para mostrar.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 pt-20 border-t border-slate-200">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
          <p className="text-slate-600">Sports Organizations</p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
          <p className="text-slate-600">Active Members</p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">1M+</div>
          <p className="text-slate-600">Events Managed</p>
        </div>
      </div>
    </section>
  );
}
