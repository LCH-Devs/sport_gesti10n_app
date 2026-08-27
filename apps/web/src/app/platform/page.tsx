'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserGroupIcon, DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Header, Card, Badge, Button } from '@/components/common';
import { apiFetch, getPlatformSession } from '@/lib/api';
import { useTranslation } from '@/lib/useTranslation';

type AdminUser = {
  id: number;
  email: string;
  nombre: string;
  activo: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    const session = getPlatformSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<AdminUser[]>('/platform/admins', {
        token: session.access_token,
      });
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const metrics = [
    { label: t('dashboard.totalAdmins'), value: users.length.toString(), change: t('dashboard.realtime'), icon: UserGroupIcon },
    { label: t('dashboard.activeUsers'), value: users.filter(u => u.activo).length.toString(), change: t('dashboard.realtime'), icon: DocumentTextIcon },
    { label: t('dashboard.systemHealth'), value: '99.9%', change: t('dashboard.allServices'), icon: SparklesIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        title={t('dashboard.overview')}
        subtitle={t('dashboard.realtime')}
      >
        <div className="flex gap-2">
          <Button size="md">{t('dashboard.exportReport')}</Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => router.push('/platform/clubs/new')}
          >
            {t('dashboard.addInstitution')}
          </Button>
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
              <h2 className="text-lg font-semibold text-slate-900">{t('dashboard.userManagement')}</h2>
            </div>
            <button className="text-slate-600 hover:text-slate-900">⚙️</button>
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-900">{t('dashboard.name')}</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-900">{t('dashboard.email')}</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-900">{t('dashboard.status')}</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-900">{t('dashboard.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-slate-500">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-slate-500">
                      {t('dashboard.noUsers')}
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr
                      key={user.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-sm font-semibold">
                            {user.nombre
                              .split(' ')
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          {user.nombre}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge
                          label={user.activo ? t('clubs.active') : t('clubs.inactive')}
                          variant={user.activo ? 'success' : 'pending'}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-slate-600 hover:text-slate-900">···</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('dashboard.monthlyQuotas')}</h3>
            <p className="text-4xl font-bold text-blue-600 mb-2">$1.2M</p>
            <p className="text-sm text-slate-600">{t('dashboard.goalPercentage')}</p>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('dashboard.pendingPayments')}</h3>
            <p className="text-4xl font-bold text-slate-900 mb-4">$345K</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('dashboard.exampleClub1')}</span>
                <span className="text-red-600">$12,000</span>
              </div>
              <div className="flex justify-between">
                <span>{t('dashboard.exampleClub2')}</span>
                <span className="text-red-600">$8,500</span>
              </div>
            </div>
            <button className="text-blue-600 text-sm font-medium mt-4">
              {t('dashboard.viewAll')}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
