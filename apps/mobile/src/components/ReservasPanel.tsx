import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Body, Card, Heading } from '@/components/common';
import { useReservas } from '@/hooks/useReservas';
import type { Reserva, Slot } from '@/lib/api';

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
}

export function ReservasPanel() {
  const { espacios, reservas, loading, error, busy, buscarDisponibilidad, reservar, cancelar } = useReservas();
  const [espacioId, setEspacioId] = useState<number | null>(null);
  const [fecha, setFecha] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  const espacioActual = espacioId ?? espacios[0]?.id ?? null;

  async function onBuscar() {
    if (!espacioActual || !FECHA_REGEX.test(fecha)) {
      setSlotsError('Ingresá una fecha válida (AAAA-MM-DD)');
      return;
    }
    setSlotsError('');
    setLoadingSlots(true);
    setSlots([]);
    try {
      setSlots(await buscarDisponibilidad(espacioActual, fecha));
    } catch (err) {
      setSlotsError(err instanceof Error ? err.message : 'Error al buscar horarios');
    } finally {
      setLoadingSlots(false);
    }
  }

  async function onReservar(slot: Slot) {
    if (!espacioActual) return;
    try {
      await reservar(espacioActual, slot);
      setSlots((prev) => prev.filter((s) => s.inicio !== slot.inicio));
    } catch {
      // el error ya queda en el estado del hook
    }
  }

  function onCancelar(reserva: Reserva) {
    Alert.alert('Cancelar reserva', `¿Cancelar tu reserva de ${reserva.espacio.nombre}?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => void cancelar(reserva.id) },
    ]);
  }

  const ahora = Date.now();
  const futuras = reservas.filter((r) => r.estado === 'confirmada' && new Date(r.inicio).getTime() > ahora);
  const pasadas = reservas.filter((r) => !futuras.includes(r));

  if (loading && espacios.length === 0) {
    return <ActivityIndicator color="#00288e" style={{ marginVertical: 16 }} />;
  }

  return (
    <View>
      {error && <Body style={styles.error}>{error}</Body>}

      {espacios.length === 0 ? (
        <Body size="sm" style={styles.empty}>El club todavía no tiene espacios disponibles para reservar.</Body>
      ) : (
        <Card style={styles.formCard}>
          <Body size="sm" style={styles.formLabel}>Espacio</Body>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {espacios.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={[styles.chip, espacioActual === e.id && styles.chipActive]}
                onPress={() => {
                  setEspacioId(e.id);
                  setSlots([]);
                }}
              >
                <Text style={[styles.chipText, espacioActual === e.id && styles.chipTextActive]}>{e.nombre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Body size="sm" style={styles.formLabel}>Fecha (AAAA-MM-DD)</Body>
          <TextInput
            value={fecha}
            onChangeText={(v) => {
              setFecha(v);
              setSlots([]);
            }}
            placeholder="2026-09-20"
            placeholderTextColor="#9aa4b2"
            style={styles.input}
          />

          {!!slotsError && <Body style={styles.error}>{slotsError}</Body>}

          <TouchableOpacity style={styles.searchButton} onPress={onBuscar} disabled={loadingSlots} activeOpacity={0.85}>
            {loadingSlots ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchButtonText}>Ver horarios libres</Text>}
          </TouchableOpacity>

          {slots.length > 0 && (
            <View style={styles.slotsRow}>
              {slots.map((s) => (
                <TouchableOpacity
                  key={s.inicio}
                  style={styles.slot}
                  disabled={busy}
                  onPress={() => void onReservar(s)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.slotText}>{formatHora(s.inicio)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>
      )}

      <Heading level={3} style={styles.sectionTitle}>Mis reservas</Heading>
      {reservas.length === 0 ? (
        <Body size="sm" style={styles.empty}>Todavía no tenés reservas.</Body>
      ) : (
        <>
          {futuras.map((r) => (
            <Card key={r.id} style={styles.reservaItem}>
              <View style={{ flex: 1 }}>
                <Heading level={3} style={{ marginBottom: 2 }}>{r.espacio.nombre}</Heading>
                <Body size="sm" style={styles.reservaFecha}>{formatFechaHora(r.inicio)}</Body>
              </View>
              <TouchableOpacity onPress={() => onCancelar(r)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </Card>
          ))}
          {pasadas.length > 0 && (
            <View style={styles.historial}>
              <Body size="sm" style={styles.historialTitle}>Historial ({pasadas.length})</Body>
              {pasadas.map((r) => (
                <View key={r.id} style={styles.historialItem}>
                  <Body size="sm">{r.espacio.nombre} · {formatFechaHora(r.inicio)}</Body>
                  <Body size="sm" style={styles.historialEstado}>{r.estado}</Body>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  error: { color: '#ba1a1a', marginBottom: 8 },
  empty: { marginVertical: 12, color: '#444653' },
  formCard: { marginBottom: 16, padding: 14 },
  formLabel: { marginBottom: 6, marginTop: 8, color: '#444653' },
  chipsRow: { marginBottom: 4 },
  chip: {
    borderWidth: 1,
    borderColor: '#c4c5d5',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#00288e', borderColor: '#00288e' },
  chipText: { fontSize: 13, color: '#444653', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  input: {
    height: 44,
    borderColor: '#c4c5d5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    color: '#0b1c30',
    fontSize: 14,
  },
  searchButton: {
    height: 44,
    borderRadius: 8,
    backgroundColor: '#00288e',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  searchButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  slot: {
    borderWidth: 1,
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  slotText: { color: '#065f46', fontSize: 13, fontWeight: '600' },
  sectionTitle: { marginTop: 4 },
  reservaItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingVertical: 12 },
  reservaFecha: { color: '#444653' },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelButtonText: { color: '#ba1a1a', fontSize: 12, fontWeight: '700' },
  historial: { marginTop: 6 },
  historialTitle: { fontWeight: '700', marginBottom: 6 },
  historialItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  historialEstado: { textTransform: 'capitalize', color: '#6b7280' },
});
