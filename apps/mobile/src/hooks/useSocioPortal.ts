import { useCallback, useEffect, useState } from 'react';
import { getPortalMe, type PortalMe } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export function useSocioPortal() {
  const { session, isStaff } = useAuth();
  const [portal, setPortal] = useState<PortalMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!session || isStaff) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setPortal(await getPortalMe(session.access_token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar tu información');
    } finally {
      setLoading(false);
    }
  }, [session, isStaff]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { portal, loading, error, reload };
}
