import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useNotificaciones } from '@/hooks/useNotificaciones';

const actions = [
  { icon: 'people-outline', title: 'Socios', detail: 'Abrir gestión', route: '/admin/socios', color: Brand.primary },
  { icon: 'cash-outline', title: 'Cobros', detail: 'Abrir gestión', route: '/admin/finanzas', color: Brand.success },
  { icon: 'calendar-outline', title: 'Horarios', detail: 'Abrir gestión', route: '/admin/operacion', color: Brand.accent },
  { icon: 'bookmark-outline', title: 'Reservas', detail: 'Abrir gestión', route: '/admin/espacios', color: '#7c3aed' },
];

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { unreadCount } = useNotificaciones();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PANEL DEL CLUB</Text>
            <Text style={styles.title}>{session?.club.nombre ?? 'Administración'}</Text>
            <Text style={styles.subtitle}>Accesos rápidos para la operación del club.</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.push('/notificaciones' as never)}>
              <Ionicons name="notifications-outline" size={20} color={Brand.primary} />
              {unreadCount > 0 && <View style={styles.notifBadge} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.replace('/(tabs)')}>
              <Ionicons name="close" size={22} color={Brand.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>CLUB ACTIVO</Text>
            <Text style={styles.summaryAmount}>{session?.club.slug ?? '—'}</Text>
            <Text style={styles.summaryPositive}>Rol actual: {session?.role ?? '—'}</Text>
          </View>
          <View style={styles.summaryIcon}><Ionicons name="trending-up" size={26} color="#fff" /></View>
        </View>

        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.grid}>
          {actions.map((action) => (
            <TouchableOpacity key={action.title} style={styles.actionCard} activeOpacity={0.8} onPress={() => router.push(action.route as never)}>
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}18` }]}>
                <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={24} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDetail}>{action.detail}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        <View style={styles.activityCard}>
          {[
            ['business-outline', 'Configuración del club', session?.club.onboarding_completo ? 'Onboarding completo' : 'Pendiente'],
            ['shield-checkmark-outline', 'Sesión actual', session?.role ?? '—'],
            ['information-circle-outline', 'Operación', 'Métricas reales próximamente'],
          ].map(([icon, title, detail]) => (
            <View key={title} style={styles.activityRow}>
              <View style={styles.activityIcon}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={Brand.primary} /></View>
              <View style={styles.activityText}><Text style={styles.activityTitle}>{title}</Text><Text style={styles.activityDetail}>{detail}</Text></View>
              <Ionicons name="chevron-forward" size={18} color="#9aa4b2" />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.surface },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  eyebrow: { color: Brand.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
  title: { color: Brand.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: Brand.muted, fontSize: 14, marginTop: 4 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5eeff', alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#e11d48' },
  summaryCard: { backgroundColor: Brand.primary, borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  summaryLabel: { color: '#a8b8ff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  summaryAmount: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 8 },
  summaryPositive: { color: '#c9d3ff', fontSize: 13, marginTop: 6 },
  summaryIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: Brand.text, fontSize: 17, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  actionCard: { width: '48%', backgroundColor: Brand.card, borderColor: Brand.border, borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  actionTitle: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  actionDetail: { color: Brand.muted, fontSize: 12, marginTop: 5 },
  activityCard: { backgroundColor: Brand.card, borderColor: Brand.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomColor: Brand.border, borderBottomWidth: 1 },
  activityIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e5eeff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activityText: { flex: 1 },
  activityTitle: { color: Brand.text, fontSize: 14, fontWeight: '600' },
  activityDetail: { color: Brand.muted, fontSize: 12, marginTop: 3 },
});
