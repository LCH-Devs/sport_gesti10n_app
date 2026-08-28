'use client';

import { useEffect, useRef, useState } from 'react';

export interface GeoRefProvincia {
  id: string;
  nombre: string;
}

export interface GeoRefLocalidad {
  id: string;
  nombre: string;
  provincia: GeoRefProvincia;
}

export interface GeoRefCalle {
  id: string;
  nombre: string;
  provincia?: GeoRefProvincia;
  localidad?: GeoRefLocalidad;
}

export interface PlaceAutocompleteProps<T> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: T) => void;
  fetchUrl: (query: string) => string;
  /** Clave del JSON de GeoRef donde viene el array de resultados (ej: "localidades", "calles") */
  resultsKey: string;
  formatOption: (item: T) => string;
  debounceMs?: number;
  placeholder?: string;
  required?: boolean;
}

export function PlaceAutocomplete<T extends { id: string }>({
  label,
  value,
  onChange,
  onSelect,
  fetchUrl,
  resultsKey,
  formatOption,
  debounceMs = 300,
  placeholder = '',
  required = false,
}: PlaceAutocompleteProps<T>) {
  const [options, setOptions] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (text: string) => {
    onChange(text);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!text.trim()) {
      setOptions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const url = fetchUrl(text);
        const response = await fetch(url);
        if (!response.ok) {
          setOptions([]);
          setLoading(false);
          return;
        }
        const data = await response.json();
        const items: T[] = data[resultsKey] || [];
        setOptions(items);
        setIsOpen(items.length > 0);
      } catch (err) {
        console.error('Error fetching autocomplete options:', err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  };

  const handleSelectOption = (item: T) => {
    onChange(formatOption(item));
    onSelect(item);
    setIsOpen(false);
    setOptions([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="text-sm">
        {label}
        <div className="relative mt-1">
          <input
            type="text"
            className="w-full rounded-lg border px-3 py-2"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            autoComplete="off"
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-xs text-slate-400">Buscando…</span>
            </div>
          )}
        </div>
      </label>

      {isOpen && options.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-300 bg-white shadow-lg">
          {options.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
              onClick={() => handleSelectOption(item)}
            >
              {formatOption(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
