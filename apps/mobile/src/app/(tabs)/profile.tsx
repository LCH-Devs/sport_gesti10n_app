import { Body, Button, Card, Heading } from "@/components/common";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { AccountSwitcherModal } from "@/components/AccountSwitcherModal";
import { router } from "expo-router";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { session, isStaff, signOut } = useAuth();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const hasMultipleCuentas = (session?.cuentas?.length ?? 0) > 1;

  const menuItems = [
    { icon: "settings-outline", label: "accountSettings" },
    { icon: "lock-closed-outline", label: "privacySecurity" },
    { icon: "help-circle-outline", label: "helpSupport" },
    { icon: "card-outline", label: "paymentMethods" },
  ];

  const notifications = [
    {
      icon: "calendar-outline",
      title: "newClassSchedule",
      message: "classScheduleMessage",
      time: "2h ago",
    },
    {
      icon: "checkmark-circle-outline",
      title: "paymentConfirmed",
      message: "paymentConfirmedMessage",
      time: "1d ago",
    },
    {
      icon: "information-circle-outline",
      title: "facilityMaintenance",
      message: "maintenanceMessage",
      time: "3d ago",
    },
  ];

  const ButtonPress = () => {
    console.log("Edit Profile button pressed!");
  };

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
            <Text style={styles.initials}>AJ</Text>
          </View>
          <Heading level={2}>Alex Johnson</Heading>
          <Body size="sm" style={styles.memberInfo}>
            {t("premiumMember")} • ID: CC-9824
          </Body>
        </View>
        <Button label={t("editProfile")} variant="primary" onPress={ButtonPress} />
      </Card>

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
        {notifications.map((notif, index) => (
          <Card key={index} style={styles.notificationCard}>
            <View style={styles.notifIcon}>
              <Ionicons name={notif.icon as any} size={24} color="#00288e" />
            </View>
            <View style={styles.notifContent}>
              <Heading level={3} style={styles.notifTitle}>
                {t(notif.title as any)}
              </Heading>
              <Body size="sm" style={styles.notifMessage}>
                {t(notif.message as any)}
              </Body>
              <Body size="sm" style={styles.notifTime}>
                {notif.time}
              </Body>
            </View>
          </Card>
        ))}
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
