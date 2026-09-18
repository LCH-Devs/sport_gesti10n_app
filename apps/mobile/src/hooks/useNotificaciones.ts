import { useCallback, useEffect, useState } from 'react';
import {
  listNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  type NotificacionItem,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const POLL_MS = 30000;

export function useNotificaciones() {
  const { session } = useAuth();
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!session) {
      setNotificaciones([]);
      setLoading(false);
      return;
    }
    try {
      const data = await listNotificaciones(session.access_token);
      setNotificaciones(data);
    } catch {
      // silencioso: no bloquea la UI si falla el fetch de notificaciones
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void reload();
    const interval = setInterval(() => void reload(), POLL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  const marcarLeida = useCallback(
    async (id: number) => {
      if (!session) return;
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leido: true } : n)));
      await marcarNotificacionLeida(session.access_token, id).catch(() => {});
    },
    [session],
  );

  const marcarTodasLeidas = useCallback(async () => {
    if (!session) return;
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
    await marcarTodasNotificacionesLeidas(session.access_token).catch(() => {});
  }, [session]);

  const unreadCount = notificaciones.filter((n) => !n.leido).length;

  return { notificaciones, loading, unreadCount, reload, marcarLeida, marcarTodasLeidas };
}
