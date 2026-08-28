import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/theme';

export default function AdminSociosScreen() {
  return <AdminSection title="Socios" subtitle="Personas y membresías del club" icon="people-outline" metrics={[['248', 'Socios activos'], ['12', 'Altas este mes'], ['7', 'Con deuda']]} />;
}

export function AdminSection({ title, subtitle, icon, metrics }: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; metrics: string[][] }) {
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><View style={styles.intro}><View style={styles.icon}><Ionicons name={icon} size={25} color={Brand.primary} /></View><View><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View></View><View style={styles.metrics}>{metrics.map(([value, label]) => <View key={label} style={styles.metric}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>)}</View><View style={styles.empty}><Ionicons name="cloud-download-outline" size={28} color={Brand.primary} /><Text style={styles.emptyTitle}>Datos del club</Text><Text style={styles.emptyText}>Esta sección ya está preparada para conectarse con la API y mostrar información actualizada.</Text></View></ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Brand.surface }, content: { padding: 16, paddingBottom: 110 }, intro: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 }, icon: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#e5eeff', alignItems: 'center', justifyContent: 'center', marginRight: 13 }, title: { color: Brand.text, fontSize: 24, fontWeight: '700' }, subtitle: { color: Brand.muted, fontSize: 13, marginTop: 3 }, metrics: { flexDirection: 'row', gap: 8, marginBottom: 22 }, metric: { flex: 1, backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 10, padding: 12 }, value: { color: Brand.primary, fontSize: 21, fontWeight: '700' }, label: { color: Brand.muted, fontSize: 11, marginTop: 4 }, empty: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 12, padding: 22, alignItems: 'center', marginTop: 4 }, emptyTitle: { color: Brand.text, fontSize: 17, fontWeight: '700', marginTop: 10 }, emptyText: { color: Brand.muted, textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 7 } });
