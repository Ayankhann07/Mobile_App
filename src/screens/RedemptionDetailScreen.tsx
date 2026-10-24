import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Card } from "../components/Card";
import { StatusBadge, redemptionStatusTag } from "../components/StatusBadge";
import { MetalIcon } from "../components/MetalIcon";
import { formatCurrency, formatDate, formatWeight } from "../utils/formatters";
import { colors, radius, screenPadding, spacing } from "../utils/theme";
import type { RedemptionStatus } from "../services/types";
import type { AppStackScreenProps } from "../navigation/types";

type Props = AppStackScreenProps<"RedemptionDetail">;

const STEPS: RedemptionStatus[] = ["REQUESTED", "APPROVED", "SHIPPED", "DELIVERED"];
const STEP_LABELS: Record<RedemptionStatus, string> = {
  REQUESTED: "Requested",
  APPROVED: "Approved",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function RedemptionDetailScreen({ route }: Props) {
  const { redemption } = route.params;
  const insets = useSafeAreaInsets();
  const metalLabel = redemption.metalType === "GOLD" ? "Gold" : "Silver";

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}>
      <Card style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.metalRow}>
            <MetalIcon metal={redemption.metalType} size={28} />
            <Text style={styles.headerTitle}>
              {metalLabel} · {formatWeight(redemption.grams)}
            </Text>
          </View>
          <StatusBadge status={redemptionStatusTag(redemption.status)} />
        </View>
        <Text style={styles.headerSubtitle}>Requested {formatDate(redemption.createdAt)}</Text>
      </Card>

      <Text style={styles.sectionTitle}>Status</Text>
      <Card style={styles.timelineCard}>
        <StatusTimeline status={redemption.status} />
      </Card>

      {(redemption.courierName || redemption.trackingNumber) && (
        <>
          <Text style={styles.sectionTitle}>Courier</Text>
          <Card style={styles.infoCard}>
            <Row label="Courier" value={redemption.courierName ?? "-"} />
            <Row label="Tracking number" value={redemption.trackingNumber ?? "-"} />
          </Card>
        </>
      )}

      <Text style={styles.sectionTitle}>Order details</Text>
      <Card style={styles.infoCard}>
        <Row label="Grams" value={formatWeight(redemption.grams)} />
        <Row label="Rate at request" value={formatCurrency(redemption.rateAtRequest)} />
        <Row label="Courier charge" value={formatCurrency(redemption.courierCharge)} emphasize />
        <Row label="Last updated" value={formatDate(redemption.updatedAt)} />
      </Card>
      <Text style={styles.noteText}>{redemption.courierChargeNote}</Text>

      <Text style={styles.sectionTitle}>Delivery address</Text>
      <Card style={styles.infoCard}>
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
      </Card>
    </ScrollView>
  );
}

function StatusTimeline({ status }: { status: RedemptionStatus }) {
  if (status === "CANCELLED") {
    return (
      <View style={styles.cancelledBox}>
        <Ionicons name="close-circle" size={20} color={colors.danger} />
        <Text style={styles.cancelledText}>This order was cancelled.</Text>
      </View>
    );
  }

  const currentIndex = STEPS.indexOf(status);
  return (
    <View>
      {STEPS.map((step, idx) => {
        const done = idx <= currentIndex;
        const isLast = idx === STEPS.length - 1;
        return (
          <View key={step} style={styles.timelineRow}>
            <View style={styles.timelineIconCol}>
              <View style={[styles.timelineDot, done && styles.timelineDotDone]}>
                {done && <Ionicons name="checkmark" size={12} color={colors.white} />}
              </View>
              {!isLast && <View style={[styles.timelineLine, idx < currentIndex && styles.timelineLineDone]} />}
            </View>
            <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>{STEP_LABELS[step]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, emphasize && styles.rowValueEmphasis]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: screenPadding, backgroundColor: colors.background, flexGrow: 1 },
  headerCard: { marginBottom: spacing.lg },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metalRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 1 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: colors.text, flexShrink: 1 },
  headerSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm, fontWeight: "600" },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  timelineCard: { marginBottom: spacing.lg },
  timelineRow: { flexDirection: "row", alignItems: "flex-start" },
  timelineIconCol: { alignItems: "center", width: 28 },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotDone: { backgroundColor: colors.success },
  timelineLine: { width: 2, flex: 1, minHeight: 20, backgroundColor: colors.border, marginVertical: 2 },
  timelineLineDone: { backgroundColor: colors.success },
  timelineLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted, marginLeft: spacing.sm, paddingTop: 2, paddingBottom: spacing.md },
  timelineLabelDone: { color: colors.text, fontWeight: "800" },

  cancelledBox: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.xs },
  cancelledText: { color: colors.danger, fontWeight: "700", fontSize: 13 },

  infoCard: { marginBottom: spacing.lg },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs + 2, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.textMuted, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: "600" },
  rowValueEmphasis: { color: colors.primary, fontWeight: "800", fontSize: 14 },

  addressText: { fontSize: 13, color: colors.text, lineHeight: 19 },

  noteText: { fontSize: 11, color: colors.textMuted, marginTop: -spacing.sm, marginBottom: spacing.lg, lineHeight: 15 },
});
