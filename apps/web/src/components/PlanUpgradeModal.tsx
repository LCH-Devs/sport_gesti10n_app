'use client';

import { Button } from '@/components/common';
import type { PlanUpgradeBody } from '@/lib/api';

export function PlanUpgradeModal({
  data,
  onCancel,
  onAccept,
  busy,
}: {
  data: PlanUpgradeBody;
  onCancel: () => void;
  onAccept: () => void;
  busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">
          Este alta supera el plan actual
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Hoy el club está en <strong>{data.plan_nombre}</strong> (
          {data.socios_actuales}/{data.plan_hasta} socios, USD {data.precio_actual}
          /mes).
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Este mes <strong>no cambia el precio</strong>. Si seguís, el próximo
          ciclo ({data.aplica_desde}) pasaría a{' '}
          <strong>{data.plan_proximo_nombre}</strong> (USD {data.precio_proximo}
          /mes).
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Vas a recibir un mail para confirmar el cambio. Si no lo confirman,
          ClubApp lo ve como pendiente y el precio se mantiene.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="md" onClick={onAccept} disabled={busy}>
            {busy ? 'Guardando…' : 'Sí, entiendo y quiero continuar'}
          </Button>
          <Button variant="secondary" size="md" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
