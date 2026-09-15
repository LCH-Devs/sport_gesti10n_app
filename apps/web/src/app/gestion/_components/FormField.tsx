'use client';

import { ReactNode, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

type BaseProps = {
  label: ReactNode;
  colSpan?: boolean;
  /** Mensaje de ayuda mostrado debajo del campo (rojo) cuando el dato ingresado no es válido. */
  error?: string;
};

type InputProps = BaseProps & {
  as?: 'input';
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  min?: number | string;
  max?: number | string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  step?: number | string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'url' | 'decimal' | 'search' | 'none';
  title?: string;
};

type TextareaProps = BaseProps & {
  as: 'textarea';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
};

type SelectProps = BaseProps & {
  as: 'select';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  children: ReactNode;
};

type CheckboxProps = BaseProps & {
  as: 'checkbox';
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export type FormFieldProps = InputProps | TextareaProps | SelectProps | CheckboxProps;

const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2';

export function FormField(props: FormFieldProps) {
  const labelClass = `text-sm ${props.colSpan ? 'sm:col-span-2' : ''}`;
  const [verPassword, setVerPassword] = useState(false);

  if (props.as === 'checkbox') {
    return (
      <label className={`flex items-center gap-2 text-sm ${props.colSpan ? 'sm:col-span-2' : ''}`}>
        <input
          type="checkbox"
          checked={props.checked}
          onChange={(e) => props.onChange(e.target.checked)}
        />
        {props.label}
      </label>
    );
  }

  if (props.as === 'textarea') {
    return (
      <label className={labelClass}>
        {props.label}
        <textarea
          className={inputClass}
          rows={props.rows ?? 4}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          required={props.required}
        />
        {props.error && <p className="mt-1 text-xs text-red-600">{props.error}</p>}
      </label>
    );
  }

  if (props.as === 'select') {
    return (
      <label className={labelClass}>
        {props.label}
        <select
          className="select-field mt-1 w-full"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          required={props.required}
        >
          {props.children}
        </select>
      </label>
    );
  }

  const esPassword = props.type === 'password';

  return (
    <label className={labelClass}>
      {props.label}
      <div className="relative">
        <input
          className={`${inputClass} ${esPassword ? 'pr-10' : ''}`}
          type={esPassword && verPassword ? 'text' : props.type ?? 'text'}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          required={props.required}
          disabled={props.disabled}
          placeholder={props.placeholder}
          min={props.min}
          max={props.max}
          minLength={props.minLength}
          maxLength={props.maxLength}
          pattern={props.pattern}
          step={props.step}
          inputMode={props.inputMode}
          title={props.title}
        />
        {esPassword && (
          <button
            type="button"
            onClick={() => setVerPassword((v) => !v)}
            disabled={props.disabled}
            className="absolute inset-y-0 right-0 mt-1 flex items-center px-3 text-slate-500 hover:text-slate-700"
            title={verPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            aria-label={verPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {verPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      {props.error && <p className="mt-1 text-xs text-red-600">{props.error}</p>}
    </label>
  );
}
