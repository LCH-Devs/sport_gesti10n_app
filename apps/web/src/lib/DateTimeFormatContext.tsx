'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  formatDate as formatDateFn,
  formatDateTime as formatDateTimeFn,
  formatHm as formatHmFn,
  formatHmRange as formatHmRangeFn,
  formatTime as formatTimeFn,
  formatTimeRange as formatTimeRangeFn,
  readTimeFormat,
  TIME_FORMAT_KEY,
  type TimeFormat,
} from './datetime';

type DateTimeFormatContextType = {
  timeFormat: TimeFormat;
  hour12: boolean;
  setTimeFormat: (fmt: TimeFormat) => void;
  formatDateTime: (value: string | Date) => string;
  formatTime: (value: string | Date) => string;
  formatDate: (value: string | Date) => string;
  formatHm: (hm: string) => string;
  formatHmRange: (inicio: string, fin: string) => string;
  formatTimeRange: (inicio: string | Date, fin: string | Date) => string;
};

const DateTimeFormatContext = createContext<DateTimeFormatContextType | undefined>(undefined);

export function DateTimeFormatProvider({ children }: { children: React.ReactNode }) {
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('24h');

  useEffect(() => {
    setTimeFormatState(readTimeFormat());
  }, []);

  const setTimeFormat = useCallback((fmt: TimeFormat) => {
    localStorage.setItem(TIME_FORMAT_KEY, fmt);
    setTimeFormatState(fmt);
  }, []);

  const hour12 = timeFormat === '12h';

  const value = useMemo<DateTimeFormatContextType>(
    () => ({
      timeFormat,
      hour12,
      setTimeFormat,
      formatDateTime: (v) => formatDateTimeFn(v, hour12),
      formatTime: (v) => formatTimeFn(v, hour12),
      formatDate: (v) => formatDateFn(v, hour12),
      formatHm: (hm) => formatHmFn(hm, hour12),
      formatHmRange: (a, b) => formatHmRangeFn(a, b, hour12),
      formatTimeRange: (a, b) => formatTimeRangeFn(a, b, hour12),
    }),
    [timeFormat, hour12, setTimeFormat],
  );

  return (
    <DateTimeFormatContext.Provider value={value}>{children}</DateTimeFormatContext.Provider>
  );
}

export function useDateTimeFormat() {
  const ctx = useContext(DateTimeFormatContext);
  if (!ctx) {
    throw new Error('useDateTimeFormat must be used within DateTimeFormatProvider');
  }
  return ctx;
}
