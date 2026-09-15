'use client';

import { useState } from 'react';
import { apiUpload, mediaUrl, requireSession } from '@/lib/api';

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Endpoint que recibe el archivo (multipart, campo "file") y devuelve { url }. */
  uploadPath: string;
  hint?: string;
  onError?: (message: string) => void;
};

export function ImageUploadField({ label, value, onChange, uploadPath, hint, onError }: Props) {
  const [uploading, setUploading] = useState(false);
  const preview = mediaUrl(value);

  async function onFile(file?: File) {
    if (!file) return;
    const session = requireSession();
    if (!session) return;
    setUploading(true);
    onError?.('');
    try {
      const { url } = await apiUpload<{ url: string }>(uploadPath, file, {
        token: session.access_token,
        clubSlug: session.club.slug,
      });
      onChange(url);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="sm:col-span-2">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={label} className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-[11px] text-slate-400">Sin imagen</span>
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
            onClick={() => onChange('')}
          >
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}
