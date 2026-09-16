import { Body, Button, Card, Heading } from "@/components/common";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { AccountSwitcherModal } from "@/components/AccountSwitcherModal";
import { router } from "expo-router";
import { updateProfile } from '@/lib/api';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { session, isStaff, signOut } = useAuth();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const hasMultipleCuentas = (session?.cuentas?.length ?? 0) > 1;
  const person = session?.socio ?? session?.admin;
  const displayName = person ? `${person.nombre}${'apellido' in person && person.apellido ? ` ${person.apellido}` : ''}` : 'Usuario';
  const initials = displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(person?.nombre ?? '');
  const [lastNameDraft, setLastNameDraft] = useState(session?.socio?.apellido ?? '');
  const [saving, setSaving] = useState(false);

  const menuItems = [
    { icon: "settings-outline", label: "accountSettings" },
    { icon: "lock-closed-outline", label: "privacySecurity" },
    { icon: "help-circle-outline", label: "helpSupport" },
    { icon: "card-outline", label: "paymentMethods" },
  ];

  async function saveProfile() {
    if (!session || !nameDraft.trim()) return;
    setSaving(true);
    try {
      await updateProfile(session.access_token, session.role, { nombre: nameDraft.trim(), ...(lastNameDraft ? { apellido: lastNameDraft.trim() } : {}) });
      setEditing(false);
    } finally { setSaving(false); }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader />
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={{ paddingBottom: 100 }}
    >
      {isStaff && (
        <TouchableOpacity style={styles.adminEntry} onPress={() => router.push('/admin/' as never)} activeOpacity={0.8}>
          <View style={styles.adminIcon}><Ionicons name="shield-checkmark-outline" size={20} color="#ffffff" /></View>
          <View style={styles.adminCopy}>
            <Text style={styles.adminTitle}>Modo administración</Text>
            <Text style={styles.adminSubtitle}>Gestionar el club</Text>
          </View>
          <Text style={styles.adminArrow}>›</Text>
        </TouchableOpacity>
      )}
      {hasMultipleCuentas && (
        <TouchableOpacity style={styles.switchEntry} onPress={() => setSwitcherOpen(true)} activeOpacity={0.8}>
          <View style={styles.switchIcon}><Ionicons name="swap-horizontal-outline" size={20} color="#00288e" /></View>
          <View style={styles.adminCopy}>
            <Text style={styles.switchTitle}>Cambiar de club</Text>
            <Text style={styles.switchSubtitle}>{session?.club.nombre}</Text>
          </View>
          <Text style={styles.switchArrow}>›</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.logoutEntry} onPress={() => signOut()} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color="#ba1a1a" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
      <AccountSwitcherModal visible={switcherOpen} onClose={() => setSwitcherOpen(false)} />
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.profileContent}>
          <View style={styles.avatarLarge}>
            <Text style={styles.initials}>{initials || '?'}</Text>
          </View>
          <Heading level={2}>{displayName}</Heading>
          <Body size="sm" style={styles.memberInfo}>
            {session?.role} • {session?.club.nombre}
          </Body>
        </View>
        {editing ? <View style={{ width: '100%' }}><TextInput value={nameDraft} onChangeText={setNameDraft} placeholder="Nombre" style={styles.editInput} /><TextInput value={lastNameDraft} onChangeText={setLastNameDraft} placeholder="Apellido" style={styles.editInput} /><Button label={saving ? 'Guardando…' : 'Guardar'} variant="primary" onPress={saveProfile} /></View> : <Button label="Editar perfil" variant="primary" onPress={() => setEditing(true)} />}
      </Card>

      <TouchableOpacity style={styles.securityEntry} onPress={() => router.push('/cambiar-clave' as never)} activeOpacity={0.8}>
        <Ionicons name="lock-closed-outline" size={20} color="#00288e" />
        <Text style={styles.securityText}>Cambiar contraseña</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {/* Menu Items */}
      <View style={styles.section}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} activeOpacity={0.7}>
            <Card style={styles.menuItem}>
              <View style={styles.menuContent}>
                <Ionicons name={item.icon as any} size={20} color="#00288e" />
                <Heading level={3} style={styles.menuLabel}>
                  {t(item.label as any)}
                </Heading>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Heading level={3} style={styles.sectionTitle}>
          {t("recentNotifications")}
        </Heading>
        <Card style={styles.notificationCard}>
          <View style={styles.notifIcon}><Ionicons name="notifications-off-outline" size={24} color="#00288e" /></View>
          <View style={styles.notifContent}><Body size="sm" style={styles.notifMessage}>Las notificaciones push se habilitarán cuando esté disponible FCM.</Body></View>
        </Card>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  adminEntry: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#00288e',
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminCopy: { flex: 1, marginLeft: 12 },
  adminTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  adminSubtitle: { color: '#c9d3ff', fontSize: 12, marginTop: 3 },
  adminArrow: { color: '#ffffff', fontSize: 24, fontWeight: '300' },
  switchEntry: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTitle: { color: '#00288e', fontSize: 15, fontWeight: '700' },
  switchSubtitle: { color: '#5a6a9a', fontSize: 12, marginTop: 3 },
  switchArrow: { color: '#00288e', fontSize: 24, fontWeight: '300' },
  logoutEntry: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fdeceb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { color: '#ba1a1a', fontSize: 14, fontWeight: '700' },
  profileCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    alignItems: "center",
  },
  profileContent: {
    alignItems: "center",
    marginBottom: 16,
  },
  editInput: {
    height: 44,
    borderColor: '#c4c5d5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#1b1b21',
    marginBottom: 8,
  },
  securityEntry: {
    marginHorizontal: 16,
    marginBottom: 4,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  securityText: { flex: 1, color: '#00288e', fontSize: 14, fontWeight: '700' },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e5eeff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  initials: {
    fontSize: 32,
    fontWeight: "700",
    color: "#00288e",
  },
  memberInfo: {
    color: "#444653",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  menuContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  menuArrow: {
    fontSize: 18,
    color: "#dce9ff",
  },
  notificationCard: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  notifIcon: {
    fontSize: 24,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5eeff",
    borderRadius: 20,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  notifMessage: {
    color: "#444653",
    marginBottom: 4,
    lineHeight: 18,
  },
  notifTime: {
    color: "#cbd5e1",
  },
});
