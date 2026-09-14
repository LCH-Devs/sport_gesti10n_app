import { useCallback, useEffect, useState } from 'react';
import {
  cancelarReservaSocio,
  crearReservaSocio,
  getDisponibilidad,
  listEspaciosSocio,
  listReservasSocio,
  type Espacio,
  type Reserva,
  type Slot,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export function useReservas() {
  const { session, isStaff } = useAuth();
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!session || isStaff) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [espaciosData, reservasData] = await Promise.all([
        listEspaciosSocio(session.access_token),
        listReservasSocio(session.access_token),
      ]);
      setEspacios(espaciosData);
      setReservas(reservasData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
    }
  }, [session, isStaff]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const buscarDisponibilidad = useCallback(
    async (espacioId: number, fecha: string): Promise<Slot[]> => {
      if (!session) return [];
      const data = await getDisponibilidad(session.access_token, espacioId, fecha);
      return data.slots;
    },
    [session],
  );

  const reservar = useCallback(
    async (espacioId: number, slot: Slot) => {
      if (!session) return;
      setBusy(true);
      setError('');
      try {
        await crearReservaSocio(session.access_token, espacioId, slot.inicio, slot.fin);
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo reservar ese horario');
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [session, reload],
  );

  const cancelar = useCallback(
    async (reservaId: number) => {
      if (!session) return;
      setBusy(true);
      setError('');
      try {
        await cancelarReservaSocio(session.access_token, reservaId);
        await reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cancelar la reserva');
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [session, reload],
  );

  return { espacios, reservas, loading, error, busy, reload, buscarDisponibilidad, reservar, cancelar };
}
