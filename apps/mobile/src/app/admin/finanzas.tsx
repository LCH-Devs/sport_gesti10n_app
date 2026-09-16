import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

type Resumen = { mes: string; total: number; cantidad_pagados: number; cantidad_pendientes: number; monto_pagado: number; monto_pendiente: number };
function mesActual() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }

export default function FinanzasScreen() {
  const { session } = useAuth();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try { setResumen(await apiFetch<Resumen>(`/pagos/resumen?mes=${mesActual()}`, {}, session.access_token)); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo cargar el resumen de pagos'); }
    finally { setLoading(false); }
  }, [session]);
  useEffect(() => { void load(); }, [load]);
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
    <View style={styles.intro}><View style={styles.icon}><Ionicons name="cash-outline" size={25} color={Brand.primary} /></View><View><Text style={styles.title}>Finanzas</Text><Text style={styles.subtitle}>Resumen de pagos del mes</Text></View></View>
    {!!error && <Text style={styles.error}>{error}</Text>}
    {loading && !resumen ? <ActivityIndicator color={Brand.primary} style={styles.loader} /> : resumen ? <><Text style={styles.month}>{resumen.mes}</Text><View style={styles.grid}><Metric value={String(resumen.total)} label="Pagos" /><Metric value={String(resumen.cantidad_pagados)} label="Pagados" /><Metric value={String(resumen.cantidad_pendientes)} label="Pendientes" /></View><View style={styles.amounts}><Amount label="Monto cobrado" value={resumen.monto_pagado} /><Amount label="Monto pendiente" value={resumen.monto_pendiente} /></View></> : <View style={styles.empty}><Ionicons name="cash-outline" size={28} color={Brand.primary} /><Text style={styles.emptyTitle}>Sin datos</Text><Text style={styles.emptyText}>No hay resumen de pagos disponible para este mes.</Text></View>}
  </ScrollView>;
}
function Metric({ value, label }: { value: string; label: string }) { return <View style={styles.metric}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>; }
function Amount({ label, value }: { label: string; value: number }) { return <View style={styles.amount}><Text style={styles.label}>{label}</Text><Text style={styles.amountValue}>${value.toLocaleString('es-AR')}</Text></View>; }
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Brand.surface }, content: { padding: 16, paddingBottom: 110 }, intro: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 }, icon: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#e5eeff', alignItems: 'center', justifyContent: 'center', marginRight: 13 }, title: { color: Brand.text, fontSize: 24, fontWeight: '700' }, subtitle: { color: Brand.muted, fontSize: 13, marginTop: 3 }, month: { color: Brand.muted, fontSize: 13, marginBottom: 10 }, grid: { flexDirection: 'row', gap: 8, marginBottom: 14 }, metric: { flex: 1, backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 10, padding: 12 }, value: { color: Brand.primary, fontSize: 21, fontWeight: '700' }, label: { color: Brand.muted, fontSize: 11, marginTop: 4 }, amounts: { gap: 10 }, amount: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 10, padding: 15 }, amountValue: { color: Brand.text, fontSize: 22, fontWeight: '700', marginTop: 5 }, loader: { marginTop: 30 }, error: { color: '#ba1a1a', marginBottom: 12 }, empty: { backgroundColor: '#fff', borderColor: Brand.border, borderWidth: 1, borderRadius: 12, padding: 22, alignItems: 'center' }, emptyTitle: { color: Brand.text, fontSize: 17, fontWeight: '700', marginTop: 10 }, emptyText: { color: Brand.muted, textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 7 } });
