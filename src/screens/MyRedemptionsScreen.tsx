import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Card } from "../components/Card";
import { Loader } from "../components/Loader";
import { StatusBadge, redemptionStatusTag } from "../components/StatusBadge";
import { MetalIcon } from "../components/MetalIcon";
import { AppearOnMount } from "../components/AppearOnMount";
import { getApiErrorMessage } from "../services/apiClient";
import { listRedemptions } from "../services/customerApi";
import type { Redemption } from "../services/types";
import { formatCurrency, formatDate, formatWeight } from "../utils/formatters";
import { colors, radius, screenPadding, spacing } from "../utils/theme";
import type { AppStackScreenProps } from "../navigation/types";

type Props = AppStackScreenProps<"MyRedemptions">;

export function MyRedemptionsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback((showSpinner: boolean) => {
    if (showSpinner) setIsLoading(true);
    listRedemptions()
      .then(setRedemptions)
      .catch((error) => Alert.alert("Couldn't load redemptions", getApiErrorMessage(error)))
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load])
  );

  function handleRefresh() {
    setIsRefreshing(true);
    load(false);
  }

  if (isLoading) {
    return <Loader fullscreen label="Loading your redemptions…" />;
  }

  return (
    <View style={styles.flex}>
      <AppearOnMount style={styles.flex}>
        <FlatList
          style={styles.flex}
          data={redemptions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <RedemptionCard redemption={item} onPress={() => navigation.navigate("RedemptionDetail", { redemption: item })} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyBadge}>
                <Ionicons name="cube-outline" size={30} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No redemptions yet</Text>
              <Text style={styles.emptyText}>
                Redeem your gold or silver holdings for physical delivery, and track your orders here.
              </Text>
            </View>
          }
        />
      </AppearOnMount>
    </View>
  );
}

function RedemptionCard({ redemption, onPress }: { redemption: Redemption; onPress: () => void }) {
  const metalLabel = redemption.metalType === "GOLD" ? "Gold" : "Silver";
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.metalRow}>
            <MetalIcon metal={redemption.metalType} size={24} />
            <Text style={styles.title}>
              {metalLabel} · {formatWeight(redemption.grams)}
            </Text>
          </View>
          <StatusBadge status={redemptionStatusTag(redemption.status)} />
        </View>
        <View style={styles.detailRow}>
          <Detail label="Courier charge" value={formatCurrency(redemption.courierCharge)} />
          <Detail label="Requested" value={formatDate(redemption.createdAt)} />
        </View>
        {redemption.status === "SHIPPED" && redemption.courierName && (
          <Text style={styles.trackingText}>
            {redemption.courierName} · {redemption.trackingNumber}
          </Text>
        )}
      </Card>
    </Pressable>
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
  card: { padding: spacing.md },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  metalRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 1 },
  title: { fontSize: 15, fontWeight: "700", color: colors.text, flexShrink: 1 },
  detailRow: { flexDirection: "row", marginTop: spacing.xs },
  detail: { flex: 1 },
  detailLabel: { fontSize: 11, color: colors.textMuted },
  detailValue: { fontSize: 13, fontWeight: "600", color: colors.text, marginTop: 1 },
  trackingText: { marginTop: spacing.sm, fontSize: 12, fontWeight: "600", color: colors.indigo },

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
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  emptyText: { color: colors.textMuted, textAlign: "center", paddingHorizontal: spacing.xl, fontSize: 13 },
});
