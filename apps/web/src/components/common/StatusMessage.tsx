import React from 'react';

type StatusMessageProps = { children: React.ReactNode; tone?: 'muted' | 'error' | 'success' };

export function StatusMessage({ children, tone = 'muted' }: StatusMessageProps) {
  const className = tone === 'error'
    ? 'rounded-lg bg-red-50 p-3 text-red-700'
    : tone === 'success'
      ? 'rounded-lg bg-emerald-50 p-3 text-emerald-700'
      : 'text-slate-500';
  return <p className={`text-sm ${className}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</p>;
}
