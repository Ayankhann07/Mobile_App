import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { Card } from "../components/Card";
import { Loader } from "../components/Loader";
import { StatusBadge } from "../components/StatusBadge";
import { ScreenHeader } from "../components/ScreenHeader";
import { MetalIcon } from "../components/MetalIcon";
import { AppearOnMount } from "../components/AppearOnMount";
import { getApiErrorMessage } from "../services/apiClient";
import { listPurchases } from "../services/customerApi";
import type { Purchase } from "../services/types";
import { formatCurrency, formatDate, formatWeight } from "../utils/formatters";
import { colors, radius, screenPadding, spacing } from "../utils/theme";
import type { MainTabScreenProps } from "../navigation/types";

type Props = MainTabScreenProps<"History">;

export function PurchaseHistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIsLoading(true);
      listPurchases()
        .then((data) => {
          if (isActive) setPurchases(data);
        })
        .catch((error) => Alert.alert("Couldn't load purchases", getApiErrorMessage(error)))
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title="Transaction History"
        subtitle="Every buy & sell, newest first"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
      {isLoading ? (
        <Loader fullscreen label="Loading purchases…" />
      ) : (
        <AppearOnMount style={styles.list}>
          <FlatList
            style={styles.list}
            data={purchases}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
            renderItem={({ item }) => <PurchaseRow purchase={item} />}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyBadge}>
                  <Text style={styles.emptyEmoji}>🧾</Text>
                </View>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptyText}>Your gold &amp; silver buys and sells will show up here.</Text>
              </View>
            }
          />
        </AppearOnMount>
      )}
    </View>
  );
}

function giftLineFor(purchase: Purchase): string | null {
  if (purchase.Type === "GIFT_SENT") {
    return purchase.giftClaimed && purchase.giftCounterpartyName
      ? `Gift sent to ${purchase.giftCounterpartyName}`
      : "Gift sent — not opened yet";
  }
  if (purchase.Type === "GIFT_RECEIVED") {
    return purchase.giftCounterpartyName ? `Gift received from ${purchase.giftCounterpartyName}` : "Gift received";
  }
  if (purchase.Type === "REDEEM") {
    return "Redeemed for physical delivery";
  }
  return null;
}

function PurchaseRow({ purchase }: { purchase: Purchase }) {
  const isGold = purchase.MetalType === "GOLD";
  // SELL and REDEEM both use the sell rate and are outflows from holdings.
  const isOutflow = purchase.Type === "SELL" || purchase.Type === "REDEEM";
  const metalLabel = isGold ? "Gold" : "Silver";
  const giftLine = giftLineFor(purchase);
  return (
    <Card style={styles.row}>
      <View style={styles.rowTop}>
        <View style={styles.metalWrap}>
          <MetalIcon metal={purchase.MetalType} size={22} />
          <Text style={styles.metal}>{metalLabel}</Text>
          <StatusBadge status={purchase.Type} />
        </View>
        <StatusBadge status={purchase.Status} />
      </View>
      {giftLine && <Text style={styles.giftLine}>{giftLine}</Text>}
      <View style={styles.detailRow}>
        <Detail label={isOutflow ? "Rate at sale" : "Rate at purchase"} value={formatCurrency(purchase.Rate)} />
        <Detail label="Weight" value={formatWeight(purchase.Weight)} />
      </View>
      <View style={styles.detailRow}>
        <Detail label="Amount" value={formatCurrency(purchase.Amount)} />
        <Detail label="Net Amount" value={formatCurrency(purchase.NetAmount)} />
      </View>
      <Text style={styles.dateText}>{formatDate(purchase.CreatedAt)}</Text>
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
  list: { flex: 1 },
  container: { padding: screenPadding, flexGrow: 1 },
  row: { padding: spacing.md },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  metalWrap: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metal: { fontSize: 15, fontWeight: "700", color: colors.text },
  giftLine: { fontSize: 12, fontWeight: "600", color: colors.primary, marginBottom: spacing.xs },
  detailRow: { flexDirection: "row", marginTop: spacing.xs },
  detail: { flex: 1 },
  detailLabel: { fontSize: 11, color: colors.textMuted },
  detailValue: { fontSize: 13, fontWeight: "600", color: colors.text, marginTop: 1 },
  dateText: { fontSize: 11, color: colors.textMuted, textAlign: "right", marginTop: spacing.sm },
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
  emptyText: { color: colors.textMuted, textAlign: "center", paddingHorizontal: spacing.xl, fontSize: 13 },
});
