import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { KycThresholdInfo } from "../services/types";
import { formatCurrency } from "../utils/formatters";
import { colors, radius, spacing } from "../utils/theme";

interface KycThresholdBannerProps {
  info: KycThresholdInfo | null;
  onPress: () => void;
  style?: object;
}

/** How much headroom (as a fraction of the threshold) triggers the gentle heads-up nudge. */
const LOW_HEADROOM_FRACTION = 0.2;

/**
 * KYC is never a hard gate — investing stays open until the customer crosses the dealer's
 * threshold. This banner adapts: silent while there's plenty of room, a gentle nudge as the
 * threshold approaches, and a prominent call-to-action once KYC is actually required.
 */
export function KycThresholdBanner({ info, onPress, style }: KycThresholdBannerProps) {
  if (!info) return null;

  if (info.kycRequired) {
    const text =
      info.kycStatus === "PENDING"
        ? "Your KYC is under review — you'll be able to continue investing once it's approved."
        : info.kycStatus === "REJECTED"
          ? "Your KYC was rejected. Please resubmit your details to keep investing."
          : `KYC approval is required once your total value crosses ${formatCurrency(info.threshold)}. Please complete your KYC to continue.`;
    const cta = info.kycStatus === "PENDING" ? "View status" : info.kycStatus === "REJECTED" ? "Resubmit KYC" : "Complete KYC";

    return (
      <Pressable onPress={onPress} style={[styles.banner, styles.bannerRequired, style]}>
        <Ionicons name="alert-circle" size={20} color={colors.danger} />
        <View style={styles.textWrap}>
          <Text style={styles.textRequired}>{text}</Text>
          <Text style={styles.ctaRequired}>{cta} →</Text>
        </View>
      </Pressable>
    );
  }

  const showHeadsUp = info.remainingBeforeKyc <= info.threshold * LOW_HEADROOM_FRACTION;
  if (!showHeadsUp) return null;

  return (
    <Pressable onPress={onPress} style={[styles.banner, style]}>
      <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
      <Text style={styles.text}>
        You can invest {formatCurrency(info.remainingBeforeKyc)} more before KYC is needed.
      </Text>
      <Ionicons name="chevron-forward" size={14} color={colors.warning} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerRequired: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger,
    alignItems: "flex-start",
  },
  text: {
    flex: 1,
    color: colors.warning,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  textWrap: { flex: 1 },
  textRequired: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  ctaRequired: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
});
