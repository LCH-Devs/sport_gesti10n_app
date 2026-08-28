import { useLanguage } from "@/context/LanguageContext";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { session } = useAuth();
  const member = session?.socio;

  const quickActions = [
    { icon: "time-outline", label: "history" },
    { icon: "document-text-outline", label: "news" },
    { icon: "calendar-outline", label: "events" },
    { icon: "chatbubble-ellipses-outline", label: "support" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader />
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={{ paddingBottom: 100 }}
      >

      <View style={styles.section}>
        <View style={styles.cardBackground} />
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t("memberId")}</Text>
            <Text style={styles.badge}>{t("active")}</Text>
          </View>
          <Text style={styles.idText}>ID: 9842-109X</Text>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initials}>AM</Text>
          </View>
          <Text style={styles.name}>{member ? `${member.nombre} ${member.apellido}` : 'Socio'}</Text>
          <Text style={styles.membership}>{session?.club.nombre ?? t("clubConnect")}</Text>
          <View style={styles.barcodeContainer}>
            <Text style={styles.barcode}>|||||||||||||||||||</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("nextActivity")}</Text>
        <View style={styles.activityCard}>
          <View style={styles.dateBox}>
            <Text style={styles.dateMonth}>OCT</Text>
            <Text style={styles.dateDay}>24</Text>
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Tennis Practice</Text>
            <Text style={styles.activityTime}>🕐 5:00 PM - 6:30 PM</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("quickActions")}</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={index}
              icon={action.icon}
              label={t(action.label as keyof typeof t)}
            />
          ))}
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

function QuickActionCard({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.quickCard}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={28} color="#00288e" />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0b1c30",
    marginBottom: 12,
  },
  cardBackground: {
    marginLeft: 1,
    width: "99.5%",
    height: 20,
    backgroundColor: "#00288e",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: -13,
    zIndex: 1,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderColor: "#dce9ff",
    borderWidth: 1,
    padding: 16,
    zIndex: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00288e",
  },
  badge: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "600",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  idText: {
    color: "#444653",
    marginBottom: 16,
    fontSize: 14,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e5eeff",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  initials: {
    fontSize: 32,
    fontWeight: "700",
    color: "#00288e",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0b1c30",
    textAlign: "center",
    marginBottom: 4,
  },
  membership: {
    fontSize: 14,
    color: "#444653",
    textAlign: "center",
    marginBottom: 16,
  },
  barcodeContainer: {
    backgroundColor: "#e5eeff",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  barcode: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0b1c30",
    letterSpacing: 2,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderColor: "#dce9ff",
    borderWidth: 1,
    padding: 12,
  },
  dateBox: {
    width: 60,
    height: 60,
    backgroundColor: "#00288e",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dateMonth: {
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "600",
  },
  dateDay: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0b1c30",
  },
  activityTime: {
    fontSize: 14,
    color: "#444653",
    marginTop: 4,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderColor: "#dce9ff",
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e5eeff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0b1c30",
    textAlign: "center",
  },
});
