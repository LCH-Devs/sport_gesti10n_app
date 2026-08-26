'use client';

import React, { useState } from 'react';
import { Header, Card, Button } from '@/components/common';
import { useTranslation } from '@/lib/useTranslation';

type DisciplineId = 'football' | 'basketball' | 'tennis' | 'swimming';

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  events: Array<{ label: string; color: string; discipline: DisciplineId }>;
}

interface EventItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  icon: string;
}

export default function EventsPage() {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date(2024, 9, 15)); // Oct 15, 2024
  const [selectedDay, setSelectedDay] = useState(15);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [visibleDisciplines, setVisibleDisciplines] = useState<Record<DisciplineId, boolean>>({
    football: true,
    basketball: true,
    tennis: true,
    swimming: true,
  });

  // Mock event data: date -> array of events
  const mockEvents: Record<number, Array<{ label: string; color: string; discipline: DisciplineId }>> = {
    5: [{ label: 'Swimming', color: 'bg-blue-100 text-blue-700', discipline: 'swimming' }],
    8: [{ label: 'Final League', color: 'bg-purple-100 text-purple-700', discipline: 'football' }],
    12: [
      { label: 'Football', color: 'bg-green-100 text-green-700', discipline: 'football' },
      { label: 'Basketball', color: 'bg-orange-100 text-orange-700', discipline: 'basketball' },
    ],
    15: [{ label: 'Tennis Match', color: 'bg-yellow-100 text-yellow-700', discipline: 'tennis' }],
    20: [{ label: 'Swimming', color: 'bg-blue-100 text-blue-700', discipline: 'swimming' }],
    25: [{ label: 'Championship', color: 'bg-red-100 text-red-700', discipline: 'basketball' }],
  };

  // Today's events (mock)
  const todayEvents: EventItem[] = [
    { id: '1', title: 'Football Training', startTime: '14:00', endTime: '16:00', icon: '⚽' },
    { id: '2', title: 'Basketball Practice', startTime: '16:30', endTime: '18:00', icon: '🏀' },
  ];

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    let currentIterDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateNum = currentIterDate.getDate();
      const isCurrentMonth = currentIterDate.getMonth() === month;
      days.push({
        date: dateNum,
        isCurrentMonth,
        isSelected: isCurrentMonth && dateNum === selectedDay,
        events: (mockEvents[dateNum] || []).filter((event) => visibleDisciplines[event.discipline]),
      });
      currentIterDate.setDate(currentIterDate.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthLabel = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title={t('events.title')}
        subtitle={t('events.subtitle')}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t('events.searchPlaceholder')}
              className="pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-lg transition">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            JD
          </div>
        </div>
      </Header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Card */}
          <Card className="lg:col-span-2">
            {/* Month Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded transition">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold text-slate-900 min-w-[180px]">{monthLabel}</h2>
                <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded transition">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Toggle */}
              <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-1 rounded transition font-medium text-sm ${
                    viewMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {t('events.month')}
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-1 rounded transition font-medium text-sm ${
                    viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {t('events.week')}
                </button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {[
                t('calendar.mon'),
                t('calendar.tue'),
                t('calendar.wed'),
                t('calendar.thu'),
                t('calendar.fri'),
                t('calendar.sat'),
                t('calendar.sun'),
              ].map((day, idx) => (
                <div key={idx} className="text-center text-xs font-semibold text-slate-500 uppercase py-3">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(day.date)}
                  className={`aspect-square p-2 rounded-lg border-2 flex flex-col items-start justify-between transition relative group ${
                    day.isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : day.isCurrentMonth
                      ? 'border-slate-200 bg-white hover:bg-slate-50'
                      : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-xs font-bold flex items-center justify-center w-5 h-5 rounded-full transition ${
                      day.isSelected ? 'bg-blue-600 text-white' : day.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {day.date}
                  </span>

                  {/* Event Chips */}
                  <div className="w-full space-y-0.5 flex-1 flex flex-col justify-end">
                    {day.events.slice(0, 2).map((event, eventIdx) => (
                      <div key={eventIdx} className={`text-xs px-1.5 py-0.5 rounded font-medium truncate ${event.color}`}>
                        <span className="mr-0.5">●</span>
                        {event.label}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Right Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            {/* Active Events Card */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">{t('events.activeEvents')}</p>
                  <p className="text-4xl font-bold mt-2">12</p>
                  <p className="text-xs mt-3 opacity-75">{t('events.requiresAttention')}</p>
                </div>
                <div className="text-6xl opacity-10">🏆</div>
              </div>
            </Card>

            {/* Events Today Card */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('events.eventsToday')}
              </h3>
              <div className="space-y-4">
                {todayEvents.map((event) => (
                  <div key={event.id} className="flex gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="text-2xl flex-shrink-0">{event.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 text-sm">{event.title}</p>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {event.startTime} - {event.endTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Disciplines Card */}
            <Card>
              <h3 className="font-semibold text-slate-900 mb-4">{t('events.disciplines')}</h3>
              <div className="space-y-3">
                {(
                  [
                    { id: 'football', label: t('events.football') },
                    { id: 'basketball', label: t('events.basketball') },
                    { id: 'tennis', label: t('events.tennis') },
                    { id: 'swimming', label: t('events.swimming') },
                  ] as Array<{ id: DisciplineId; label: string }>
                ).map((discipline) => (
                  <label key={discipline.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={visibleDisciplines[discipline.id]}
                      onChange={() =>
                        setVisibleDisciplines((prev) => ({ ...prev, [discipline.id]: !prev[discipline.id] }))
                      }
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">{discipline.label}</span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center group">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
