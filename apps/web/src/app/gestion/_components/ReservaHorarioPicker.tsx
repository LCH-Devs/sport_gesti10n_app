'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useDateTimeFormat } from '@/lib/DateTimeFormatContext';
import { interpolate, useTranslation } from '@/lib/useTranslation';
import {
  endSlotTimes,
  formatDurationMins,
  nowHm,
  parseHm,
  slotMinutes,
  snapToStartSlot,
  startSlotTimes,
  todayYmd,
  toHm,
  unionStartTimes,
  usableWindowMins,
} from '@/lib/reserva-slots';

export type ReservaEspacioHorario = {
  hora_apertura: string;
  hora_cierre: string;
  duracion_slot_min: number;
};

export function ReservaHorarioPicker({
  espacio,
  fecha,
  horaInicio,
  horaFin,
  ocupados,
  extraInicios,
  onChange,
}: {
  espacio: ReservaEspacioHorario | undefined;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  ocupados?: ReadonlySet<string>;
  extraInicios?: readonly string[];
  onChange: (next: { hora_inicio: string; hora_fin: string }) => void;
}) {
  const { t } = useTranslation();
  const { formatHm } = useDateTimeFormat();
  const slot = slotMinutes(espacio?.duracion_slot_min);
  const inicios = useMemo(
    () =>
      espacio
        ? unionStartTimes(
            startSlotTimes(espacio.hora_apertura, espacio.hora_cierre, slot),
            extraInicios,
          )
        : [],
    [espacio, slot, extraInicios],
  );
  const fines = useMemo(
    () =>
      espacio && horaInicio
        ? endSlotTimes(horaInicio, espacio.hora_apertura, espacio.hora_cierre, slot)
        : [],
    [espacio, horaInicio, slot],
  );
  const win = espacio
    ? usableWindowMins(espacio.hora_apertura, espacio.hora_cierre)
    : null;
  const minInicio = fecha === todayYmd() ? nowHm() : null;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function rangeOcupado(startHm: string, endHm: string): boolean {
    if (!ocupados || ocupados.size === 0) return false;
    for (let t = parseHm(startHm); t < parseHm(endHm); t += slot) {
      if (ocupados.has(toHm(t))) return true;
    }
    return false;
  }

  useEffect(() => {
    if (!espacio || inicios.length === 0) return;
    const nextInicio = horaInicio ? snapToStartSlot(horaInicio, inicios) : '';
    const nextFines = nextInicio
      ? endSlotTimes(nextInicio, espacio.hora_apertura, espacio.hora_cierre, slot)
      : [];
    const nextFin = nextFines.includes(horaFin) ? horaFin : (nextFines[0] ?? '');
    if (nextInicio !== horaInicio || nextFin !== horaFin) {
      onChangeRef.current({ hora_inicio: nextInicio, hora_fin: nextFin });
    }
  }, [espacio, inicios, horaInicio, horaFin, slot]);

  if (!espacio || !win) {
    return (
      <p className="sm:col-span-2 text-sm text-slate-500">
        {t('admin.reservas.elegirEspacioHorario')}
      </p>
    );
  }

  function chipClass(active: boolean, disabled: boolean) {
    if (disabled) {
      return 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 line-through';
    }
    if (active) {
      return 'border-[var(--primary,#003ec7)] bg-[var(--primary,#003ec7)] text-white shadow-sm';
    }
    return 'border-slate-200 bg-white text-slate-700 hover:border-[var(--primary,#003ec7)] hover:bg-slate-50';
  }

  return (
    <div className="sm:col-span-2 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-2 text-sm text-slate-600">
        <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
        <p>
          {interpolate(t('admin.reservas.turnoHint'), {
            slot: formatDurationMins(slot),
            desde: formatHm(toHm(win.start)),
            hasta: formatHm(toHm(win.end)),
            cierre: formatHm(espacio.hora_cierre),
          })}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-800">{t('admin.reservas.inicio')}</p>
        <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
          {inicios.map((hm) => {
            const pasado = Boolean(minInicio && hm < minInicio);
            const ocupado = ocupados?.has(hm) ?? false;
            const disabled = pasado || ocupado;
            return (
              <button
                key={hm}
                type="button"
                disabled={disabled}
                onClick={() => {
                  const nextFines = endSlotTimes(
                    hm,
                    espacio.hora_apertura,
                    espacio.hora_cierre,
                    slot,
                  );
                  onChange({
                    hora_inicio: hm,
                    hora_fin: nextFines.includes(horaFin) ? horaFin : (nextFines[0] ?? ''),
                  });
                }}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${chipClass(
                  horaInicio === hm,
                  disabled,
                )}`}
                title={
                  ocupado
                    ? t('admin.reservas.turnoOcupado')
                    : pasado
                      ? t('admin.reservas.fechaPasada')
                      : formatHm(hm)
                }
              >
                {formatHm(hm)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-800">{t('admin.reservas.fin')}</p>
        {horaInicio ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {fines.map((hm) => {
              const mins = parseHm(hm) - parseHm(horaInicio);
              const disabled = rangeOcupado(horaInicio, hm);
              return (
                <button
                  key={hm}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ hora_inicio: horaInicio, hora_fin: hm })}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${chipClass(
                    horaFin === hm,
                    disabled,
                  )}`}
                  title={disabled ? t('admin.reservas.turnoOcupado') : formatHm(hm)}
                >
                  {formatHm(hm)}
                  <span className={horaFin === hm ? 'ml-1 opacity-80' : 'ml-1 text-slate-500'}>
                    · {formatDurationMins(mins)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">{t('admin.reservas.elegirInicioPrimero')}</p>
        )}
      </div>
    </div>
  );
}
