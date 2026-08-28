import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Brand } from '@/constants/theme';

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const go = (path: string) => { setDrawerOpen(false); router.push(path as never); };

  return (
    <>
      <Tabs screenOptions={{ headerShown: true, header: () => (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Administración</Text>
          <TouchableOpacity style={styles.moreButton} onPress={() => setDrawerOpen(true)}>
            <Ionicons name="menu-outline" size={23} color={Brand.primary} />
          </TouchableOpacity>
        </View>
      ), tabBarActiveTintColor: Brand.primary, tabBarInactiveTintColor: '#9aa4b2', tabBarStyle: styles.tabBar, tabBarLabelStyle: styles.tabLabel }}>
        <Tabs.Screen name="index" options={{ title: 'Panel', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="socios" options={{ title: 'Socios', tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="operacion" options={{ title: 'Operación', tabBarIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} /> }} />
        <Tabs.Screen name="finanzas" options={{ title: 'Finanzas', tabBarIcon: ({ color, size }) => <Ionicons name="cash-outline" size={size} color={color} /> }} />
      </Tabs>
      <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setDrawerOpen(false)}>
          <Pressable style={styles.drawer} onPress={(event) => event.stopPropagation()}>
            <View style={styles.drawerHeader}><Text style={styles.drawerTitle}>Más secciones</Text><TouchableOpacity onPress={() => setDrawerOpen(false)}><Ionicons name="close" size={22} color={Brand.muted} /></TouchableOpacity></View>
            <Text style={styles.group}>OPERACIÓN</Text>
            <DrawerItem icon="business-outline" label="Espacios" onPress={() => go('/admin/espacios')} />
            <DrawerItem icon="newspaper-outline" label="Noticias" onPress={() => go('/admin/noticias')} />
            <Text style={styles.group}>ADMINISTRACIÓN</Text>
            <DrawerItem icon="people-circle-outline" label="Familias" onPress={() => go('/admin/familias')} />
            <DrawerItem icon="person-add-outline" label="Usuarios" onPress={() => go('/admin/usuarios')} />
            <DrawerItem icon="settings-outline" label="Configuración" onPress={() => go('/admin/configuracion')} />
            <TouchableOpacity style={styles.exit} onPress={() => { setDrawerOpen(false); router.replace('/(tabs)' as never); }}><Ionicons name="swap-horizontal-outline" size={19} color={Brand.primary} /><Text style={styles.exitText}>Volver al modo socio</Text></TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function DrawerItem({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return <TouchableOpacity style={styles.drawerItem} onPress={onPress}><Ionicons name={icon} size={21} color={Brand.primary} /><Text style={styles.drawerLabel}>{label}</Text><Ionicons name="chevron-forward" size={18} color="#9aa4b2" /></TouchableOpacity>;
}

const styles = StyleSheet.create({
  header: { height: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Brand.surface, borderBottomWidth: 1, borderBottomColor: Brand.border },
  headerTitle: { color: Brand.text, fontSize: 20, fontWeight: '700' },
  moreButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5eeff', alignItems: 'center', justifyContent: 'center' },
  tabBar: { position: 'absolute', marginHorizontal: 12, bottom: 12, borderRadius: 22, height: 68, paddingTop: 6, paddingBottom: 6, borderTopWidth: 0, borderWidth: 1, borderColor: Brand.border, backgroundColor: '#fff', elevation: 8 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
  scrim: { flex: 1, backgroundColor: '#0b1c3066', justifyContent: 'flex-start', alignItems: 'flex-end' },
  drawer: { width: '86%', maxWidth: 360, height: '100%', backgroundColor: Brand.surface, paddingHorizontal: 20, paddingTop: 58 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: Brand.border },
  drawerTitle: { color: Brand.text, fontSize: 22, fontWeight: '700' },
  group: { color: Brand.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 24, marginBottom: 8 },
  drawerItem: { minHeight: 50, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Brand.border },
  drawerLabel: { flex: 1, color: Brand.text, fontSize: 15, fontWeight: '600', marginLeft: 12 },
  exit: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto', marginBottom: 28, padding: 14, borderRadius: 10, backgroundColor: '#e5eeff' },
  exitText: { color: Brand.primary, fontSize: 14, fontWeight: '700', marginLeft: 10 },
});
