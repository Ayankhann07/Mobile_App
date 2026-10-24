import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Loader } from "../components/Loader";
import { KycThresholdBanner } from "../components/KycThresholdBanner";
import { MetalIcon } from "../components/MetalIcon";
import { getApiErrorMessage } from "../services/apiClient";
import { getKycStatus, listSipPlans, previewSip, subscribeSip } from "../services/customerApi";
import type { KycThresholdInfo, SipPlan, SipPreview } from "../services/types";
import { formatCurrency, formatWeight } from "../utils/formatters";
import { colors, radius, screenPadding, shadow, spacing } from "../utils/theme";
import { isKycRequiredError, showKycRequiredAlert } from "../utils/kyc";
import type { AppStackScreenProps } from "../navigation/types";

type Props = AppStackScreenProps<"StartSip">;
const PREVIEW_DEBOUNCE_MS = 500;
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function frequencyLabel(frequency: SipPlan["Frequency"]): string {
  if (frequency === "DAILY") return "Daily";
  if (frequency === "WEEKLY") return "Weekly";
  return "Monthly";
}

export function StartSipScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [kycInfo, setKycInfo] = useState<KycThresholdInfo | null>(null);
  const [plans, setPlans] = useState<SipPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SipPlan | null>(null);

  function goToKyc() {
    navigation.navigate("MainTabs", { screen: "ProfileTab", params: { initialTab: "kyc" } });
  }

  useEffect(() => {
    Promise.all([getKycStatus(), listSipPlans()])
      .then(([kycData, planList]) => {
        setKycInfo(kycData);
        setPlans(planList);
      })
      .catch((error) => Alert.alert("Couldn't load SIP plans", getApiErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <Loader fullscreen label="Loading SIP plans…" />;
  }

  if (!selectedPlan) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.introTitle}>Choose a SIP plan</Text>
        <Text style={styles.introText}>Pick a metal to invest in automatically.</Text>

        <KycThresholdBanner info={kycInfo} onPress={goToKyc} />

        {plans.length === 0 && (
          <Card style={styles.emptyPlansCard}>
            <Text style={styles.emptyPlansText}>Your dealer hasn&apos;t published any SIP plans yet. Please check back later.</Text>
          </Card>
        )}

        {plans.map((plan) => (
          <Pressable key={plan.id} onPress={() => setSelectedPlan(plan)}>
            <Card style={[styles.planCard, { borderColor: plan.MetalType === "GOLD" ? colors.gold : colors.silverDark }]}>
              <View style={styles.planHeader}>
                <View style={styles.planMetalRow}>
                  <MetalIcon metal={plan.MetalType} size={24} />
                  <Text style={styles.planMetal}>{plan.MetalType === "GOLD" ? "Gold SIP" : "Silver SIP"}</Text>
                </View>
                <Text style={styles.planArrow}>›</Text>
              </View>
              <Text style={styles.planRange}>
                {formatCurrency(plan.MinAmount)} – {formatCurrency(plan.MaxAmount)} · {frequencyLabel(plan.Frequency)}
              </Text>
              <View style={styles.planTagRow}>
                <View style={styles.frequencyTag}>
                  <Text style={styles.frequencyTagText}>{frequencyLabel(plan.Frequency)}</Text>
                </View>
                <View style={[styles.gstTag, { backgroundColor: plan.ApplyGst ? colors.warningBg : colors.successBg }]}>
                  <Text style={[styles.gstTagText, { color: plan.ApplyGst ? colors.warning : colors.success }]}>
                    {plan.ApplyGst ? "GST applies" : "No GST on this plan"}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return <SubscribeForm plan={selectedPlan} onChangePlan={() => setSelectedPlan(null)} navigation={navigation} goToKyc={goToKyc} />;
}

function SubscribeForm({
  plan,
  onChangePlan,
  navigation,
  goToKyc,
}: {
  plan: SipPlan;
  onChangePlan: () => void;
  navigation: Props["navigation"];
  goToKyc: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [amountText, setAmountText] = useState("");
  const today = new Date();
  const [dueDay, setDueDay] = useState(today.getDate() > 28 ? 28 : today.getDate());
  const [dueWeekday, setDueWeekday] = useState(today.getDay());
  const [preview, setPreview] = useState<SipPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const metalLabel = plan.MetalType === "GOLD" ? "Gold" : "Silver";
  const min = Number(plan.MinAmount);
  const max = Number(plan.MaxAmount);

  useEffect(() => {
    const numeric = Number(amountText);
    if (amountText.trim() === "" || Number.isNaN(numeric) || numeric <= 0) {
      setPreview(null);
      return;
    }
    setIsPreviewLoading(true);
    const timer = setTimeout(() => {
      previewSip({ sipPlanId: plan.id, amount: numeric })
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setIsPreviewLoading(false));
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [amountText, plan.id]);

  function scheduleExplainer(amountLabel: string): string {
    if (plan.Frequency === "MONTHLY") {
      return `${amountLabel} will auto-invest on day ${dueDay} of every month at that day's rate.`;
    }
    if (plan.Frequency === "WEEKLY") {
      return `${amountLabel} will auto-invest every ${WEEKDAY_NAMES[dueWeekday]} at that day's rate.`;
    }
    return `${amountLabel} will auto-invest every day at that day's rate.`;
  }

  async function handleSubmit() {
    const numeric = Number(amountText);
    if (amountText.trim() === "" || Number.isNaN(numeric) || numeric <= 0) {
      Alert.alert("Enter an amount", "Please enter a SIP amount.");
      return;
    }
    if (numeric < min || numeric > max) {
      Alert.alert("Amount out of range", `Enter an amount between ${formatCurrency(min)} and ${formatCurrency(max)}.`);
      return;
    }
    setIsSubmitting(true);
    try {
      await subscribeSip({
        sipPlanId: plan.id,
        amount: numeric,
        ...(plan.Frequency === "MONTHLY" ? { dueDay } : plan.Frequency === "WEEKLY" ? { dueWeekday } : {}),
      });
      Alert.alert("SIP started", `Your ${metalLabel} SIP is now active. ${scheduleExplainer(formatCurrency(numeric))}`, [
        { text: "OK", onPress: () => navigation.navigate("MainTabs", { screen: "SIP" }) },
      ]);
    } catch (error) {
      if (isKycRequiredError(error)) {
        showKycRequiredAlert(error, goToKyc);
      } else {
        Alert.alert("Couldn't start SIP", getApiErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={onChangePlan} style={styles.changePlanLink}>
          <Text style={styles.changePlanText}>‹ Change plan</Text>
        </Pressable>

        <Card style={[styles.planSummaryCard, { backgroundColor: plan.MetalType === "GOLD" ? colors.goldLight : colors.silverLight, borderColor: plan.MetalType === "GOLD" ? colors.gold : colors.silverDark }]}>
          <View style={styles.planSummaryTitleRow}>
            <MetalIcon metal={plan.MetalType} size={24} />
            <Text style={styles.planSummaryTitle}>{metalLabel} SIP · {frequencyLabel(plan.Frequency)}</Text>
          </View>
          <Text style={styles.planSummaryRange}>
            Allowed range: {formatCurrency(min)} – {formatCurrency(max)}
          </Text>
        </Card>

        <Input
          label={`${frequencyLabel(plan.Frequency)} amount (₹)`}
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="decimal-pad"
          placeholder={`e.g. ${plan.MinAmount}`}
        />

        {plan.Frequency === "MONTHLY" && (
          <>
            <Text style={styles.fieldLabel}>Monthly due day</Text>
            <View style={styles.stepperRow}>
              <Pressable onPress={() => setDueDay((d) => Math.max(1, d - 1))} style={styles.stepperButton}>
                <Text style={styles.stepperButtonText}>−</Text>
              </Pressable>
              <View style={styles.stepperValueBox}>
                <Text style={styles.stepperValue}>Day {dueDay}</Text>
              </View>
              <Pressable onPress={() => setDueDay((d) => Math.min(28, d + 1))} style={styles.stepperButton}>
                <Text style={styles.stepperButtonText}>+</Text>
              </Pressable>
            </View>
          </>
        )}

        {plan.Frequency === "WEEKLY" && (
          <>
            <Text style={styles.fieldLabel}>Weekly due day</Text>
            <View style={styles.weekdayRow}>
              {WEEKDAY_LETTERS.map((letter, index) => {
                const active = index === dueWeekday;
                return (
                  <Pressable
                    key={index}
                    onPress={() => setDueWeekday(index)}
                    style={[styles.weekdayChip, active && styles.weekdayChipActive]}
                  >
                    <Text style={[styles.weekdayChipText, active && styles.weekdayChipTextActive]}>{letter}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {plan.Frequency === "DAILY" && (
          <View style={styles.dailyNotice}>
            <Text style={styles.dailyNoticeText}>This SIP invests automatically every day — no schedule to pick.</Text>
          </View>
        )}

        <Text style={styles.helperText}>
          {scheduleExplainer(formatCurrency(Number(amountText) || 0))} There&apos;s no payment gateway yet — this is a
          demo auto-invest instruction against your account.
        </Text>
        {!plan.ApplyGst && <Text style={styles.noGstText}>No GST on this plan — the full amount converts to metal.</Text>}

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Installment preview</Text>
          {isPreviewLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.summaryLoader} />
          ) : preview ? (
            <View>
              <SummaryRow label="Rate / gram" value={formatCurrency(preview.rate)} />
              <SummaryRow label="Amount" value={formatCurrency(preview.amount)} />
              {preview.applyGst && (
                <>
                  <SummaryRow label="CGST" value={formatCurrency(preview.cgst)} />
                  <SummaryRow label="SGST" value={formatCurrency(preview.sgst)} />
                </>
              )}
              <SummaryRow label="Net Investment" value={formatCurrency(preview.netInvestment)} emphasize />
              <View style={styles.quantityBox}>
                <Text style={styles.quantityLabel}>Metal Quantity</Text>
                <Text style={styles.quantityValue}>{formatWeight(preview.metalQuantity)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.placeholder}>Enter an amount to see the estimated breakdown.</Text>
          )}
        </Card>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button title={isSubmitting ? "Starting…" : "Start SIP"} onPress={handleSubmit} loading={isSubmitting} />
      </View>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, emphasize && styles.summaryValueEmphasis]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: screenPadding, paddingBottom: spacing.xl, backgroundColor: colors.background, flexGrow: 1 },
  introTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  introText: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  emptyPlansCard: { alignItems: "center", paddingVertical: spacing.lg },
  emptyPlansText: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
  planCard: { borderWidth: 1.5, marginBottom: spacing.md },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planMetalRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  planMetal: { fontSize: 16, fontWeight: "800", color: colors.text },
  planArrow: { fontSize: 22, color: colors.textMuted, fontWeight: "700" },
  planRange: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs, fontWeight: "600" },
  planTagRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm },
  frequencyTag: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    backgroundColor: colors.goldLight,
  },
  frequencyTagText: { fontSize: 11, fontWeight: "800", color: colors.goldDark },
  gstTag: { alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: spacing.sm + 2, paddingVertical: 4 },
  gstTagText: { fontSize: 11, fontWeight: "800" },
  changePlanLink: { marginBottom: spacing.sm },
  changePlanText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  planSummaryCard: { alignItems: "center", borderWidth: 1.5, marginBottom: spacing.lg },
  planSummaryTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  planSummaryTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  planSummaryRange: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, fontWeight: "600" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: spacing.xs + 2 },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: { fontSize: 22, fontWeight: "700", color: colors.primary },
  stepperValueBox: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  stepperValue: { fontSize: 15, fontWeight: "800", color: colors.text },
  weekdayRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  weekdayChip: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayChipActive: { backgroundColor: colors.gold, borderColor: colors.goldDark },
  weekdayChipText: { fontSize: 14, fontWeight: "800", color: colors.textMuted },
  weekdayChipTextActive: { color: colors.maroon },
  dailyNotice: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  dailyNoticeText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  helperText: { fontSize: 12, color: colors.textMuted, lineHeight: 17, marginBottom: spacing.sm },
  noGstText: { fontSize: 12, color: colors.success, fontWeight: "700", marginBottom: spacing.md },
  summaryCard: { marginTop: spacing.sm, marginBottom: spacing.lg },
  summaryTitle: { fontWeight: "700", fontSize: 15, color: colors.text, marginBottom: spacing.sm },
  summaryLoader: { paddingVertical: spacing.md },
  placeholder: { color: colors.textMuted, fontSize: 13 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  summaryValue: { color: colors.text, fontSize: 13, fontWeight: "600" },
  summaryValueEmphasis: { color: colors.primary, fontWeight: "800", fontSize: 14 },
  quantityBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.goldLight,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityLabel: { color: colors.goldDark, fontWeight: "700", fontSize: 13 },
  quantityValue: { color: colors.goldDark, fontWeight: "800", fontSize: 18 },
  bottomBar: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.md,
  },
});
