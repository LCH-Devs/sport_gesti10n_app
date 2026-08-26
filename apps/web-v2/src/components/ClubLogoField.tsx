'use client';

import { useState } from 'react';
import {
  apiFetch,
  apiUpload,
  getSession,
  mediaUrl,
  saveSession,
} from '@/lib/api';

type ClubWithLogo = {
  logo_url: string | null;
};

type Props = {
  value: string;
  onChange: (url: string) => void;
  onError?: (message: string) => void;
};

export function ClubLogoField({ value, onChange, onError }: Props) {
  const [uploading, setUploading] = useState(false);
  const preview = mediaUrl(value);

  async function onFile(file?: File) {
    if (!file) return;
    const session = getSession();
    if (!session) return;
    setUploading(true);
    onError?.('');
    try {
      const updated = await apiUpload<ClubWithLogo>('/clubs/me/logo', file, {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      const logo = updated.logo_url || '';
      onChange(logo);
      saveSession({
        ...session,
        club: { ...session.club, logo_url: updated.logo_url },
      });
      window.dispatchEvent(new Event('club-session-changed'));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'No se pudo subir el logo');
    } finally {
      setUploading(false);
    }
  }

  async function clearLogo() {
    const session = getSession();
    if (!session) return;
    setUploading(true);
    onError?.('');
    try {
      await apiFetch('/clubs/me', {
        method: 'PATCH',
        token: session.access_token,
        clubSlug: session.club.slug,
        body: JSON.stringify({ logo_url: '' }),
      });
      onChange('');
      saveSession({
        ...session,
        club: { ...session.club, logo_url: null },
      });
      window.dispatchEvent(new Event('club-session-changed'));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'No se pudo quitar el logo');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="sm:col-span-2">
      <p className="text-sm font-medium text-slate-700">Logo del club</p>
      <p className="mt-0.5 text-xs text-slate-500">
        Subí una imagen desde la computadora (JPG, PNG, WEBP o GIF · máx. 2 MB).
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <span className="px-2 text-center text-[11px] text-slate-400">
              Sin logo
            </span>
          )}
        </div>
        <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          {uploading ? 'Subiendo…' : 'Elegir archivo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              void onFile(file);
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            className="text-sm text-slate-500 underline"
            disabled={uploading}
            onClick={() => void clearLogo()}
          >
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}
