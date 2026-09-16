import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

type Usuario = { id: number; nombre: string; email: string; rol: string; estado?: string };
export default function UsuariosScreen() {
  const { session } = useAuth(); const [items, setItems] = useState<Usuario[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { if (!session) return; setLoading(true); try { setItems(await apiFetch<Usuario[]>('/admins', {}, session.access_token)); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios'); } finally { setLoading(false); } }, [session]);
  useEffect(() => { void load(); }, [load]);
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
    <View style={styles.intro}><View style={styles.icon}><Ionicons name="person-add-outline" size={25} color={Brand.primary} /></View><View><Text style={styles.title}>Usuarios</Text><Text style={styles.subtitle}>Permisos del equipo</Text></View></View>
    {!!error && <Text style={styles.error}>{error}</Text>}
    {loading && !items.length ? <ActivityIndicator color={Brand.primary} style={styles.loader} /> : items.length ? <View style={styles.list}>{items.map((item) => <View key={item.id} style={styles.row}><View style={styles.avatar}><Text style={styles.avatarText}>{item.nombre[0]?.toUpperCase() ?? '?'}</Text></View><View style={styles.rowText}><Text style={styles.name}>{item.nombre}</Text><Text style={styles.detail}>{item.email}</Text></View><Text style={styles.status}>{item.rol}</Text></View>)}</View> : <View style={styles.empty}><Ionicons name="people-outline" size={28} color={Brand.primary} /><Text style={styles.emptyTitle}>No hay usuarios</Text><Text style={styles.emptyText}>No hay personal cargado en este club.</Text></View>}
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Brand.surface }, content: { padding: 16, paddingBottom: 110 }, intro: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 }, icon: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#e5eeff', alignItems: 'center', justifyContent: 'center', marginRight: 13 }, title: { color: Brand.text, fontSize: 24, fontWeight: '700' }, subtitle: { color: Brand.muted, fontSize: 13, marginTop: 3 }, list: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 12, overflow: 'hidden' }, row: { flexDirection: 'row', alignItems: 'center', padding: 13, borderBottomColor: Brand.border, borderBottomWidth: 1 }, avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5eeff', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: Brand.primary, fontWeight: '700' }, rowText: { flex: 1, marginLeft: 11 }, name: { color: Brand.text, fontWeight: '700', fontSize: 14 }, detail: { color: Brand.muted, fontSize: 11, marginTop: 4 }, status: { color: Brand.primary, fontSize: 11, fontWeight: '700' }, loader: { marginTop: 30 }, error: { color: '#ba1a1a', marginBottom: 12 }, empty: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 12, padding: 22, alignItems: 'center' }, emptyTitle: { color: Brand.text, fontSize: 17, fontWeight: '700', marginTop: 10 }, emptyText: { color: Brand.muted, textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 7 } });
