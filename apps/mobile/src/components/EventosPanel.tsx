import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Body, Card, Heading } from '@/components/common';
import { useEventosPublicos } from '@/hooks/useEventosPublicos';
import type { EventoTipo } from '@/lib/api';

const TIPO_LABEL: Record<EventoTipo, string> = {
  seminario: 'Seminario',
  torneo: 'Torneo',
  social: 'Social',
};

const TIPO_ICON: Record<EventoTipo, keyof typeof Ionicons.glyphMap> = {
  seminario: 'school-outline',
  torneo: 'trophy-outline',
  social: 'people-outline',
};

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EventosPanel() {
  const { eventos, loading, error } = useEventosPublicos();

  if (loading && eventos.length === 0) {
    return <ActivityIndicator color="#00288e" style={{ marginVertical: 16 }} />;
  }

  return (
    <View>
      {error && <Body style={styles.error}>{error}</Body>}
      {eventos.length === 0 ? (
        <Body size="sm" style={styles.empty}>No hay eventos públicos próximos por ahora.</Body>
      ) : (
        eventos.map((ev) => (
          <Card key={ev.id} style={styles.card}>
            <View style={styles.header}>
              <View style={styles.tipoBadge}>
                <Ionicons name={TIPO_ICON[ev.tipo]} size={14} color="#00288e" />
                <Text style={styles.tipoText}>{TIPO_LABEL[ev.tipo]}</Text>
              </View>
              <Text style={styles.fecha}>{formatFecha(ev.fecha)}</Text>
            </View>
            <Heading level={3} style={styles.titulo}>{ev.titulo}</Heading>
            <Body size="sm" style={styles.club}>{ev.club.nombre}{ev.lugar ? ` · ${ev.lugar}` : ''}</Body>
            {ev.descripcion && (
              <Text style={styles.descripcion} numberOfLines={3}>{ev.descripcion}</Text>
            )}
          </Card>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  error: { color: '#ba1a1a', marginBottom: 8 },
  empty: { marginVertical: 12, color: '#444653' },
  card: { marginBottom: 10, padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e5eeff',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  tipoText: { color: '#00288e', fontSize: 11, fontWeight: '700' },
  fecha: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  titulo: { marginBottom: 4 },
  club: { color: '#444653', marginBottom: 6 },
  descripcion: { color: '#444653', fontSize: 13 },
});
