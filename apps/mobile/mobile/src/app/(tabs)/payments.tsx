import { Badge, Body, Button, Card, Heading } from "@/components/common";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "@/context/LanguageContext";

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const transactions = [
    {
      date: "Sep 01",
      description: t("monthlyMembership"),
      amount: "$150.00",
      status: "PAID",
      method: "Visa ending in 4242",
    },
    {
      date: "Aug 15",
      description: t("personalTrainingSession"),
      amount: "$75.00",
      status: "PAID",
      method: "Apple Pay",
    },
    {
      date: "Aug 01",
      description: t("monthlyMembership"),
      amount: "$150.00",
      status: "PAID",
      method: "Visa ending in 4242",
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader />
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Club Info */}
      <Card style={styles.clubCard}>
        <View style={styles.clubIconBig}>
          <Ionicons name="barbell" size={48} color="#00288e" />
        </View>
        <Heading level={2} style={styles.clubName}>{t("eliteFitnessCenter")}</Heading>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={18} color="#444653" />
          <Body size="sm" style={styles.address}>
            123 Wellness Blvd, Fit City, FC 90210
          </Body>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call" size={18} color="#444653" />
          <Body size="sm" style={styles.address}>
            (555) 123-4567
          </Body>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={18} color="#444653" />
          <Body size="sm" style={styles.address}>
            contact@elitefitness.com
          </Body>
        </View>
      </Card>

      {/* Outstanding Balance */}
      <Card style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Heading level={3}>{t("outstandingBalance")}</Heading>
          <Badge label="!" variant="error" />
        </View>
        <Heading level={1} style={styles.amount}>
          $150.00
        </Heading>
        <Body size="sm" style={styles.dueDate}>
          Due by Oct 15, 2023
        </Body>
        <Button
          label={t("payNow")}
          variant="primary"
          onPress={() => console.log("Pay Now pressed!")}
        />
      </Card>

      {/* Payment Button */}
      <View style={styles.paymentButton}>
        <Ionicons name="lock-closed" size={20} color="#ffffff" />
        <Text style={styles.payText}>{t("payNow")}</Text>
        <Text style={styles.payAmount}>$150.00</Text>
      </View>

      {/* Transaction History */}
      <View style={styles.section}>
        <Heading level={3}>{t("transactionHistory")}</Heading>
        {transactions.map((tx, index) => (
          <Card key={index} style={styles.transactionItem}>
            <View style={styles.txHeader}>
              <Text style={styles.txDate}>{tx.date}</Text>
              <Body style={styles.txAmount}>{tx.amount}</Body>
            </View>
            <Heading level={3} style={styles.txDescription}>
              {tx.description}
            </Heading>
            <Body size="sm" style={styles.txMethod}>
              {tx.method}
            </Body>
            <Badge label={tx.status} variant="success" />
          </Card>
        ))}

        <Button
          label={t("viewAllTransactions")}
          variant="ghost"
          onPress={() => console.log("View All Transactions pressed!")}
        />
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
  clubName: {
    marginBottom: 16,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginHorizontal: 16,
    width: "100%",
  },
  address: {
    color: "#444653",
  },
  balanceCard: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  amount: {
    color: "#00288e",
    marginBottom: 8,
  },
  dueDate: {
    color: "#444653",
    marginBottom: 16,
  },
  paymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#00288e",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  payText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
    flex: 1,
  },
  payAmount: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  transactionItem: {
    marginBottom: 8,
  },
  txHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  txDate: {
    backgroundColor: "#e5eeff",
    color: "#00288e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "500",
  },
  txAmount: {
    fontWeight: "600",
    color: "#00288e",
  },
  txDescription: {
    fontSize: 16,
    marginBottom: 4,
  },
  txMethod: {
    color: "#444653",
    marginBottom: 8,
  },
});
