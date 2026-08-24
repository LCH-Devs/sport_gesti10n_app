'use client';

import React from 'react';
import { Header, Card, Badge, Button } from '@/components/common';
import { useTranslation } from '@/lib/useTranslation';

export default function EventsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title={t('events.title')}
        subtitle={t('events.subtitle')}
      >
        <input
          type="text"
          placeholder={t('events.searchPlaceholder')}
          className="px-4 py-2 rounded-md border border-slate-300 w-80"
        />
      </Header>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Calendar Sidebar */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">{t('events.disciplines')}</h3>
            <div className="space-y-2">
              {[
                { id: 'football', label: t('events.football') },
                { id: 'basketball', label: t('events.basketball') },
                { id: 'tennis', label: t('events.tennis') },
                { id: 'swimming', label: t('events.swimming') },
              ].map((d) => (
                <label key={d.id} className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">{d.label}</span>
                </label>
              ))}
            </div>

            <h3 className="font-semibold text-slate-900 mt-6 mb-4">{t('events.institutions')}</h3>
            <select className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm">
              <option>{t('events.allInstitutions')}</option>
            </select>

            <Button className="w-full mt-6">{t('events.scheduleEvent')}</Button>
          </Card>

          {/* Calendar */}
          <Card className="col-span-2">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">October 2024</h2>
              <div className="flex gap-4 mb-4">
                <button className="font-medium text-blue-600">{t('events.month')}</button>
                <button className="font-medium text-slate-600">{t('events.week')}</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {[
                t('calendar.mon'),
                t('calendar.tue'),
                t('calendar.wed'),
                t('calendar.thu'),
                t('calendar.fri'),
                t('calendar.sat'),
                t('calendar.sun'),
              ].map((day, idx) => (
                <div key={idx} className="text-center font-medium text-sm text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }).map((_, i) => (
                <div
                  key={i}
                  className={`p-2 rounded border text-center text-sm ${
                    i === 11 ? 'bg-blue-100 border-blue-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('events.upcoming')}</h2>
          <div className="space-y-4">
            {[
              { date: 'OCT 12', title: t('events.event1Title'), time: '18:00 - 20:30', icon: '⚽' },
              { date: 'OCT 15', title: t('events.event2Title'), time: '09:00 - 14:00', icon: '🏀' },
            ].map((event, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-md">
                <div className="text-3xl">{event.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <p className="text-sm text-slate-600">📍 {event.date}</p>
                  <p className="text-sm text-slate-600">🕐 {event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
