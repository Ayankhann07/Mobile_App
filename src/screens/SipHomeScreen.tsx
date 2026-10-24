import { useCallback, useState } from "react";
import { Alert, Animated, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Loader } from "../components/Loader";
import { StatusBadge } from "../components/StatusBadge";
import { ScreenHeader } from "../components/ScreenHeader";
import { MetalIcon } from "../components/MetalIcon";
import { AppearOnMount } from "../components/AppearOnMount";
import { usePressScale } from "../hooks/usePressScale";
import { getApiErrorMessage } from "../services/apiClient";
import { listMySips, updateSip } from "../services/customerApi";
import type { CustomerSip } from "../services/types";
import { formatCurrency, formatDate } from "../utils/formatters";
import { colors, radius, screenPadding, spacing } from "../utils/theme";
import type { MainTabScreenProps } from "../navigation/types";

type Props = MainTabScreenProps<"SIP">;
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function frequencyLabel(sip: CustomerSip): string {
  if (sip.Frequency === "DAILY") return "Daily";
  if (sip.Frequency === "WEEKLY") return "Weekly";
  return "Monthly";
}

function scheduleLabel(sip: CustomerSip): string {
  if (sip.Frequency === "DAILY") return "Every day";
  if (sip.Frequency === "WEEKLY") return `Every ${WEEKDAY_NAMES[sip.DueWeekday ?? 0]}`;
  return `Day ${sip.DueDay ?? "-"} of every month`;
}

export function SipHomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [sips, setSips] = useState<CustomerSip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    listMySips()
      .then(setSips)
      .catch((error) => Alert.alert("Couldn't load SIPs", getApiErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleTogglePause(sip: CustomerSip) {
    const nextStatus = sip.Status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setUpdatingId(sip.id);
    try {
      await updateSip(sip.id, { status: nextStatus });
      load();
    } catch (error) {
      Alert.alert("Couldn't update SIP", getApiErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  }

  function handleCancel(sip: CustomerSip) {
    Alert.alert("Cancel SIP", "This SIP will stop auto-investing. This can't be undone.", [
      { text: "Keep SIP", style: "cancel" },
      {
        text: "Cancel SIP",
        style: "destructive",
        onPress: async () => {
          setUpdatingId(sip.id);
          try {
            await updateSip(sip.id, { status: "CANCELLED" });
            load();
          } catch (error) {
            Alert.alert("Couldn't cancel SIP", getApiErrorMessage(error));
          } finally {
            setUpdatingId(null);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title="My SIPs"
        subtitle="Automatic monthly investments"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
      {isLoading ? (
        <Loader fullscreen label="Loading your SIPs…" />
      ) : (
        <AppearOnMount style={styles.flex}>
          <FlatList
            style={styles.flex}
            data={sips}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            ListHeaderComponent={
              sips.length > 0 ? (
                <Button title="+ Start a new SIP" onPress={() => navigation.navigate("StartSip")} style={styles.newButton} />
              ) : null
            }
            renderItem={({ item }) => (
              <SipCard
                sip={item}
                isUpdating={updatingId === item.id}
                onTogglePause={() => handleTogglePause(item)}
                onCancel={() => handleCancel(item)}
                onViewHistory={() => navigation.navigate("SipInstallments", { sipId: item.id, metalType: item.MetalType })}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyBadge}>
                  <Text style={styles.emptyEmoji}>🔁</Text>
                </View>
                <Text style={styles.emptyTitle}>No SIPs yet</Text>
                <Text style={styles.emptyText}>Start a SIP to invest automatically every month.</Text>
                <Button title="Start a SIP" onPress={() => navigation.navigate("StartSip")} style={styles.emptyButton} />
              </View>
            }
          />
        </AppearOnMount>
      )}
    </View>
  );
}

function SipCard({
  sip,
  isUpdating,
  onTogglePause,
  onCancel,
  onViewHistory,
}: {
  sip: CustomerSip;
  isUpdating: boolean;
  onTogglePause: () => void;
  onCancel: () => void;
  onViewHistory: () => void;
}) {
  const isGold = sip.MetalType === "GOLD";
  const isCancelled = sip.Status === "CANCELLED";
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({ toScale: 0.98 });

  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.metalRow}>
          <MetalIcon metal={sip.MetalType} size={22} />
          <Text style={styles.metal}>{isGold ? "Gold" : "Silver"} SIP</Text>
        </View>
        <StatusBadge status={sip.Status} />
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountValue}>{formatCurrency(sip.Amount)}</Text>
        <Text style={styles.amountLabel}>/ {frequencyLabel(sip).toLowerCase()}</Text>
      </View>

      <View style={styles.detailRow}>
        <Detail label="Schedule" value={scheduleLabel(sip)} />
        <Detail label="Next run" value={sip.Status === "CANCELLED" ? "—" : formatDate(sip.NextRunDate)} />
      </View>
      {sip.LastRunDate && (
        <View style={styles.detailRow}>
          <Detail label="Last run" value={formatDate(sip.LastRunDate)} />
          <Detail label="GST" value={sip.sipPlan.ApplyGst ? "Applied" : "Waived"} />
        </View>
      )}

      <Pressable onPress={onViewHistory} onPressIn={onPressIn} onPressOut={onPressOut}>
        <Animated.View style={[styles.historyLink, animatedStyle]}>
          <Text style={styles.historyLinkText}>View installment history →</Text>
        </Animated.View>
      </Pressable>

      {!isCancelled && (
        <View style={styles.actions}>
          <Button
            title={sip.Status === "ACTIVE" ? "Pause" : "Resume"}
            variant="secondary"
            onPress={onTogglePause}
            loading={isUpdating}
            style={styles.actionButton}
          />
          <Button title="Cancel" variant="danger" onPress={onCancel} disabled={isUpdating} style={styles.actionButton} />
        </View>
      )}
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: screenPadding, flexGrow: 1 },
  newButton: { marginBottom: spacing.md },
  card: { padding: spacing.md },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metalRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metal: { fontSize: 15, fontWeight: "700", color: colors.text },
  amountRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: spacing.sm },
  amountValue: { fontSize: 24, fontWeight: "800", color: colors.primary },
  amountLabel: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  detailRow: { flexDirection: "row", marginTop: spacing.sm },
  detail: { flex: 1 },
  detailLabel: { fontSize: 11, color: colors.textMuted },
  detailValue: { fontSize: 13, fontWeight: "600", color: colors.text, marginTop: 1 },
  historyLink: { marginTop: spacing.sm },
  historyLinkText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  actionButton: { flex: 1 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: spacing.xl * 2 },
  emptyBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  emptyText: { color: colors.textMuted, textAlign: "center", paddingHorizontal: spacing.xl, fontSize: 13, marginBottom: spacing.lg },
  emptyButton: { minWidth: 180 },
});
