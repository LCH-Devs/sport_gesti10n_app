import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand } from '@/constants/theme';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import type { NotificacionItem } from '@/lib/api';

function timeAgo(iso: string) {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return `hace ${diffD} d`;
}

export default function NotificacionesScreen() {
  const insets = useSafeAreaInsets();
  const { notificaciones, loading, unreadCount, reload, marcarLeida, marcarTodasLeidas } = useNotificaciones();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Brand.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={() => void marcarTodasLeidas()}>
            <Text style={styles.markAll}>Marcar todas</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
      >
        {loading && notificaciones.length === 0 ? (
          <ActivityIndicator color={Brand.primary} style={{ marginTop: 30 }} />
        ) : notificaciones.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={28} color={Brand.primary} />
            <Text style={styles.emptyTitle}>No tenés notificaciones</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notificaciones.map((n: NotificacionItem) => (
              <TouchableOpacity
                key={n.id}
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => !n.leido && void marcarLeida(n.id)}
              >
                <View style={[styles.dot, !n.leido && styles.dotUnread]} />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{n.titulo}</Text>
                  <Text style={styles.rowMessage}>{n.mensaje}</Text>
                  <Text style={styles.rowTime}>{timeAgo(n.created_at)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomColor: Brand.border,
    borderBottomWidth: 1,
  },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e5eeff', alignItems: 'center', justifyContent: 'center' },
  title: { color: Brand.text, fontSize: 17, fontWeight: '700' },
  markAll: { color: Brand.primary, fontSize: 13, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 60 },
  empty: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 12, padding: 22, alignItems: 'center', marginTop: 20 },
  emptyTitle: { color: Brand.text, fontSize: 15, fontWeight: '600', marginTop: 10 },
  list: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', padding: 14, borderBottomColor: Brand.border, borderBottomWidth: 1, gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: 'transparent' },
  dotUnread: { backgroundColor: Brand.primary },
  rowText: { flex: 1 },
  rowTitle: { color: Brand.text, fontSize: 14, fontWeight: '700' },
  rowMessage: { color: Brand.muted, fontSize: 13, marginTop: 3 },
  rowTime: { color: Brand.muted, fontSize: 11, marginTop: 6 },
});
