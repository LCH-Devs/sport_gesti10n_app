'use client';

import React from 'react';
import { Header, Card, Badge, Button } from '@/components/common';

export default function UsersPage() {
  const users = [
    {
      name: 'Alex Johnson',
      role: 'Club Director',
      institution: 'Metro City FC',
      status: 'ACTIVE',
      joinDate: 'Jan 2024',
    },
    {
      name: 'Sarah Lee',
      role: 'Coach',
      institution: 'Northside Athletics',
      status: 'ACTIVE',
      joinDate: 'Mar 2024',
    },
    {
      name: 'Mike Ross',
      role: 'Player',
      institution: 'East Valley Titans',
      status: 'SUSPENDED',
      joinDate: 'Feb 2024',
    },
    {
      name: 'Emma Watson',
      role: 'Admin',
      institution: 'Global Sports HQ',
      status: 'PENDING',
      joinDate: 'Aug 2024',
    },
    {
      name: 'John Smith',
      role: 'Manager',
      institution: 'Coastal Aquatics',
      status: 'ACTIVE',
      joinDate: 'Apr 2024',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title="Administración de Usuarios y Cuotas"
        subtitle="Manage members, staff, and user permissions across all institutions."
      >
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search users..."
            className="px-4 py-2 rounded-md border border-slate-300 w-80"
          />
          <Button size="md">Filters</Button>
          <Button variant="primary" size="md">+ Add User</Button>
        </div>
      </Header>

      <div className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <Card>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Users</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">8,547</p>
            <p className="text-sm text-green-600 mt-2">↑ 12% this month</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Memberships</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">6,234</p>
            <p className="text-sm text-slate-600 mt-2">73% of total</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-slate-500 uppercase">Pending Approvals</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">89</p>
            <p className="text-sm text-amber-600 mt-2">⚠️ Requires attention</p>
          </Card>
        </div>

        {/* User Management Table */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">User Management</h2>
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
                  <th className="text-left px-4 py-3 font-semibold text-slate-900">Join Date</th>
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
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-sm font-medium">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <span className="font-medium text-slate-900">{user.name}</span>
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
                    <td className="px-4 py-3 text-slate-600">{user.joinDate}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-slate-600 hover:text-slate-900 font-medium">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing 1 to {users.length} of {users.length} results
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                Previous
              </Button>
              <Button variant="primary" size="sm">
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
