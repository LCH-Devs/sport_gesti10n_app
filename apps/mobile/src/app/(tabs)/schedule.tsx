import { Body, Card, Heading } from "@/components/common";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useSocioPortal } from "@/hooks/useSocioPortal";
import { ReservasPanel } from "@/components/ReservasPanel";
import { EventosPanel } from "@/components/EventosPanel";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

export default function ScheduleScreen() {
  const { isStaff } = useAuth();
  const { portal, loading, error, reload } = useSocioPortal();
  const [activeTab, setActiveTab] = useState<"actividades" | "noticias" | "reservas" | "eventos">("actividades");

  if (isStaff) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader />
        <View style={styles.center}>
          <Body>Esta vista es para socios. Entrá en modo administración para ver la operación del club.</Body>
        </View>
      </View>
    );
  }

  const actividades = portal?.actividades ?? [];
  const noticias = portal?.noticias ?? [];

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
      >
        <View style={styles.mainCard}>
          <View style={styles.tabHeader}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "actividades" && styles.tabActive]}
              onPress={() => setActiveTab("actividades")}
            >
              <Text style={[styles.tabLabel, activeTab === "actividades" && styles.tabLabelActive]}>
                Actividades
              </Text>
              {activeTab === "actividades" && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "noticias" && styles.tabActive]}
              onPress={() => setActiveTab("noticias")}
            >
              <Text style={[styles.tabLabel, activeTab === "noticias" && styles.tabLabelActive]}>
                Noticias
              </Text>
              {activeTab === "noticias" && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "eventos" && styles.tabActive]}
              onPress={() => setActiveTab("eventos")}
            >
              <Text style={[styles.tabLabel, activeTab === "eventos" && styles.tabLabelActive]}>
                Eventos
              </Text>
              {activeTab === "eventos" && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "reservas" && styles.tabActive]}
              onPress={() => setActiveTab("reservas")}
            >
              <Text style={[styles.tabLabel, activeTab === "reservas" && styles.tabLabelActive]}>
                Reservas
              </Text>
              {activeTab === "reservas" && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>

          <View style={styles.cardContent}>
            {error && <Body style={styles.error}>{error}</Body>}

            {activeTab === "actividades" ? (
              loading && actividades.length === 0 ? (
                <ActivityIndicator color="#00288e" style={{ marginVertical: 16 }} />
              ) : actividades.length === 0 ? (
                <Body size="sm" style={styles.empty}>Todavía no estás inscripto en ninguna actividad.</Body>
              ) : (
                <View style={styles.section}>
                  {actividades.map((a) => (
                    <Card key={a.id} style={styles.activityItem}>
                      <Heading level={3} style={{ marginBottom: 0 }}>{a.nombre}</Heading>
                    </Card>
                  ))}
                </View>
              )
            ) : activeTab === "noticias" ? (
              loading && noticias.length === 0 ? (
                <ActivityIndicator color="#00288e" style={{ marginVertical: 16 }} />
              ) : noticias.length === 0 ? (
                <Body size="sm" style={styles.empty}>El club todavía no publicó noticias.</Body>
              ) : (
                <View style={styles.section}>
                  {noticias.map((n) => (
                    <Card key={n.id} style={styles.eventCard}>
                      <Text style={styles.eventDate}>{formatFecha(n.fecha)}</Text>
                      <Heading level={3} style={styles.eventTitle}>{n.titulo}</Heading>
                      <Text style={styles.eventDesc} numberOfLines={3}>
                        {n.cuerpo}
                      </Text>
                    </Card>
                  ))}
                </View>
              )
            ) : activeTab === "eventos" ? (
              <EventosPanel />
            ) : (
              <ReservasPanel />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9ff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  mainCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderColor: "#dce9ff",
    borderWidth: 1,
    overflow: "hidden",
  },
  tabHeader: { flexDirection: "row", borderBottomColor: "#e5eeff", borderBottomWidth: 1 },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRightColor: "#e5eeff",
    borderRightWidth: 1,
    backgroundColor: "#e8ecf5",
  },
  tabActive: { backgroundColor: "#ffffff" },
  tabLabel: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  tabLabelActive: { color: "#00288e" },
  tabIndicator: { position: "absolute", bottom: -1.5, left: 0, right: 0, height: 3, backgroundColor: "#ffffff" },
  cardContent: { paddingHorizontal: 16, paddingVertical: 12 },
  section: { paddingVertical: 4 },
  error: { color: "#ba1a1a", marginBottom: 8 },
  empty: { marginVertical: 12, color: "#444653" },
  activityItem: { marginBottom: 8, paddingVertical: 14 },
  eventCard: {
    backgroundColor: "#f8f9ff",
    borderColor: "#e5eeff",
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  eventDate: { color: "#00288e", fontSize: 12, fontWeight: "700", marginBottom: 4, textTransform: "uppercase" },
  eventTitle: { marginBottom: 6 },
  eventDesc: { color: "#444653" },
});
