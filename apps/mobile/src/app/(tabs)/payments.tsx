import { Badge, Body, Card, Heading } from "@/components/common";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useSocioPortal } from "@/hooks/useSocioPortal";
import type { Pago } from "@/lib/api";

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  cancelado: "Cancelado",
  rechazado: "Rechazado",
  reembolsado: "Reembolsado",
};

const ESTADO_VARIANT: Record<string, "success" | "warning" | "error" | "info"> = {
  pendiente: "warning",
  pagado: "success",
  cancelado: "info",
  rechazado: "error",
  reembolsado: "info",
};

function formatMes(mes: string) {
  return new Date(mes).toLocaleDateString("es-AR", { year: "numeric", month: "long" });
}

function formatMonto(monto: number) {
  return `$${monto.toLocaleString("es-AR")}`;
}

export default function PaymentsScreen() {
  const { session, isStaff } = useAuth();
  const { portal, loading, error, reload } = useSocioPortal();

  if (isStaff) {
    return (
      <View style={{ flex: 1 }}>
        <ScreenHeader />
        <View style={styles.center}>
          <Body>Esta vista es para socios. Entrá en modo administración para ver las finanzas del club.</Body>
        </View>
      </View>
    );
  }

  const pagos: Pago[] = portal?.pagos ?? [];
  const pendientes = pagos.filter((p) => p.estado === "pendiente");
  const totalPendiente = pendientes.reduce((acc, p) => acc + p.monto, 0);

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
      >
        <Card style={styles.clubCard}>
          <View style={styles.clubIconBig}>
            <Ionicons name="barbell" size={48} color="#00288e" />
          </View>
          <Heading level={2} style={styles.clubName}>{session?.club.nombre}</Heading>
        </Card>

        {error ? (
          <Card style={styles.errorCard}><Body>{error}</Body></Card>
        ) : (
          <Card style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Heading level={3}>Saldo pendiente</Heading>
              {pendientes.length > 0 && <Badge label={String(pendientes.length)} variant="error" />}
            </View>
            <Heading level={1} style={styles.amount}>{formatMonto(totalPendiente)}</Heading>
            <Body size="sm" style={styles.dueDate}>
              {pendientes.length === 0 ? "No tenés cuotas pendientes" : `${pendientes.length} cuota(s) sin pagar`}
            </Body>
          </Card>
        )}

        <View style={styles.section}>
          <Heading level={3}>Mis cuotas</Heading>
          {loading && pagos.length === 0 ? (
            <ActivityIndicator color="#00288e" style={{ marginTop: 12 }} />
          ) : pagos.length === 0 ? (
            <Body size="sm" style={styles.empty}>Todavía no hay cuotas registradas.</Body>
          ) : (
            pagos.map((p) => (
              <Card key={p.id} style={styles.transactionItem}>
                <View style={styles.txHeader}>
                  <Text style={styles.txDate}>{formatMes(p.mes)}</Text>
                  <Body style={styles.txAmount}>{formatMonto(p.monto)}</Body>
                </View>
                <Heading level={3} style={styles.txDescription}>
                  {p.concepto || (p.tipo === "inscripcion" ? "Inscripción" : "Cuota")}
                </Heading>
                {p.fecha_pago && (
                  <Body size="sm" style={styles.txMethod}>
                    Pagada el {new Date(p.fecha_pago).toLocaleDateString("es-AR")}
                  </Body>
                )}
                <Badge label={ESTADO_LABEL[p.estado] || p.estado} variant={ESTADO_VARIANT[p.estado] || "info"} />
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9ff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  clubCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    alignItems: "center",
    paddingVertical: 24,
  },
  clubIconBig: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e5eeff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  clubName: { marginBottom: 0, textAlign: "center" },
  errorCard: { marginHorizontal: 16, marginVertical: 12, backgroundColor: "#fee2e2" },
  balanceCard: { marginHorizontal: 16, marginVertical: 12 },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  amount: { color: "#00288e", marginBottom: 8 },
  dueDate: { color: "#444653" },
  section: { paddingHorizontal: 16, paddingVertical: 12 },
  empty: { marginTop: 8, color: "#444653" },
  transactionItem: { marginBottom: 8 },
  txHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  txDate: {
    backgroundColor: "#e5eeff",
    color: "#00288e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  txAmount: { fontWeight: "600", color: "#00288e" },
  txDescription: { fontSize: 16, marginBottom: 4 },
  txMethod: { color: "#444653", marginBottom: 8 },
});
