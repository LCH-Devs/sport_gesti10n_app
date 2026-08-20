'use client';

import React from 'react';
import { UserGroupIcon, DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Header, Card, Badge, Button } from '@/components/common';

export default function DashboardPage() {
  const metrics = [
    { label: 'TOTAL ACTIVE USERS', value: '124,592', change: '+12% from last month', icon: UserGroupIcon },
    { label: 'NEW REGISTRATIONS', value: '3,842', change: '+5.4% from last month', icon: DocumentTextIcon },
    { label: 'SYSTEM HEALTH', value: '99.9%', change: 'All services operational', icon: SparklesIcon },
  ];

  const users = [
    { name: 'Alex Johnson', role: 'Club Director', institution: 'Metro City FC', status: 'ACTIVE' },
    { name: 'Sarah Lee', role: 'Coach', institution: 'Northside Athletics', status: 'ACTIVE' },
    { name: 'Mike Ross', role: 'Player', institution: 'East Valley Titans', status: 'SUSPENDED' },
    { name: 'Emma Watson', role: 'Admin', institution: 'Global Sports HQ', status: 'PENDING' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="System Overview"
        subtitle="Real-time metrics across all institutions."
      >
        <div className="flex gap-2">
          <Button size="md">Export Report</Button>
          <Button variant="secondary" size="md">Add Institution</Button>
        </div>
      </Header>

      <div className="p-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {metric.label}
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{metric.value}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-slate-600">{metric.change}</p>
              </Card>
            );
          })}
        </div>

        {/* User Management Table */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">User & Profile Management</h2>
            </div>
            <button className="text-slate-600 hover:text-slate-900">⚙️</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-900">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-900">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-900">Institution</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-900">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        {user.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.role}</td>
                    <td className="px-4 py-3 text-slate-600">{user.institution}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={user.status}
                        variant={
                          user.status === 'ACTIVE'
                            ? 'success'
                            : user.status === 'SUSPENDED'
                            ? 'error'
                            : 'pending'
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-slate-600 hover:text-slate-900">···</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">MONTHLY QUOTAS COLLECTED</h3>
            <p className="text-4xl font-bold text-blue-600 mb-2">$1.2M</p>
            <p className="text-sm text-slate-600">85% of Goal</p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">PENDING PAYMENTS</h3>
            <p className="text-4xl font-bold text-slate-900 mb-4">$345K</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Metro City FC</span>
                <span className="text-red-600">$12,000</span>
              </div>
              <div className="flex justify-between">
                <span>Northside Athletics</span>
                <span className="text-red-600">$8,500</span>
              </div>
            </div>
            <button className="text-blue-600 text-sm font-medium mt-4">
              View All Outstanding
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
