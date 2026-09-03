'use client';

import { ReactNode } from 'react';

type BaseProps = {
  label: ReactNode;
  colSpan?: boolean;
};

type InputProps = BaseProps & {
  as?: 'input';
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  min?: number;
  minLength?: number;
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

  return (
    <label className={labelClass}>
      {props.label}
      <input
        className={inputClass}
        type={props.type ?? 'text'}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        required={props.required}
        placeholder={props.placeholder}
        min={props.min}
        minLength={props.minLength}
      />
    </label>
  );
}
