'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClubEntryPage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = slug.trim().toLowerCase();
    if (!clean) return;
    router.push(`/login/${clean}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <p className="text-sm font-medium text-slate-500">ClubApp Arg</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Ingreso al club
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Cada club tiene su propio link. Si te lo enviamos por mail, usalo
          directo. Si no, ingresá el nombre corto (slug) de tu club.
        </p>
        <label className="mt-6 block text-sm font-medium text-slate-700">
          Slug del club
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ej. club-prueba"
            required
          />
        </label>
        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white"
        >
          Ir al login del club
        </button>
      </form>
    </main>
  );
}
