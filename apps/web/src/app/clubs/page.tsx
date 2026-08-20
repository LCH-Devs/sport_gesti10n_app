'use client';

import React from 'react';
import { Header, Card, Badge, Button } from '@/components/common';

export default function ClubsPage() {
  const clubs = [
    {
      name: 'Metro City Athletics',
      status: 'ACTIVE',
      address: '1245 Stadium Way, Metro City, ST 90210',
      phone: '(555) 123-4567',
      disciplines: ['Soccer', 'Track & Field', 'Swimming'],
    },
    {
      name: 'Vanguard Tennis Academy',
      status: 'ACTIVE',
      address: '88 Racquet Court, Westside, ST 90212',
      phone: '(555) 987-6543',
      disciplines: ['Tennis'],
    },
    {
      name: 'Summit Hoops Club',
      status: 'UNDER REVIEW',
      address: '300 Baseline Dr, Northridge, ST 90215',
      phone: '(555) 444-3322',
      disciplines: ['Basketball', 'Youth Camps'],
    },
    {
      name: 'Coastal Aquatics',
      status: 'ACTIVE',
      address: '10 Ocean Blvd, Bayview, ST 90220',
      phone: '(555) 222-1111',
      disciplines: ['Swimming', 'Water Polo'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Clubs Directory"
        subtitle="Browse and manage registered sports institutions."
      >
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Find a club by name or discipline..."
            className="px-4 py-2 rounded-md border border-slate-300 w-80"
          />
          <Button size="md">Filters</Button>
          <Button variant="primary" size="md">+ Add Club</Button>
        </div>
      </Header>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clubs.map((club, index) => (
            <Card key={index}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md bg-blue-100 flex items-center justify-center text-2xl">
                    ⚽
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{club.name}</h3>
                    <Badge
                      label={club.status}
                      variant={
                        club.status === 'ACTIVE'
                          ? 'success'
                          : club.status === 'UNDER REVIEW'
                          ? 'warning'
                          : 'error'
                      }
                    />
                  </div>
                </div>
                <button className="text-slate-600 hover:text-slate-900">···</button>
              </div>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <p>📍 {club.address}</p>
                <p>📞 {club.phone}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {club.disciplines.map((discipline) => (
                    <span
                      key={discipline}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                    >
                      {discipline}
                    </span>
                  ))}
                </div>
              </div>

              <Button variant="ghost" className="w-full">
                Manage Club
              </Button>
            </Card>
          ))}
        </div>

        {/* Map Placeholder */}
        <Card className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Club Locations Map</h2>
          <div className="h-96 bg-slate-200 rounded-md flex items-center justify-center text-slate-600">
            🗺️ Map Integration Coming Soon
          </div>
        </Card>
      </div>
    </div>
  );
}
