'use client';

import { useState } from 'react';
import {
  DEPORTES_CATALOGO,
  matchCatalogoDeporte,
} from '@/lib/deportes-catalogo';

type Props = {
  seleccionados: string[];
  extras: string[];
  onToggle: (deporte: string) => void;
  onAddExtra: (deporte: string) => void;
  onRemoveExtra: (deporte: string) => void;
  hint?: string;
};

export function DeportesPicker({
  seleccionados,
  extras,
  onToggle,
  onAddExtra,
  onRemoveExtra,
  hint,
}: Props) {
  const [draft, setDraft] = useState('');

  function addDraft() {
    const name = draft.trim();
    if (!name) return;
    const catalogo = matchCatalogoDeporte(name);
    if (catalogo) {
      if (!seleccionados.includes(catalogo)) onToggle(catalogo);
    } else {
      onAddExtra(name);
    }
    setDraft('');
  }

  return (
    <div>
      <p className="text-sm font-medium">Deportes del club o institución</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {DEPORTES_CATALOGO.map((deporte) => (
          <label key={deporte} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={seleccionados.includes(deporte)}
              onChange={() => onToggle(deporte)}
            />
            {deporte}
          </label>
        ))}
      </div>

      <div className="mt-3">
        <p className="text-sm">Otro deporte</p>
        <div className="mt-1 flex flex-wrap gap-2">
          <input
            className="min-w-[12rem] flex-1 rounded-lg border px-3 py-2 text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addDraft();
              }
            }}
            placeholder="Ej: Pilates"
          />
          <button
            type="button"
            onClick={addDraft}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
          >
            Agregar
          </button>
        </div>
        {extras.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {extras.map((deporte) => (
              <li
                key={deporte}
                className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm"
              >
                {deporte}
                <button
                  type="button"
                  onClick={() => onRemoveExtra(deporte)}
                  className="text-xs text-red-600"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
