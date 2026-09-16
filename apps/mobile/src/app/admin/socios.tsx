import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/theme';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

type Socio = { id: number; nombre: string; apellido: string; dni: string; email: string; estado: string; rol: string };

export default function AdminSociosScreen() {
  const { session } = useAuth();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await apiFetch<Socio[]>('/socios', {}, session.access_token);
      setSocios(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los socios');
    } finally { setLoading(false); }
  }, [session]);
  useEffect(() => { void load(); }, [load]);
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
    <View style={styles.intro}><View style={styles.icon}><Ionicons name="people-outline" size={25} color={Brand.primary} /></View><View><Text style={styles.title}>Socios</Text><Text style={styles.subtitle}>Personas y membresías del club</Text></View></View>
    {!!error && <Text style={styles.error}>{error}</Text>}
    {loading && socios.length === 0 ? <ActivityIndicator color={Brand.primary} style={styles.loader} /> : socios.length === 0 ? <View style={styles.empty}><Ionicons name="people-outline" size={28} color={Brand.primary} /><Text style={styles.emptyTitle}>No hay socios</Text><Text style={styles.emptyText}>Todavía no hay socios cargados en este club.</Text></View> : <View style={styles.list}>{socios.map((socio) => <View key={socio.id} style={styles.row}><View style={styles.avatar}><Text style={styles.avatarText}>{`${socio.nombre[0] ?? ''}${socio.apellido[0] ?? ''}`.toUpperCase()}</Text></View><View style={styles.rowText}><Text style={styles.name}>{socio.apellido}, {socio.nombre}</Text><Text style={styles.detail}>DNI {socio.dni} · {socio.email || 'Sin email'}</Text></View><Text style={styles.status}>{socio.estado}</Text></View>)}</View>}
  </ScrollView>;
}

export function AdminSection({ title, subtitle, icon, metrics }: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; metrics: string[][] }) {
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><View style={styles.intro}><View style={styles.icon}><Ionicons name={icon} size={25} color={Brand.primary} /></View><View><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View></View><View style={styles.metrics}>{metrics.map(([value, label]) => <View key={label} style={styles.metric}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>)}</View><View style={styles.empty}><Ionicons name="cloud-download-outline" size={28} color={Brand.primary} /><Text style={styles.emptyTitle}>Datos del club</Text><Text style={styles.emptyText}>Esta sección ya está preparada para conectarse con la API y mostrar información actualizada.</Text></View></ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Brand.surface }, content: { padding: 16, paddingBottom: 110 }, intro: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 }, icon: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#e5eeff', alignItems: 'center', justifyContent: 'center', marginRight: 13 }, title: { color: Brand.text, fontSize: 24, fontWeight: '700' }, subtitle: { color: Brand.muted, fontSize: 13, marginTop: 3 }, metrics: { flexDirection: 'row', gap: 8, marginBottom: 22 }, metric: { flex: 1, backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 10, padding: 12 }, value: { color: Brand.primary, fontSize: 21, fontWeight: '700' }, label: { color: Brand.muted, fontSize: 11, marginTop: 4 }, list: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 12, overflow: 'hidden' }, row: { flexDirection: 'row', alignItems: 'center', padding: 13, borderBottomColor: Brand.border, borderBottomWidth: 1 }, avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5eeff', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: Brand.primary, fontWeight: '700' }, rowText: { flex: 1, marginLeft: 11 }, name: { color: Brand.text, fontWeight: '700', fontSize: 14 }, detail: { color: Brand.muted, fontSize: 11, marginTop: 4 }, status: { color: Brand.primary, fontSize: 11, fontWeight: '700' }, loader: { marginTop: 30 }, error: { color: '#ba1a1a', marginBottom: 12 }, empty: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 12, padding: 22, alignItems: 'center', marginTop: 4 }, emptyTitle: { color: Brand.text, fontSize: 17, fontWeight: '700', marginTop: 10 }, emptyText: { color: Brand.muted, textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 7 } });
