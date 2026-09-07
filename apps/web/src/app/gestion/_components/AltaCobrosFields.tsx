'use client';

export type AltaCobrosValue = {
  inscripcion: boolean;
  inscripcion_monto: string;
  inscripcion_cuotas: string;
  bonificar: boolean;
  bonificar_meses: string[];
};

export const EMPTY_ALTA_COBROS: AltaCobrosValue = {
  inscripcion: false,
  inscripcion_monto: '',
  inscripcion_cuotas: '1',
  bonificar: false,
  bonificar_meses: [],
};

export function mesesProximos(cantidad = 12): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < cantidad; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() + i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

export function altaCobrosPayload(value: AltaCobrosValue) {
  return {
    ...(value.inscripcion
      ? {
          inscripcion: true,
          ...(value.inscripcion_monto
            ? {
                inscripcion_monto: Number(value.inscripcion_monto),
                inscripcion_cuotas: Number(value.inscripcion_cuotas || '1'),
              }
            : {}),
        }
      : {}),
    ...(value.bonificar && value.bonificar_meses.length
      ? { bonificar_meses: value.bonificar_meses }
      : {}),
  };
}

export function AltaCobrosFields({
  value,
  onChange,
  hint,
  t,
}: {
  value: AltaCobrosValue;
  onChange: (next: AltaCobrosValue) => void;
  hint?: string;
  t: (key: string, fallback?: string) => string;
}) {
  const meses = mesesProximos(12);

  return (
    <div className="col-span-2 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <h3 className="font-semibold">
          {t('admin.cobros.altaTitle', 'Cuota e inscripción (opcional)')}
        </h3>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={value.inscripcion}
          onChange={(e) =>
            onChange({ ...value, inscripcion: e.target.checked })
          }
        />
        <span>
          <span className="font-medium">
            {t('admin.cobros.inscripcionCheck', 'Cobrar inscripción')}
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            {t(
              'admin.cobros.inscripcionHint',
              'Si no pones importe, el alta queda sin esa deuda. Podés partirlo en hasta 12 cuotas.',
            )}
          </span>
        </span>
      </label>

      {value.inscripcion && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            {t('admin.cobros.inscripcionMonto', 'Importe de inscripción')}
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={value.inscripcion_monto}
              onChange={(e) =>
                onChange({ ...value, inscripcion_monto: e.target.value })
              }
              placeholder={t('admin.cobros.inscripcionMontoPh', 'Vacío = sin deuda')}
            />
          </label>
          <label className="text-sm">
            {t('admin.cobros.inscripcionCuotas', 'Cuotas (1–12)')}
            <input
              type="number"
              min={1}
              max={12}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={value.inscripcion_cuotas}
              onChange={(e) =>
                onChange({ ...value, inscripcion_cuotas: e.target.value })
              }
            />
          </label>
        </div>
      )}

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={value.bonificar}
          onChange={(e) =>
            onChange({
              ...value,
              bonificar: e.target.checked,
              bonificar_meses: e.target.checked ? value.bonificar_meses : [],
            })
          }
        />
        <span>
          <span className="font-medium">
            {t('admin.cobros.bonificarCheck', 'Bonificar cuota mensual')}
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            {t(
              'admin.cobros.bonificarHint',
              'Esos meses no generan cuota (ni entran en el cobro familiar).',
            )}
          </span>
        </span>
      </label>

      {value.bonificar && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {meses.map((mes) => (
            <label key={mes} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.bonificar_meses.includes(mes)}
                onChange={(e) =>
                  onChange({
                    ...value,
                    bonificar_meses: e.target.checked
                      ? [...value.bonificar_meses, mes]
                      : value.bonificar_meses.filter((m) => m !== mes),
                  })
                }
              />
              {mes}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
