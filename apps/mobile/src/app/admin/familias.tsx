import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

type Persona = { nombre: string; apellido?: string };
type Familia = { id: number; nombre: string; titular: Persona; socios: Persona[] };
export default function FamiliasScreen() {
  const { session } = useAuth(); const [items, setItems] = useState<Familia[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { if (!session) return; setLoading(true); try { setItems(await apiFetch<Familia[]>('/familias', {}, session.access_token)); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar las familias'); } finally { setLoading(false); } }, [session]);
  useEffect(() => { void load(); }, [load]);
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
    <View style={styles.intro}><View style={styles.icon}><Ionicons name="people-circle-outline" size={25} color={Brand.primary} /></View><View><Text style={styles.title}>Familias</Text><Text style={styles.subtitle}>Grupos y vínculos de socios</Text></View></View>
    {!!error && <Text style={styles.error}>{error}</Text>}
    {loading && !items.length ? <ActivityIndicator color={Brand.primary} style={styles.loader} /> : items.length ? <View style={styles.list}>{items.map((item) => <View key={item.id} style={styles.card}><Text style={styles.name}>{item.nombre}</Text><Text style={styles.detail}>Titular: {item.titular.nombre} {item.titular.apellido ?? ''}</Text><Text style={styles.count}>{item.socios.length} integrante{item.socios.length === 1 ? '' : 's'}</Text></View>)}</View> : <View style={styles.empty}><Ionicons name="people-circle-outline" size={28} color={Brand.primary} /><Text style={styles.emptyTitle}>No hay familias</Text><Text style={styles.emptyText}>Todavía no hay grupos familiares cargados.</Text></View>}
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Brand.surface }, content: { padding: 16, paddingBottom: 110 }, intro: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 }, icon: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#e5eeff', alignItems: 'center', justifyContent: 'center', marginRight: 13 }, title: { color: Brand.text, fontSize: 24, fontWeight: '700' }, subtitle: { color: Brand.muted, fontSize: 13, marginTop: 3 }, list: { gap: 10 }, card: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 12, padding: 15 }, name: { color: Brand.text, fontSize: 16, fontWeight: '700' }, detail: { color: Brand.muted, fontSize: 13, marginTop: 7 }, count: { color: Brand.primary, fontSize: 11, fontWeight: '700', marginTop: 8 }, loader: { marginTop: 30 }, error: { color: '#ba1a1a', marginBottom: 12 }, empty: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 12, padding: 22, alignItems: 'center' }, emptyTitle: { color: Brand.text, fontSize: 17, fontWeight: '700', marginTop: 10 }, emptyText: { color: Brand.muted, textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 7 } });
