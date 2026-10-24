import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../utils/theme";

const STYLES: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: colors.warningBg, fg: colors.warning },
  APPROVED: { bg: colors.successBg, fg: colors.success },
  COMPLETED: { bg: colors.successBg, fg: colors.success },
  REJECTED: { bg: colors.dangerBg, fg: colors.danger },
  BUY: { bg: colors.successBg, fg: colors.success },
  SELL: { bg: colors.warningBg, fg: colors.warning },
  REDEEM: { bg: colors.goldLight, fg: colors.goldDark },
  ACTIVE: { bg: colors.successBg, fg: colors.success },
  PAUSED: { bg: colors.warningBg, fg: colors.warning },
  CANCELLED: { bg: colors.border, fg: colors.textMuted },
  INACTIVE: { bg: colors.border, fg: colors.textMuted },
  // Redemption (physical delivery) order statuses — prefixed since "APPROVED"/"CANCELLED"
  // above already mean something different (KYC/SIP) with different colors.
  REDEMPTION_REQUESTED: { bg: colors.warningBg, fg: colors.warning },
  REDEMPTION_APPROVED: { bg: colors.infoBg, fg: colors.info },
  REDEMPTION_SHIPPED: { bg: colors.indigoBg, fg: colors.indigo },
  REDEMPTION_DELIVERED: { bg: colors.successBg, fg: colors.success },
  REDEMPTION_CANCELLED: { bg: colors.border, fg: colors.textMuted },
};

const LABELS: Record<string, string> = {
  REDEMPTION_REQUESTED: "REQUESTED",
  REDEMPTION_APPROVED: "APPROVED",
  REDEMPTION_SHIPPED: "SHIPPED",
  REDEMPTION_DELIVERED: "DELIVERED",
  REDEMPTION_CANCELLED: "CANCELLED",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? { bg: colors.border, fg: colors.textMuted };
  const label = LABELS[status] ?? status;
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.fg }]}>{label}</Text>
    </View>
  );
}

/** For a RedemptionStatus value, e.g. "REQUESTED" -> "REDEMPTION_REQUESTED" — the STYLES/LABELS key. */
export function redemptionStatusTag(status: string): string {
  return `REDEMPTION_${status}`;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});
