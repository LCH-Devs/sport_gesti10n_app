'use client';

import { resolveClubGradient, resolveClubTheme } from '@/lib/api';
import { useEffect, useState } from 'react';

export const SUGGEST_SECONDARY = '#0f172a';
export const SUGGEST_TERTIARY = '#f59e0b';

type Props = {
  primario: string;
  secundario: string | null;
  terciario: string | null;
  onChange: (next: {
    color_primario: string;
    color_secundario: string | null;
    color_terciario: string | null;
  }) => void;
  /** Aplica CSS vars en vivo (admin config) — usa fallbacks solo en runtime */
  livePreview?: boolean;
};

function SwatchDefined({ label, hex }: { label: string; hex: string }) {
  return (
    <div className="flex-1">
      <div
        className="h-10 rounded-lg border-2 border-solid border-slate-300"
        style={{ background: hex }}
      />
      <p className="mt-1 text-xs font-medium text-slate-800">{label}</p>
      <p className="font-mono text-[10px] text-slate-500">{hex}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
        Del club
      </p>
    </div>
  );
}

function SwatchUnused({ label }: { label: string }) {
  return (
    <div className="flex-1">
      <div className="flex h-10 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_6px,#e2e8f0_6px,#e2e8f0_12px)]">
        <span className="rounded bg-white/90 px-1.5 text-[10px] font-semibold uppercase text-slate-500">
          No se usa
        </span>
      </div>
      <p className="mt-1 text-xs font-medium text-slate-800">{label}</p>
      <p className="text-[10px] text-slate-500">Sin color propio</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        No definido
      </p>
    </div>
  );
}

export function ClubColorFields({
  primario,
  secundario,
  terciario,
  onChange,
  livePreview,
}: Props) {
  const resolved = resolveClubTheme({
    color_primario: primario,
    color_secundario: secundario,
    color_terciario: terciario,
  });

  const [prefersDark, setPrefersDark] = useState(false);
  useEffect(() => {
    setPrefersDark(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
  }, []);

  const gradient = resolveClubGradient(
    { color_primario: primario, color_secundario: secundario, color_terciario: terciario },
    prefersDark,
  );
  const gradientInverted = resolveClubGradient(
    { color_primario: primario, color_secundario: secundario, color_terciario: terciario },
    prefersDark,
    true,
  );
  const gradientDescription = terciario
    ? secundario
      ? 'primario → secundario → terciario'
      : 'primario → terciario'
    : secundario
    ? 'primario → secundario'
    : `primario → ${prefersDark ? 'negro (tema oscuro)' : 'blanco (tema claro)'}`;

  useEffect(() => {
    if (!livePreview) return;
    // Runtime: la UI siempre necesita vars; fallbacks solo acá, no en la preview visual
    const root = document.documentElement;
    root.style.setProperty('--club-primary', resolved.primary);
    root.style.setProperty('--club-secondary', resolved.secondary);
    root.style.setProperty('--club-tertiary', resolved.tertiary);
    root.style.setProperty('--club-bg-gradient', gradient);
    root.style.setProperty('--club-bg-gradient-inverted', gradientInverted);
  }, [
    livePreview,
    resolved.primary,
    resolved.secondary,
    resolved.tertiary,
    gradient,
    gradientInverted,
  ]);

  return (
    <div className="sm:col-span-2 space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          Primario <span className="text-red-600">*</span>
          <input
            type="color"
            className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-slate-300 px-1 py-1"
            value={primario}
            onChange={(e) =>
              onChange({
                color_primario: e.target.value,
                color_secundario: secundario,
                color_terciario: terciario,
              })
            }
          />
          <span className="mt-1 block text-xs text-slate-500">
            Inicio del fondo degradado de la app
          </span>
        </label>

        <div className="text-sm">
          <p className="font-medium text-slate-700">Secundario (opcional)</p>
          {secundario ? (
            <>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 flex-1 cursor-pointer rounded-lg border border-slate-300 px-1 py-1"
                  value={secundario}
                  onChange={(e) =>
                    onChange({
                      color_primario: primario,
                      color_secundario: e.target.value,
                      color_terciario: terciario,
                    })
                  }
                />
                <button
                  type="button"
                  className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-2 text-xs font-medium text-amber-900"
                  onClick={() =>
                    onChange({
                      color_primario: primario,
                      color_secundario: null,
                      color_terciario: terciario,
                    })
                  }
                >
                  No usar
                </button>
              </div>
              <p className="mt-1 text-xs text-emerald-700">
                Personalizado: {secundario}
              </p>
            </>
          ) : (
            <div className="mt-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-amber-800">
                Sin definir
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Sin este color, el fondo degradado termina en el terciario (si
                lo definiste) o en blanco/negro según el tema.
              </p>
              <button
                type="button"
                className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                onClick={() =>
                  onChange({
                    color_primario: primario,
                    color_secundario: SUGGEST_SECONDARY,
                    color_terciario: terciario,
                  })
                }
              >
                Definir color
              </button>
            </div>
          )}
        </div>

        <div className="text-sm">
          <p className="font-medium text-slate-700">Terciario (opcional)</p>
          {terciario ? (
            <>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 flex-1 cursor-pointer rounded-lg border border-slate-300 px-1 py-1"
                  value={terciario}
                  onChange={(e) =>
                    onChange({
                      color_primario: primario,
                      color_secundario: secundario,
                      color_terciario: e.target.value,
                    })
                  }
                />
                <button
                  type="button"
                  className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-2 text-xs font-medium text-amber-900"
                  onClick={() =>
                    onChange({
                      color_primario: primario,
                      color_secundario: secundario,
                      color_terciario: null,
                    })
                  }
                >
                  No usar
                </button>
              </div>
              <p className="mt-1 text-xs text-emerald-700">
                Personalizado: {terciario}
              </p>
            </>
          ) : (
            <div className="mt-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-amber-800">
                Sin definir
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Si lo definís, el fondo degradado termina en este color en
                lugar del secundario.
              </p>
              <button
                type="button"
                className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                onClick={() =>
                  onChange({
                    color_primario: primario,
                    color_secundario: secundario,
                    color_terciario: SUGGEST_TERTIARY,
                  })
                }
              >
                Definir color
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">
          Vista previa — fondo de la app
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Estos colores no se usan en botones: definen el fondo degradado de
          toda la app ({gradientDescription}).
        </p>

        <div
          className="mt-3 overflow-hidden rounded-xl border border-slate-300 shadow-sm"
          style={{ background: gradient }}
        >
          <div className="flex items-center gap-2 border-b border-white/20 bg-black/10 px-3 py-2 backdrop-blur-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-white/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/70" />
            <span className="ml-2 text-xs font-medium text-white/90">
              Así se vería la app
            </span>
          </div>
          <div className="space-y-2 p-4">
            <div className="w-2/3 rounded-lg bg-white/90 p-3 shadow-sm">
              <div className="h-2 w-1/3 rounded bg-slate-300" />
              <div className="mt-2 h-2 w-2/3 rounded bg-slate-200" />
            </div>
            <div className="w-1/2 rounded-lg bg-white/70 p-3 shadow-sm">
              <div className="h-2 w-1/2 rounded bg-slate-300" />
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-3">
          <SwatchDefined label="Primario" hex={primario} />
          {secundario ? (
            <SwatchDefined label="Secundario" hex={secundario} />
          ) : (
            <SwatchUnused label="Secundario" />
          )}
          {terciario ? (
            <SwatchDefined label="Terciario" hex={terciario} />
          ) : (
            <SwatchUnused label="Terciario" />
          )}
        </div>
      </div>
    </div>
  );
}
