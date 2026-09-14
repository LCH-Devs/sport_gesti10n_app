import { useLanguage } from "@/context/LanguageContext";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useSocioPortal } from "@/hooks/useSocioPortal";
import { Body } from "@/components/common";

function initialsOf(nombre?: string, apellido?: string) {
  const a = nombre?.[0] ?? "";
  const b = apellido?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export default function HomeScreen() {
  const { t } = useLanguage();
  const { session, isStaff } = useAuth();
  const { portal, loading, error, reload } = useSocioPortal();
  const member = session?.socio;

  if (isStaff) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader />
        <View style={styles.centerStaff}>
          <Body>Entrá en "Modo administración" desde tu perfil para gestionar el club.</Body>
        </View>
      </View>
    );
  }

  const actividades = portal?.actividades ?? [];
  const noticias = portal?.noticias ?? [];
  const proximaNoticia = noticias[0];

  const quickActions = [
    { icon: "calendar-outline", label: "Mis actividades", onPress: () => router.push('/(tabs)/schedule' as never) },
    { icon: "document-text-outline", label: "Noticias del club", onPress: () => router.push('/(tabs)/schedule' as never) },
    { icon: "card-outline", label: "Mis cuotas", onPress: () => router.push('/(tabs)/payments' as never) },
    { icon: "person-outline", label: "Mi perfil", onPress: () => router.push('/(tabs)/profile' as never) },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader />
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
      >
        {error && (
          <View style={styles.section}>
            <Body style={styles.error}>{error}</Body>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.cardBackground} />
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t("memberId")}</Text>
              <Text style={styles.badge}>{member?.estado || "—"}</Text>
            </View>
            <Text style={styles.idText}>DNI: {member?.dni ?? "—"}</Text>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.initials}>{initialsOf(member?.nombre, member?.apellido)}</Text>
            </View>
            <Text style={styles.name}>{member ? `${member.nombre} ${member.apellido}` : "Socio"}</Text>
            <Text style={styles.membership}>{session?.club.nombre ?? t("clubConnect")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis actividades</Text>
          {loading && actividades.length === 0 ? (
            <ActivityIndicator color="#00288e" />
          ) : actividades.length === 0 ? (
            <Body size="sm" style={styles.emptyText}>Todavía no estás inscripto en ninguna actividad.</Body>
          ) : (
            actividades.slice(0, 3).map((a) => (
              <View key={a.id} style={styles.activityCard}>
                <View style={styles.dateBox}>
                  <Ionicons name="basketball-outline" size={22} color="#ffffff" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{a.nombre}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {proximaNoticia && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Última noticia</Text>
            <TouchableOpacity
              style={styles.newsCard}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/schedule' as never)}
            >
              <Text style={styles.newsTitle}>{proximaNoticia.titulo}</Text>
              <Text style={styles.newsBody} numberOfLines={2}>{proximaNoticia.cuerpo}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("quickActions")}</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} icon={action.icon} label={action.label} onPress={action.onPress} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function QuickActionCard({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={28} color="#00288e" />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  centerStaff: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: "#ba1a1a" },
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
  emptyText: { color: "#444653" },
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
    textTransform: "capitalize",
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
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderColor: "#dce9ff",
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  dateBox: {
    width: 44,
    height: 44,
    backgroundColor: "#00288e",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0b1c30",
  },
  newsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderColor: "#dce9ff",
    borderWidth: 1,
    padding: 14,
  },
  newsTitle: { fontSize: 15, fontWeight: "700", color: "#0b1c30", marginBottom: 4 },
  newsBody: { fontSize: 13, color: "#444653" },
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
