import { useEffect } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { StatusBadge, redemptionStatusTag } from "../components/StatusBadge";
import { MetalIcon } from "../components/MetalIcon";
import { SuccessCheck } from "../components/SuccessCheck";
import { useMountAnimation } from "../hooks/useMountAnimation";
import { useSound } from "../hooks/useSound";
import { formatCurrency, formatDate, formatWeight } from "../utils/formatters";
import { colors, screenPadding, spacing } from "../utils/theme";
import type { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "RedeemConfirmation">;

export function RedeemConfirmationScreen({ route, navigation }: Props) {
  const { redemption } = route.params;
  const insets = useSafeAreaInsets();
  const metalLabel = redemption.metalType === "GOLD" ? "Gold" : "Silver";
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
      <Text style={styles.title}>Redemption Requested!</Text>
      <Text style={styles.subtitle}>
        We&apos;ve received your request to redeem {formatWeight(redemption.grams)} of {metalLabel} for physical delivery.
        The dealer will process and ship it soon.
      </Text>

      <Animated.View style={cardAnim}>
        <Card style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Metal</Text>
            <View style={styles.metalValueRow}>
              <MetalIcon metal={redemption.metalType} size={22} />
              <Text style={styles.summaryValue}>{metalLabel}</Text>
            </View>
          </View>
          <View style={styles.typeRow}>
            <Text style={styles.summaryLabel}>Status</Text>
            <StatusBadge status={redemptionStatusTag(redemption.status)} />
          </View>
          <Row label="Grams" value={formatWeight(redemption.grams)} emphasize />
          <Row label="Rate at request" value={formatCurrency(redemption.rateAtRequest)} />
          <Row label="Courier charge" value={formatCurrency(redemption.courierCharge)} emphasize />
          <Row label="Date" value={formatDate(redemption.createdAt)} />

          <View style={styles.addressBlock}>
            <Text style={styles.addressTitle}>Delivery address</Text>
            <Text style={styles.addressText}>
              {redemption.address.name} · {redemption.address.phone}
            </Text>
            <Text style={styles.addressText}>
              {redemption.address.line1}
              {redemption.address.line2 ? `, ${redemption.address.line2}` : ""}
            </Text>
            <Text style={styles.addressText}>
              {redemption.address.city}, {redemption.address.state} - {redemption.address.pincode}
            </Text>
          </View>

          <Text style={styles.noteText}>{redemption.courierChargeNote}</Text>
        </Card>
      </Animated.View>

      <Button
        title="Back to Dashboard"
        onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
        style={styles.button}
      />
      <Button
        title="Track My Redemptions"
        variant="secondary"
        onPress={() => navigation.replace("MyRedemptions")}
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
    lineHeight: 19,
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
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  summaryValue: { color: colors.text, fontSize: 13, fontWeight: "600" },
  summaryValueEmphasis: { color: colors.primary, fontWeight: "800", fontSize: 14 },
  metalValueRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  addressBlock: { marginTop: spacing.sm + 2, paddingTop: spacing.sm },
  addressTitle: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: spacing.xs },
  addressText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  noteText: { marginTop: spacing.sm, fontSize: 11, color: colors.textMuted, lineHeight: 15 },
  button: { marginTop: spacing.sm },
});
