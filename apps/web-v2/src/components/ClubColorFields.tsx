'use client';

import { resolveClubTheme } from '@/lib/api';
import { useEffect } from 'react';

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

  useEffect(() => {
    if (!livePreview) return;
    // Runtime: la UI siempre necesita vars; fallbacks solo acá, no en la preview visual
    const root = document.documentElement;
    root.style.setProperty('--club-primary', resolved.primary);
    root.style.setProperty('--club-secondary', resolved.secondary);
    root.style.setProperty('--club-tertiary', resolved.tertiary);
  }, [livePreview, resolved.primary, resolved.secondary, resolved.tertiary]);

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
            CTAs, nav, acentos
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
                Este club no tiene color secundario. En la UI se reutiliza el
                primario (branding monocromático).
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
                Este club no tiene color terciario. Badges reutilizan el
                primario.
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
          Vista previa — colores del club
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Solo se muestran los colores que configuraste. Si no definís
          secundario/terciario, aparecen como “No se usa”.
        </p>
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
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span
            className="rounded-lg px-3 py-1.5 font-medium text-white"
            style={{ background: primario }}
          >
            Botón primario
          </span>
          {secundario ? (
            <span
              className="rounded-lg px-3 py-1.5 font-medium text-white"
              style={{ background: secundario }}
            >
              Header / contraste
            </span>
          ) : (
            <span className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-slate-400">
              Header: sin color secundario
            </span>
          )}
          {terciario ? (
            <span
              className="rounded-lg px-3 py-1.5 font-medium text-slate-900"
              style={{ background: terciario }}
            >
              Badge highlight
            </span>
          ) : (
            <span className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-slate-400">
              Badge: sin color terciario
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
