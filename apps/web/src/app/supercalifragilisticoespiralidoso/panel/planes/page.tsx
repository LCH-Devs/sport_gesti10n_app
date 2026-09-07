'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Header, Card, Button } from '@/components/common';
import { apiFetch, getPlatformSession } from '@/lib/api';

type Tramo = {
  id?: number;
  nombre: string;
  desde: number;
  hasta: number | null;
  precio_usd: number;
};

const MAX_TRAMOS = 20;

function nombreSugerido(desde: number, hasta: number | null) {
  if (hasta == null) {
    return desde <= 1 ? 'Desde 1 socio' : `Más de ${desde - 1} socios`;
  }
  return `Hasta ${hasta} socios`;
}

function esNombreAuto(nombre: string, desde: number, hasta: number | null) {
  const trimmed = nombre.trim();
  return (
    !trimmed ||
    trimmed === nombreSugerido(desde, hasta) ||
    /^Hasta \d+ socios$/.test(trimmed) ||
    /^Más de \d+ socios$/.test(trimmed) ||
    trimmed === 'Desde 1 socio'
  );
}

export default function PlanesPage() {
  const [tramos, setTramos] = useState<Tramo[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const session = getPlatformSession();
    if (!session) {
      notFound();
      return;
    }
    const rows = await apiFetch<Tramo[]>('/platform/plan-tramos', {
      token: session.access_token,
    });
    setTramos(rows);
  }, []);

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : 'Error al cargar'),
    );
  }, [load]);

  const avisoHueco = useMemo(() => {
    for (let i = 0; i < tramos.length - 1; i++) {
      const actual = tramos[i];
      const siguiente = tramos[i + 1];
      if (actual.hasta == null) {
        return 'Solo el último plan puede ser “en adelante”. Cerrá el tope del anterior.';
      }
      if (siguiente.desde !== actual.hasta + 1) {
        return `Hay un hueco o solape entre ${actual.hasta} y ${siguiente.desde}.`;
      }
    }
    return '';
  }, [tramos]);

  function setRow(i: number, patch: Partial<Tramo>) {
    setTramos((rows) => {
      const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
      const row = next[i];
      if (esNombreAuto(row.nombre, row.desde, row.hasta)) {
        next[i] = {
          ...row,
          nombre: nombreSugerido(row.desde, row.hasta),
        };
      }
      return next;
    });
  }

  function onHastaChange(i: number, raw: string) {
    const hasta = raw === '' ? null : Number(raw);
    setTramos((rows) => {
      const next = rows.map((r, idx) => {
        if (idx !== i) return r;
        const updated = { ...r, hasta };
        return {
          ...updated,
          nombre: esNombreAuto(r.nombre, r.desde, r.hasta)
            ? nombreSugerido(updated.desde, updated.hasta)
            : r.nombre,
        };
      });
      if (hasta != null && i < next.length - 1) {
        const siguiente = next[i + 1];
        const desde = hasta + 1;
        next[i + 1] = {
          ...siguiente,
          desde,
          nombre: esNombreAuto(siguiente.nombre, siguiente.desde, siguiente.hasta)
            ? nombreSugerido(desde, siguiente.hasta)
            : siguiente.nombre,
        };
      }
      return next;
    });
  }

  function agregarTramo() {
    setTramos((rows) => {
      if (rows.length >= MAX_TRAMOS) return rows;
      if (!rows.length) {
        return [
          { nombre: 'Hasta 50 socios', desde: 1, hasta: 50, precio_usd: 15 },
          { nombre: 'Hasta 100 socios', desde: 51, hasta: 100, precio_usd: 30 },
          { nombre: 'Más de 100 socios', desde: 101, hasta: null, precio_usd: 45 },
        ];
      }
      const last = rows[rows.length - 1];
      const cerradoHasta = last.desde + 99;
      const cerrado: Tramo = {
        ...last,
        hasta: cerradoHasta,
        nombre: esNombreAuto(last.nombre, last.desde, last.hasta)
          ? nombreSugerido(last.desde, cerradoHasta)
          : last.nombre,
      };
      const abierto: Tramo = {
        nombre: nombreSugerido(cerradoHasta + 1, null),
        desde: cerradoHasta + 1,
        hasta: null,
        precio_usd: Math.round(last.precio_usd + 15),
      };
      return [...rows.slice(0, -1), cerrado, abierto];
    });
    setOk('');
    setError('');
  }

  function quitarTramo(i: number) {
    setTramos((rows) => {
      if (rows.length <= 1) return rows;
      const next = rows.filter((_, idx) => idx !== i);
      const last = next[next.length - 1];
      next[next.length - 1] = {
        ...last,
        hasta: null,
        nombre: esNombreAuto(last.nombre, last.desde, last.hasta)
          ? nombreSugerido(last.desde, null)
          : last.nombre,
      };
      return next;
    });
    setOk('');
    setError('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const session = getPlatformSession();
    if (!session) return;
    setSaving(true);
    setError('');
    setOk('');
    try {
      const saved = await apiFetch<Tramo[]>('/platform/plan-tramos', {
        method: 'PUT',
        token: session.access_token,
        body: JSON.stringify({
          tramos: tramos.map((t, i) => ({
            nombre: t.nombre,
            desde: Number(t.desde),
            hasta: i === tramos.length - 1 ? null : Number(t.hasta),
            precio_usd: Number(t.precio_usd),
          })),
        }),
      });
      setTramos(saved);
      setOk('Planes guardados. Los clubes que ya existen no cambian de tope hasta un upgrade.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Planes por cantidad de socios"
        subtitle="Cuánto paga el club a ClubApp según cuántos socios tenga. Podés sumar tramos (100–200, 200–300…) cuando hace falta."
      />
      <div className="p-6 space-y-6">
        <Card>
          <p className="text-sm text-slate-600 leading-6 max-w-3xl">
            Cada fila es un tramo. Tienen que ir seguidos, sin huecos: si uno
            termina en 100, el siguiente empieza en 101. El último siempre es
            “en adelante”. Cambiar estos números <strong>no cobra</strong> y no
            mueve a los clubes actuales; solo vale para altas nuevas y para el
            próximo upgrade.
          </p>
        </Card>

        <Card className="overflow-hidden">
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          {ok && <p className="mb-3 text-sm text-green-700">{ok}</p>}
          {avisoHueco && (
            <p className="mb-3 text-sm text-amber-700">{avisoHueco}</p>
          )}

          <form onSubmit={onSubmit}>
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-2 w-10">#</th>
                    <th className="py-3 px-2">Nombre</th>
                    <th className="py-3 px-2 w-28">De</th>
                    <th className="py-3 px-2 w-36">Hasta</th>
                    <th className="py-3 px-2 w-36">USD / mes</th>
                    <th className="py-3 px-2 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {tramos.map((t, i) => {
                    const esUltimo = i === tramos.length - 1;
                    return (
                      <tr key={t.id ?? `nuevo-${i}`} className="border-b border-slate-100 align-middle">
                        <td className="py-3 px-2 text-slate-400">{i + 1}</td>
                        <td className="py-3 px-2">
                          <input
                            className="w-full rounded-lg border px-3 py-2"
                            value={t.nombre}
                            onChange={(e) => setRow(i, { nombre: e.target.value })}
                            required
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            min={1}
                            className="w-full rounded-lg border px-3 py-2 bg-slate-50 text-slate-600"
                            value={t.desde}
                            readOnly
                            title="Se calcula solo: el primero empieza en 1 y el resto sigue al tope anterior"
                          />
                        </td>
                        <td className="py-3 px-2">
                          {esUltimo ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              en adelante
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={t.desde}
                              className="w-full rounded-lg border px-3 py-2"
                              value={t.hasta ?? ''}
                              onChange={(e) => onHastaChange(i, e.target.value)}
                              required
                            />
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">USD</span>
                            <input
                              type="number"
                              min={0}
                              step="1"
                              className="w-full rounded-lg border px-3 py-2"
                              value={t.precio_usd}
                              onChange={(e) =>
                                setRow(i, { precio_usd: Number(e.target.value) })
                              }
                              required
                            />
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {tramos.length > 1 && (
                            <button
                              type="button"
                              title="Quitar este plan"
                              aria-label="Quitar este plan"
                              onClick={() => quitarTramo(i)}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={tramos.length >= MAX_TRAMOS}
                onClick={agregarTramo}
              >
                <span className="inline-flex items-center gap-1">
                  <PlusIcon className="h-4 w-4" />
                  Agregar plan
                </span>
              </Button>
              <Button type="submit" size="md" disabled={saving || Boolean(avisoHueco)}>
                {saving ? 'Guardando…' : 'Guardar planes'}
              </Button>
              <p className="text-xs text-slate-500">
                “Agregar plan” cierra el último tramo en un bloque de 100 socios
                y deja uno nuevo sin techo. Después podés editar el tope.
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
