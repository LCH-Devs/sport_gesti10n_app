import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Brand } from '@/constants/theme';

const actions = [
  { icon: 'people-outline', title: 'Socios', detail: '248 activos', color: Brand.primary },
  { icon: 'cash-outline', title: 'Cobros', detail: '$ 1.240.500 este mes', color: Brand.success },
  { icon: 'calendar-outline', title: 'Horarios', detail: '12 clases hoy', color: Brand.accent },
  { icon: 'bookmark-outline', title: 'Reservas', detail: '8 pendientes', color: '#7c3aed' },
];

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PANEL DEL CLUB</Text>
            <Text style={styles.title}>Buen día, comisión</Text>
            <Text style={styles.subtitle}>Club Atlético San Martín</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="close" size={22} color={Brand.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>RECAUDACIÓN DEL MES</Text>
            <Text style={styles.summaryAmount}>$ 1.240.500</Text>
            <Text style={styles.summaryPositive}>↑ 12,4% vs. mes anterior</Text>
          </View>
          <View style={styles.summaryIcon}><Ionicons name="trending-up" size={26} color="#fff" /></View>
        </View>

        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.grid}>
          {actions.map((action) => (
            <TouchableOpacity key={action.title} style={styles.actionCard} activeOpacity={0.8}>
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
            ['person-add-outline', 'Nuevo socio registrado', 'María López · hace 12 min'],
            ['cash-outline', 'Cobro acreditado', 'Cuota octubre · hace 35 min'],
            ['calendar-outline', 'Clase modificada', 'Fútbol infantil · hace 1 h'],
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
