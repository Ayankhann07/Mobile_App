import { useEffect } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { StatusBadge } from "../components/StatusBadge";
import { MetalIcon } from "../components/MetalIcon";
import { SuccessCheck } from "../components/SuccessCheck";
import { useMountAnimation } from "../hooks/useMountAnimation";
import { useSound } from "../hooks/useSound";
import { formatCurrency, formatDate, formatWeight } from "../utils/formatters";
import { colors, screenPadding, spacing } from "../utils/theme";
import type { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "PurchaseConfirmation">;

export function PurchaseConfirmationScreen({ route, navigation }: Props) {
  const { purchase } = route.params;
  const insets = useSafeAreaInsets();
  const metalLabel = purchase.MetalType === "GOLD" ? "Gold" : "Silver";
  const isSell = purchase.Type === "SELL";
  const { playCoinChime } = useSound();
  const cardAnim = useMountAnimation({ delay: 150 });

  useEffect(() => {
    playCoinChime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.iconWrap}>
        <SuccessCheck />
      </View>
      <Text style={styles.title}>{isSell ? "Sale Successful!" : "Purchase Successful!"}</Text>
      <Text style={styles.subtitle}>
        {isSell
          ? `You've sold ${formatWeight(purchase.Weight)} of ${metalLabel} from your holdings.`
          : `You've added ${formatWeight(purchase.Weight)} of ${metalLabel} to your holdings.`}
      </Text>

      <Animated.View style={cardAnim}>
      <Card style={styles.card}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Metal</Text>
          <View style={styles.metalValueRow}>
            <MetalIcon metal={purchase.MetalType} size={22} />
            <Text style={styles.summaryValue}>{metalLabel}</Text>
          </View>
        </View>
        <View style={styles.typeRow}>
          <Text style={styles.summaryLabel}>Type</Text>
          <StatusBadge status={purchase.Type} />
        </View>
        <Row label={isSell ? "Rate at sale" : "Rate at purchase"} value={formatCurrency(purchase.Rate)} />
        {isSell ? (
          <Row label="Amount Received" value={formatCurrency(purchase.Amount)} emphasize />
        ) : (
          <>
            <Row label="Amount Paid" value={formatCurrency(purchase.Amount)} />
            <Row label="CGST" value={formatCurrency(purchase.CGST)} />
            <Row label="SGST" value={formatCurrency(purchase.SGST)} />
            <Row label="Net Investment" value={formatCurrency(purchase.NetAmount)} emphasize />
          </>
        )}
        <Row label="Weight" value={formatWeight(purchase.Weight)} emphasize />
        <Row label="Date" value={formatDate(purchase.CreatedAt)} />
        <View style={styles.statusRow}>
          <Text style={styles.summaryLabel}>Status</Text>
          <StatusBadge status={purchase.Status} />
        </View>
      </Card>
      </Animated.View>

      <Button
        title="Back to Dashboard"
        onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
        style={styles.button}
      />
      <Button
        title="View Transaction History"
        variant="secondary"
        onPress={() => navigation.replace("MainTabs", { screen: "History" })}
        style={styles.button}
      />
    </ScrollView>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, emphasize && styles.summaryValueEmphasis]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: screenPadding, backgroundColor: colors.background, flexGrow: 1 },
  iconWrap: { alignItems: "center", marginTop: spacing.lg },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, textAlign: "center", marginTop: spacing.md },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  card: { marginBottom: spacing.lg },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs + 2,
  },
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  summaryValue: { color: colors.text, fontSize: 13, fontWeight: "600" },
  summaryValueEmphasis: { color: colors.primary, fontWeight: "800", fontSize: 14 },
  metalValueRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  button: { marginTop: spacing.sm },
});
