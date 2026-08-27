'use client';

import React, { useState } from 'react';
import { Header, Card, Badge, Button, DataTable, type Column } from '@/components/common';
import { useTranslation } from '@/lib/useTranslation';

type User = {
  id: number;
  name: string;
  role: string;
  institution: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  joinDate: string;
};

const INITIAL_USERS: User[] = [
    {
      id: 1,
      name: 'Alex Johnson',
      role: 'Club Director',
      institution: 'Metro City FC',
      status: 'ACTIVE',
      joinDate: 'Jan 2024',
    },
    {
      id: 2,
      name: 'Sarah Lee',
      role: 'Coach',
      institution: 'Northside Athletics',
      status: 'ACTIVE',
      joinDate: 'Mar 2024',
    },
    {
      id: 3,
      name: 'Mike Ross',
      role: 'Player',
      institution: 'East Valley Titans',
      status: 'SUSPENDED',
      joinDate: 'Feb 2024',
    },
    {
      id: 4,
      name: 'Emma Watson',
      role: 'Admin',
      institution: 'Global Sports HQ',
      status: 'PENDING',
      joinDate: 'Aug 2024',
    },
    {
      id: 5,
      name: 'John Smith',
      role: 'Manager',
      institution: 'Coastal Aquatics',
      status: 'ACTIVE',
      joinDate: 'Apr 2024',
    },
  ];

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  function onDelete(user: User) {
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: t('dashboard.name'),
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-sm font-medium">
            {user.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <span className="font-medium text-slate-900">{user.name}</span>
        </div>
      ),
    },
    { key: 'role', header: t('dashboard.role'), sortable: true },
    { key: 'institution', header: t('users.institution'), sortable: true },
    {
      key: 'status',
      header: t('dashboard.status'),
      sortable: true,
      render: (user) => (
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
      ),
    },
    { key: 'joinDate', header: t('users.joinDate'), sortable: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title={t('users.title')}
        subtitle={t('users.subtitle')}
      >
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t('users.searchPlaceholder')}
            className="px-4 py-2 rounded-md border border-slate-300 w-80"
          />
          <Button size="md">{t('users.filters')}</Button>
          <Button variant="primary" size="md">+ {t('users.addUser')}</Button>
        </div>
      </Header>

      <div className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <Card>
            <p className="text-xs font-semibold text-slate-500 uppercase">{t('users.totalUsers')}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">8,547</p>
            <p className="text-sm text-green-600 mt-2">↑ {t('users.thisMonth')}</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-slate-500 uppercase">{t('users.activeMemberships')}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">6,234</p>
            <p className="text-sm text-slate-600 mt-2">{t('users.ofTotal')}</p>
          </Card>
         {/*  <Card>
            <p className="text-xs font-semibold text-slate-500 uppercase">{t('users.pendingApprovals')}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">89</p>
            <p className="text-sm text-amber-600 mt-2">⚠️ {t('users.requiresAttention')}</p>
          </Card> */}
        </div>

        {/* User Management Table */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">{t('users.userManagement')}</h2>
          </div>

          <DataTable
            columns={columns}
            data={users}
            getRowId={(user) => user.id}
            onEdit={() => {}}
            onDelete={onDelete}
            deleteConfirmMessage={(user) => `${t('dataTable.confirmDelete', '¿Eliminar')} ${user.name}?`}
          />
        </Card>
      </div>
    </div>
  );
}
