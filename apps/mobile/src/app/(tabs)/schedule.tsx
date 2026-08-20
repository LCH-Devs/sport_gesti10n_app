import { ActivityCard } from "@/components/ActivityCard";
import { Body, Button, Heading } from "@/components/common";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"weekly" | "events">("weekly");

  const schedules = [
    { title: "Advanced Swimming", date: "OCT 24", time: "09:00 AM" },
    { title: "Tennis Practice", date: "OCT 24", time: "11:30 AM" },
    { title: "Yoga Basics", date: "OCT 25", time: "02:00 PM" },
  ];

  const ButtonPress = () => {
    console.log("Register Now button pressed!");
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader />
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Main Card with Tabs */}
        <View style={styles.mainCard}>
        {/* Tab Header */}
        <View style={styles.tabHeader}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "weekly" && styles.tabActive]}
            onPress={() => setActiveTab("weekly")}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === "weekly" && styles.tabLabelActive,
              ]}
            >
              {t("weeklySchedule")}
            </Text>
            {activeTab === "weekly" && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "events" && styles.tabActive]}
            onPress={() => setActiveTab("events")}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === "events" && styles.tabLabelActive,
              ]}
            >
              {t("upcomingEvents")}
            </Text>
            {activeTab === "events" && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Today Section */}
          <View style={styles.section}>
            <Heading level={3}>{t("today")}, Oct 24</Heading>
            {schedules.slice(0, 2).map((schedule, index) => (
              <ActivityCard
                key={index}
                title={schedule.title}
                date={schedule.date}
                time={schedule.time}
              />
            ))}
          </View>

          {/* Tomorrow Section */}
          <View style={styles.section}>
            <Heading level={3}>{t("tomorrow")}, Oct 25</Heading>
            {schedules.slice(2).map((schedule, index) => (
              <ActivityCard
                key={index}
                title={schedule.title}
                date={schedule.date}
                time={schedule.time}
              />
            ))}
          </View>

          {/* Featured Events Section */}
          <View style={styles.section}>
            <Heading level={3}>{t("featuredEvents")}</Heading>
            <View style={styles.eventCard}>
              <View style={styles.eventImage} />
              <Heading level={3} style={styles.eventTitle}>
                {t("fallTennisTournament")}
              </Heading>
              <Body size="sm" style={styles.eventDesc}>
                {t("tournamentDescription")}
              </Body>
              <Button
                label={t("registerNow")}
                variant="primary"
                onPress={ButtonPress}
              />
            </View>
          </View>
        </View>
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
  mainCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderColor: "#dce9ff",
    borderWidth: 1,
    overflow: "hidden",
  },
  tabHeader: {
    flexDirection: "row",
    borderBottomColor: "#e5eeff",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRightColor: "#e5eeff",
    borderRightWidth: 1,
    backgroundColor: "#e8ecf5",
  },
  tabActive: {
    backgroundColor: "#ffffff",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabLabelActive: {
    color: "#00288e",
  },
  tabIndicator: {
    position: "absolute",
    bottom: -1.5,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#ffffff",
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    paddingVertical: 12,
  },
  eventCard: {
    backgroundColor: "#f8f9ff",
    borderRadius: 8,
    borderColor: "#e5eeff",
    borderWidth: 1,
    padding: 12,
  },
  eventImage: {
    height: 160,
    backgroundColor: "#e5eeff",
    borderRadius: 8,
    marginBottom: 12,
  },
  eventTitle: {
    marginBottom: 8,
  },
  eventDesc: {
    color: "#444653",
    marginBottom: 16,
  },
});
