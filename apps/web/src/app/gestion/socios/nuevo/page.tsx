'use client';

import { apiFetch, isPlanUpgradeRequired, requireSession, type PlanUpgradeBody } from '@/lib/api';
import { PlanUpgradeModal } from '@/components/PlanUpgradeModal';
import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';
import {
  DNI_PATTERN,
  NAME_HELP,
  NAME_PATTERN,
  PHONE_PATTERN,
  filterDigits,
  filterPersonName,
  filterPhone,
} from '@/lib/validation';
import {
  AltaCobrosFields,
  altaCobrosPayload,
  EMPTY_ALTA_COBROS,
  type AltaCobrosValue,
} from '../../_components/AltaCobrosFields';

type Socio = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: string;
  es_socio: boolean;
  estado: string;
  fecha_nacimiento: string | null;
  categoria_id: number | null;
};

type CategoriaCuota = {
  id: number;
  nombre: string;
  monto: number;
  es_default: boolean;
};

const EMPTY_FORM = {
  dni: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  fecha_nacimiento: '',
  rol: '',
  es_socio: true,
  estado: 'activo',
  password: '',
  categoria_id: '',
};

function NuevoSocioForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(editingId));
  const [categorias, setCategorias] = useState<CategoriaCuota[]>([]);
  const [upgrade, setUpgrade] = useState<PlanUpgradeBody | null>(null);
  const [saving, setSaving] = useState(false);
  const [altaCobros, setAltaCobros] = useState<AltaCobrosValue>(EMPTY_ALTA_COBROS);
  const [nameErrors, setNameErrors] = useState({ nombre: '', apellido: '' });

  useEffect(() => {
    const session = requireSession();
    if (!session) return;
    apiFetch<CategoriaCuota[]>('/categorias-cuota', {
      token: session.access_token,
      clubSlug: session.club.slug,
    })
      .then((rows) => {
        setCategorias(rows);
        if (!editingId) {
          const def = rows.find((c) => c.es_default) ?? rows[0];
          if (def) {
            setForm((f) => ({ ...f, categoria_id: String(def.id) }));
          }
        }
      })
      .catch(() => undefined);
  }, [editingId]);

  useEffect(() => {
    if (!editingId) return;
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    apiFetch<Socio>(`/socios/${editingId}`, {
      token: session.access_token,
      clubSlug: session.club.slug,
    })
      .then((socio) =>
        setForm({
          dni: socio.dni,
          nombre: socio.nombre,
          apellido: socio.apellido,
          email: socio.email,
          telefono: socio.telefono,
          fecha_nacimiento: socio.fecha_nacimiento
            ? socio.fecha_nacimiento.slice(0, 10)
            : '',
          rol: socio.rol,
          es_socio: socio.rol === 'socio' ? true : socio.es_socio,
          estado: socio.estado,
          password: '',
          categoria_id: socio.categoria_id ? String(socio.categoria_id) : '',
        }),
      )
      .catch((err) => setError(err instanceof Error ? err.message : t('messages.errorLoading')))
      .finally(() => setLoading(false));
  }, [editingId]);

  async function saveSocio(aceptaUpgrade = false) {
    const session = requireSession();
    if (!session) return;
    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/socios/${editingId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify({
            nombre: form.nombre,
            apellido: form.apellido,
            email: form.email,
            telefono: form.telefono || undefined,
            fecha_nacimiento: form.fecha_nacimiento,
            rol: form.rol,
            es_socio: form.rol === 'socio' ? true : form.es_socio,
            estado: form.estado,
            categoria_id: form.categoria_id ? Number(form.categoria_id) : undefined,
          }),
        });
      } else {
        await apiFetch('/socios', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify({
            dni: form.dni,
            nombre: form.nombre,
            apellido: form.apellido,
            email: form.email,
            telefono: form.telefono || undefined,
            fecha_nacimiento: form.fecha_nacimiento,
            rol: form.rol,
            es_socio: form.rol === 'socio' ? true : form.es_socio,
            password: form.password || undefined,
            categoria_id: form.categoria_id ? Number(form.categoria_id) : undefined,
            ...altaCobrosPayload(altaCobros),
            ...(aceptaUpgrade ? { acepta_upgrade: true } : {}),
          }),
        });
      }
      router.push('/gestion/socios');
    } catch (err) {
      if (isPlanUpgradeRequired(err)) {
        setUpgrade(err.body as unknown as PlanUpgradeBody);
        return;
      }
      setError(err instanceof Error ? err.message : t('messages.errorSaving'));
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    await saveSocio(false);
  }

  return (
    <div>
      {loading ? (
        <>
          <h2 className="text-2xl font-bold">
            {editingId ? t('admin.socios.editSocio', 'Editar socio') : t('admin.socios.quickCreate')}
          </h2>
          <p className="mt-6 text-sm text-slate-500">{t('common.loading', 'Cargando...')}</p>
        </>
      ) : (
        <form
          onSubmit={onSubmit}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="col-span-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">
              {editingId ? t('admin.socios.editSocio', 'Editar socio') : t('admin.socios.quickCreate')}
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-lg bg-[var(--primary,#003ec7)] px-4 py-2 font-semibold text-white"
              >
                {editingId
                  ? t('common.save', 'Guardar')
                  : form.rol === 'profe'
                    ? t('admin.socios.createProfe')
                    : t('admin.socios.createSocio')}
              </button>
              <button
                type="button"
                onClick={() => router.push('/gestion/socios')}
                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
              >
                {t('newClub.cancel', 'Cancelar')}
              </button>
            </div>
          </div>

          {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}

          <div className="col-span-2 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <FormField
            label={t('admin.socios.dni')}
            value={form.dni}
            onChange={(dni) => setForm((f) => ({ ...f, dni: filterDigits(dni) }))}
            required
            disabled={Boolean(editingId)}
            inputMode="numeric"
            pattern={DNI_PATTERN}
            maxLength={10}
            title="Solo números"
          />
          <FormField
            label={t('admin.socios.nombre')}
            value={form.nombre}
            onChange={(value) => {
              const nombre = filterPersonName(value);
              setForm((f) => ({ ...f, nombre }));
              setNameErrors((n) => ({ ...n, nombre: value !== nombre ? NAME_HELP : '' }));
            }}
            required
            pattern={NAME_PATTERN}
            title={NAME_HELP}
            error={nameErrors.nombre}
          />
          <FormField
            label={t('admin.socios.apellido')}
            value={form.apellido}
            onChange={(value) => {
              const apellido = filterPersonName(value);
              setForm((f) => ({ ...f, apellido }));
              setNameErrors((n) => ({ ...n, apellido: value !== apellido ? NAME_HELP : '' }));
            }}
            required
            pattern={NAME_PATTERN}
            title={NAME_HELP}
            error={nameErrors.apellido}
          />
          <FormField
            type="email"
            label={t('admin.socios.email')}
            value={form.email}
            onChange={(email) => setForm((f) => ({ ...f, email }))}
            required
          />
          <FormField
            type="tel"
            label={t('admin.socios.telefono')}
            value={form.telefono}
            onChange={(telefono) => setForm((f) => ({ ...f, telefono: filterPhone(telefono) }))}
            inputMode="tel"
            pattern={PHONE_PATTERN}
            maxLength={20}
            title="Solo números, espacios, + y -"
          />
          <FormField
            type="date"
            label={t('admin.socios.fechaNacimiento', 'Fecha de nacimiento')}
            value={form.fecha_nacimiento}
            onChange={(fecha_nacimiento) => setForm((f) => ({ ...f, fecha_nacimiento }))}
            required
          />
          <FormField
            as="select"
            label={t('admin.socios.rol', 'Rol')}
            value={form.rol}
            onChange={(rol) =>
              setForm((f) => ({
                ...f,
                rol,
                ...(rol === 'socio' ? { es_socio: true } : {}),
              }))
            }
            required
          >
            <option value="">{t('admin.socios.rolPlaceholder', 'Elegí un rol')}</option>
            <option value="socio">{t('admin.socios.rolSocio', 'Socio')}</option>
            <option value="profe">{t('admin.socios.rolProfe', 'Profe')}</option>
          </FormField>
          {form.rol === 'profe' && (
            <FormField
              as="checkbox"
              label={t('admin.socios.profeTambienSocio')}
              checked={form.es_socio}
              onChange={(es_socio) => setForm((f) => ({ ...f, es_socio }))}
            />
          )}
          {(form.rol !== 'profe' || form.es_socio) && (
            <FormField
              as="select"
              label={t('admin.socios.categoria', 'Categoría')}
              value={form.categoria_id}
              onChange={(categoria_id) => setForm((f) => ({ ...f, categoria_id }))}
              required
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (${c.monto})
                </option>
              ))}
            </FormField>
          )}
          {editingId && (
            <FormField
              as="select"
              label={t('admin.socios.estado', 'Estado')}
              value={form.estado}
              onChange={(estado) => setForm((f) => ({ ...f, estado }))}
            >
              <option value="activo">{t('admin.socios.estadoActivo', 'Activo')}</option>
              <option value="moroso">{t('admin.socios.estadoMoroso', 'Moroso')}</option>
              <option value="suspendido">{t('admin.socios.estadoSuspendido', 'Suspendido')}</option>
            </FormField>
          )}
          {!editingId && (
            <FormField
              type="password"
              label={t(
                'admin.socios.passwordOpcional',
                'Contraseña inicial (si falta: socio + DNI)',
              )}
              value={form.password}
              onChange={(password) => setForm((f) => ({ ...f, password }))}
            />
          )}
          </div>
          {!editingId && (form.rol !== 'profe' || form.es_socio) && (
            <AltaCobrosFields
              value={altaCobros}
              onChange={setAltaCobros}
              t={t}
            />
          )}
        </form>
      )}
      {upgrade && (
        <PlanUpgradeModal
          data={upgrade}
          busy={saving}
          onCancel={() => setUpgrade(null)}
          onAccept={() => {
            setUpgrade(null);
            void saveSocio(true);
          }}
        />
      )}
    </div>
  );
}

export default function NuevoSocioPage() {
  return (
    <Suspense fallback={null}>
      <NuevoSocioForm />
    </Suspense>
  );
}
