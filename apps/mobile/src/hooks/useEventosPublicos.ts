import { useCallback, useEffect, useState } from 'react';
import { listEventosPublicos, type EventoPublico } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export function useEventosPublicos() {
  const { session } = useAuth();
  const [eventos, setEventos] = useState<EventoPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setEventos(await listEventosPublicos(session.access_token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los eventos');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { eventos, loading, error, reload };
}
