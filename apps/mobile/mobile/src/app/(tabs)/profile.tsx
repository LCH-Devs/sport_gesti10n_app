import { Body, Button, Card, Heading } from "@/components/common";
import { ScreenHeader } from "@/components/ScreenHeader";
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

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
