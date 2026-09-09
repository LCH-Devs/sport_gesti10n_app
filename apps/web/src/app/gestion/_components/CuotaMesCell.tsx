'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/useTranslation';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  MinusCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid';

export type CuotaMesEstado =
  | 'pagado'
  | 'pendiente'
  | 'bonificado'
  | 'sin_generar';

export type EstadoMesItem = {
  socio_id: number;
  grupo_familiar_id: number | null;
  pagador_id: number;
  cuota_estado: CuotaMesEstado;
  cuota_monto: number | null;
};

export function CuotaMesCell({
  item,
  href,
}: {
  item: EstadoMesItem | undefined;
  href: string;
}) {
  const { t } = useTranslation();
  const estado = item?.cuota_estado ?? 'sin_generar';
  const label =
    estado === 'pagado'
      ? t('admin.cobros.cuotaPagada', 'Pagó')
      : estado === 'pendiente'
        ? t('admin.cobros.cuotaDebe', 'Debe')
        : estado === 'bonificado'
          ? t('admin.cobros.cuotaBonificada', 'Bonificado')
          : t('admin.cobros.cuotaSinGenerar', 'Sin generar');

  const icon =
    estado === 'pagado' ? (
      <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
    ) : estado === 'pendiente' ? (
      <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
    ) : estado === 'bonificado' ? (
      <MinusCircleIcon className="h-5 w-5 text-slate-400" />
    ) : (
      <QuestionMarkCircleIcon className="h-5 w-5 text-slate-300" />
    );

  return (
    <Link
      href={href}
      className="inline-flex rounded p-0.5 hover:bg-slate-100"
      title={`${label} · ${t('admin.cobros.verCuenta', 'Ver estado de cuenta')}`}
      aria-label={`${label}. ${t('admin.cobros.verCuenta', 'Ver estado de cuenta')}`}
    >
      {icon}
    </Link>
  );
}
