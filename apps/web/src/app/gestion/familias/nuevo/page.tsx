'use client';

import { apiFetch, isPlanUpgradeRequired, requireSession, type PlanUpgradeBody } from '@/lib/api';
import { PlanUpgradeModal } from '@/components/PlanUpgradeModal';
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';
import { FormField } from '../../_components/FormField';
import {
  AltaCobrosFields,
  altaCobrosPayload,
  EMPTY_ALTA_COBROS,
  type AltaCobrosValue,
} from '../../_components/AltaCobrosFields';

type SocioMini = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  grupo_familiar_id?: number | null;
};

type CategoriaCuota = {
  id: number;
  nombre: string;
  monto: number;
  es_default: boolean;
};

type PersonaDraft = {
  key: string;
  dni: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  rol: string;
  categoria_id: string;
};

type FamiliaDetalle = {
  id: number;
  nombre: string;
  titular_id: number;
  socios: SocioMini[];
};

function emptyPersona(categoriaId: string): PersonaDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    dni: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fecha_nacimiento: '',
    rol: 'socio',
    categoria_id: categoriaId,
  };
}

function personaPayload(p: PersonaDraft) {
  return {
    dni: p.dni,
    nombre: p.nombre,
    apellido: p.apellido,
    email: p.email,
    telefono: p.telefono || undefined,
    fecha_nacimiento: p.fecha_nacimiento,
    rol: p.rol,
    categoria_id: p.categoria_id ? Number(p.categoria_id) : undefined,
  };
}

function PersonaFields({
  value,
  onChange,
  categorias,
  t,
}: {
  value: PersonaDraft;
  onChange: (next: PersonaDraft) => void;
  categorias: CategoriaCuota[];
  t: (key: string, fallback?: string) => string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <FormField
        label={t('admin.socios.dni')}
        value={value.dni}
        onChange={(dni) => onChange({ ...value, dni })}
        required
      />
      <FormField
        label={t('admin.socios.nombre')}
        value={value.nombre}
        onChange={(nombre) => onChange({ ...value, nombre })}
        required
      />
      <FormField
        label={t('admin.socios.apellido')}
        value={value.apellido}
        onChange={(apellido) => onChange({ ...value, apellido })}
        required
      />
      <FormField
        type="email"
        label={t('admin.socios.email')}
        value={value.email}
        onChange={(email) => onChange({ ...value, email })}
        required
      />
      <FormField
        label={t('admin.socios.telefono')}
        value={value.telefono}
        onChange={(telefono) => onChange({ ...value, telefono })}
      />
      <FormField
        type="date"
        label={t('admin.socios.fechaNacimiento', 'Fecha de nacimiento')}
        value={value.fecha_nacimiento}
        onChange={(fecha_nacimiento) => onChange({ ...value, fecha_nacimiento })}
        required
      />
      <FormField
        as="select"
        label={t('admin.socios.rol', 'Rol')}
        value={value.rol}
        onChange={(rol) => onChange({ ...value, rol })}
        required
      >
        <option value="socio">{t('admin.socios.rolSocio', 'Socio')}</option>
        <option value="profe">{t('admin.socios.rolProfe', 'Profe')}</option>
      </FormField>
      <FormField
        as="select"
        label={t('admin.socios.categoria', 'Categoría')}
        value={value.categoria_id}
        onChange={(categoria_id) => onChange({ ...value, categoria_id })}
        required
      >
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre} (${c.monto})
          </option>
        ))}
      </FormField>
    </div>
  );
}

function NuevaFamiliaForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');

  const [socios, setSocios] = useState<SocioMini[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCuota[]>([]);
  const [nombre, setNombre] = useState('');
  const [titularModo, setTitularModo] = useState<'existente' | 'nuevo'>('existente');
  const [titularId, setTitularId] = useState('');
  const [titularNuevo, setTitularNuevo] = useState<PersonaDraft>(emptyPersona(''));
  const [miembros, setMiembros] = useState<number[]>([]);
  const [nuevos, setNuevos] = useState<PersonaDraft[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upgrade, setUpgrade] = useState<PlanUpgradeBody | null>(null);
  const [altaCobros, setAltaCobros] = useState<AltaCobrosValue>(EMPTY_ALTA_COBROS);

  const defaultCategoriaId = useMemo(() => {
    const def = categorias.find((c) => c.es_default) ?? categorias[0];
    return def ? String(def.id) : '';
  }, [categorias]);

  const load = useCallback(async () => {
    const session = requireSession();
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const [soc, cats] = await Promise.all([
        apiFetch<SocioMini[]>('/socios', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
        apiFetch<CategoriaCuota[]>('/categorias-cuota', {
          token: session.access_token,
          clubSlug: session.club.slug,
        }),
      ]);
      setSocios(soc);
      setCategorias(cats);
      const def = cats.find((c) => c.es_default) ?? cats[0];
      const catId = def ? String(def.id) : '';
      setTitularNuevo((prev) =>
        prev.categoria_id ? prev : { ...prev, categoria_id: catId },
      );

      if (editingId) {
        const fam = await apiFetch<FamiliaDetalle>(`/familias/${editingId}`, {
          token: session.access_token,
          clubSlug: session.club.slug,
        });
        setNombre(fam.nombre);
        setTitularModo('existente');
        setTitularId(String(fam.titular_id));
        setMiembros(
          fam.socios.filter((s) => s.id !== fam.titular_id).map((s) => s.id),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [editingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sociosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return socios.filter((s) => {
      if (titularModo === 'existente' && String(s.id) === titularId) return false;
      if (!q) return true;
      return (
        s.nombre.toLowerCase().includes(q) ||
        s.apellido.toLowerCase().includes(q) ||
        s.dni.toLowerCase().includes(q)
      );
    });
  }, [socios, busqueda, titularId, titularModo]);

  async function saveFamilia(aceptaUpgrade = false) {
    const session = requireSession();
    if (!session) return;
    if (titularModo === 'existente' && !titularId) {
      setError(t('admin.familias.titularRequerido', 'Elegí un titular'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        nombre,
        socio_ids: miembros,
        socios_nuevos: nuevos.length ? nuevos.map(personaPayload) : undefined,
        ...altaCobrosPayload(altaCobros),
        ...(aceptaUpgrade ? { acepta_upgrade: true } : {}),
      };
      if (titularModo === 'existente') {
        body.titular_id = Number(titularId);
      } else {
        body.titular = personaPayload(titularNuevo);
      }
      if (editingId) {
        await apiFetch(`/familias/${editingId}`, {
          method: 'PATCH',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/familias', {
          method: 'POST',
          token: session.access_token,
          clubSlug: session.club.slug,
          body: JSON.stringify(body),
        });
      }
      router.push('/gestion/familias');
    } catch (err) {
      if (isPlanUpgradeRequired(err)) {
        setUpgrade(err.body as unknown as PlanUpgradeBody);
        return;
      }
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await saveFamilia(false);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">
        {editingId ? t('admin.familias.editFamilia') : t('admin.familias.newFamilia')}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {t(
          'admin.familias.formHint',
          'Podés agrupar socios que ya están en el club y dar de alta gente nueva en el mismo paso.',
        )}
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">{t('common.loading', 'Cargando...')}</p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
            <FormField
              label={t('admin.familias.nombre')}
              value={nombre}
              onChange={setNombre}
              required
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold">{t('admin.familias.titular')}</h3>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="titular-modo"
                  checked={titularModo === 'existente'}
                  onChange={() => setTitularModo('existente')}
                />
                {t('admin.familias.titularExistente', 'Socio existente')}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="titular-modo"
                  checked={titularModo === 'nuevo'}
                  onChange={() => {
                    setTitularModo('nuevo');
                    setTitularNuevo((prev) =>
                      prev.categoria_id
                        ? prev
                        : { ...prev, categoria_id: defaultCategoriaId },
                    );
                  }}
                />
                {t('admin.familias.titularNuevo', 'Persona nueva')}
              </label>
            </div>
            {titularModo === 'existente' ? (
              <div className="mt-3 sm:max-w-md">
                <FormField
                  as="select"
                  label={t('admin.familias.titular')}
                  value={titularId}
                  onChange={(value) => {
                    setTitularId(value);
                    setMiembros((prev) => prev.filter((id) => String(id) !== value));
                  }}
                  required
                >
                  <option value="">{t('admin.familias.elegirTitular', 'Elegir…')}</option>
                  {socios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.apellido}, {s.nombre} ({s.dni})
                    </option>
                  ))}
                </FormField>
              </div>
            ) : (
              <div className="mt-3">
                <PersonaFields
                  value={titularNuevo}
                  onChange={setTitularNuevo}
                  categorias={categorias}
                  t={t}
                />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold">
              {t('admin.familias.sociosExistentes', 'Socios existentes')}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {t(
                'admin.familias.sociosExistentesHint',
                'Tildá quiénes ya están en el club y forman parte del grupo.',
              )}
            </p>
            <input
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:max-w-md"
              placeholder={t('admin.familias.buscarSocio', 'Buscar por nombre o DNI')}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <div className="mt-2 grid max-h-56 gap-1 overflow-y-auto rounded-lg border border-slate-300 p-2 sm:grid-cols-2">
              {sociosFiltrados.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={miembros.includes(s.id)}
                    onChange={(e) =>
                      setMiembros((prev) =>
                        e.target.checked
                          ? [...prev, s.id]
                          : prev.filter((id) => id !== s.id),
                      )
                    }
                  />
                  <span>
                    {s.apellido}, {s.nombre} ({s.dni})
                    {s.grupo_familiar_id &&
                      String(s.grupo_familiar_id) !== String(editingId ?? '') && (
                        <span className="ml-1 text-xs text-amber-700">
                          {t('admin.familias.enOtraFamilia', 'en otra familia')}
                        </span>
                      )}
                  </span>
                </label>
              ))}
              {sociosFiltrados.length === 0 && (
                <p className="text-sm text-slate-500 sm:col-span-2">
                  {t('messages.noData')}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold">
                  {t('admin.familias.personasNuevas', 'Personas nuevas')}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {t(
                    'admin.familias.personasNuevasHint',
                    'Se dan de alta como socios al guardar el grupo. Si no ponen clave, queda socio + DNI.',
                  )}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold"
                onClick={() =>
                  setNuevos((prev) => [...prev, emptyPersona(defaultCategoriaId)])
                }
              >
                {t('admin.familias.agregarPersona', 'Agregar persona')}
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {nuevos.map((p, idx) => (
                <div key={p.key} className="rounded-lg border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {t('admin.familias.personaN', 'Persona')} {idx + 1}
                    </p>
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={() =>
                        setNuevos((prev) => prev.filter((x) => x.key !== p.key))
                      }
                    >
                      {t('admin.familias.quitarPersona', 'Quitar')}
                    </button>
                  </div>
                  <PersonaFields
                    value={p}
                    onChange={(next) =>
                      setNuevos((prev) =>
                        prev.map((x) => (x.key === p.key ? next : x)),
                      )
                    }
                    categorias={categorias}
                    t={t}
                  />
                </div>
              ))}
            </div>
          </div>

          <AltaCobrosFields
            value={altaCobros}
            onChange={setAltaCobros}
            t={t}
            hint={t(
              'admin.familias.altaCobrosHint',
              'Se aplica a las personas nuevas (titular nuevo y altas). Los socios que ya estaban no cambian.',
            )}
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--club-primary)] px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {editingId
                ? t('common.save', 'Guardar')
                : t('admin.familias.createFamilia')}
            </button>
            <button
              type="button"
              onClick={() => router.push('/gestion/familias')}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
            >
              {t('newClub.cancel', 'Cancelar')}
            </button>
          </div>
        </form>
      )}
      {upgrade && (
        <PlanUpgradeModal
          data={upgrade}
          busy={saving}
          onCancel={() => setUpgrade(null)}
          onAccept={() => {
            setUpgrade(null);
            void saveFamilia(true);
          }}
        />
      )}
    </div>
  );
}

export default function NuevaFamiliaPage() {
  return (
    <Suspense fallback={null}>
      <NuevaFamiliaForm />
    </Suspense>
  );
}
