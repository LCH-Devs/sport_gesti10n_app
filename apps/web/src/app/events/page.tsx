'use client';

import React from 'react';
import { Header, Card, Badge, Button } from '@/components/common';

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Eventos y Calendario Deportivo"
        subtitle="Schedule and manage sports events and competitions."
      >
        <input
          type="text"
          placeholder="Search events..."
          className="px-4 py-2 rounded-md border border-slate-300 w-80"
        />
      </Header>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Calendar Sidebar */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Disciplines</h3>
            <div className="space-y-2">
              {['Football', 'Basketball', 'Tennis', 'Swimming'].map((d) => (
                <label key={d} className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">{d}</span>
                </label>
              ))}
            </div>

            <h3 className="font-semibold text-slate-900 mt-6 mb-4">Institutions</h3>
            <select className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm">
              <option>All Institutions</option>
            </select>

            <Button className="w-full mt-6">Schedule Event</Button>
          </Card>

          {/* Calendar */}
          <Card className="col-span-2">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">October 2024</h2>
              <div className="flex gap-4 mb-4">
                <button className="font-medium text-blue-600">Month</button>
                <button className="font-medium text-slate-600">Week</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center font-medium text-sm text-slate-600 py-2">
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
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming</h2>
          <div className="space-y-4">
            {[
              { date: 'OCT 12', title: 'National Derby Final', time: '18:00 - 20:30', icon: '⚽' },
              { date: 'OCT 15', title: 'U19 Regional Qualifiers', time: '09:00 - 14:00', icon: '🏀' },
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
