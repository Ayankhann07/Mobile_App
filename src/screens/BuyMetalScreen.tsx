import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Loader } from "../components/Loader";
import { MetalIcon } from "../components/MetalIcon";
import { getApiErrorMessage } from "../services/apiClient";
import {
  confirmPurchase,
  getPaymentConfig,
  getRates,
  initiateBuyPayment,
  previewPurchase,
  type PreviewInput,
} from "../services/customerApi";
import type { MetalRate, PurchasePreview } from "../services/types";
import { formatCurrency, formatWeight } from "../utils/formatters";
import { colors, radius, screenPadding, shadow, spacing } from "../utils/theme";
import { isKycRequiredError, showKycRequiredAlert } from "../utils/kyc";
import type { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "BuyMetal">;
type EditedField = "amount" | "weight" | null;

const PREVIEW_DEBOUNCE_MS = 500;

export function BuyMetalScreen({ route, navigation }: Props) {
  const { metalType } = route.params;
  const metalLabel = metalType === "GOLD" ? "Gold" : "Silver";
  const insets = useSafeAreaInsets();

  const [rates, setRates] = useState<MetalRate | null>(null);
  const [onlinePayment, setOnlinePayment] = useState(false);

  useEffect(() => {
    getPaymentConfig()
      .then((cfg) => setOnlinePayment(cfg.enabled))
      .catch(() => setOnlinePayment(false));
  }, []);
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  const [amountText, setAmountText] = useState("");
  const [weightText, setWeightText] = useState("");
  const [lastEdited, setLastEdited] = useState<EditedField>(null);

  const [preview, setPreview] = useState<PurchasePreview | null>(null);
  const [previewInput, setPreviewInput] = useState<PreviewInput | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const rate = rates ? Number(metalType === "GOLD" ? rates.GoldRatePerGram : rates.SilverRatePerGram) : null;

  useEffect(() => {
    getRates()
      .then(setRates)
      .catch((error) => Alert.alert("Couldn't load rate", getApiErrorMessage(error)))
      .finally(() => setIsLoadingRates(false));
  }, []);

  function handleAmountChange(text: string) {
    setAmountText(text);
    setLastEdited("amount");
    const numeric = Number(text);
    if (rate && text.trim() !== "" && !Number.isNaN(numeric)) {
      setWeightText((numeric / rate).toFixed(4));
    } else {
      setWeightText("");
    }
  }

  function handleWeightChange(text: string) {
    setWeightText(text);
    setLastEdited("weight");
    const numeric = Number(text);
    if (rate && text.trim() !== "" && !Number.isNaN(numeric)) {
      setAmountText((numeric * rate).toFixed(2));
    } else {
      setAmountText("");
    }
  }

  // Debounced call to the authoritative /purchase/preview endpoint.
  useEffect(() => {
    if (!lastEdited) return;
    const raw = lastEdited === "amount" ? amountText : weightText;
    const numeric = Number(raw);

    if (raw.trim() === "" || Number.isNaN(numeric) || numeric <= 0) {
      setPreview(null);
      setPreviewInput(null);
      return;
    }

    setIsPreviewLoading(true);
    const timer = setTimeout(() => {
      const input: PreviewInput =
        lastEdited === "amount" ? { metalType, amount: numeric } : { metalType, weight: numeric };
      previewPurchase(input)
        .then((result) => {
          setPreview(result);
          setPreviewInput(input);
        })
        .catch(() => {
          setPreview(null);
          setPreviewInput(null);
        })
        .finally(() => setIsPreviewLoading(false));
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountText, weightText, lastEdited, metalType]);

  async function handleConfirm() {
    if (!previewInput || !preview) return;
    setIsConfirming(true);
    try {
      if (onlinePayment) {
        const order = await initiateBuyPayment(previewInput);
        navigation.navigate("Payment", { payUrl: order.payUrl, returnUrlPrefix: order.returnUrlPrefix, orderId: order.orderId });
        return;
      }
      const purchase = await confirmPurchase(previewInput);
      navigation.replace("PurchaseConfirmation", { purchase });
    } catch (error) {
      if (isKycRequiredError(error)) {
        showKycRequiredAlert(error, () => navigation.navigate("MainTabs", { screen: "ProfileTab", params: { initialTab: "kyc" } }));
      } else {
        Alert.alert("Purchase failed", getApiErrorMessage(error));
      }
    } finally {
      setIsConfirming(false);
    }
  }

  if (isLoadingRates) {
    return <Loader fullscreen label="Loading current rate…" />;
  }

  const isGold = metalType === "GOLD";

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card
          style={[
            styles.rateCard,
            { backgroundColor: isGold ? colors.goldLight : colors.silverLight, borderColor: isGold ? colors.gold : colors.silverDark },
          ]}
        >
          <View style={styles.rateLabelRow}>
            <Text style={styles.rateLabel}>Current {metalLabel} Rate</Text>
            <MetalIcon metal={metalType} size={20} />
          </View>
          <Text style={[styles.rateValue, { color: isGold ? colors.goldDark : colors.silverDark }]}>
            {formatCurrency(rate)} <Text style={styles.rateUnit}>/ gram</Text>
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Enter amount or weight</Text>
        <Input
          label="Amount (₹)"
          value={amountText}
          onChangeText={handleAmountChange}
          keyboardType="decimal-pad"
          placeholder="e.g. 1000"
        />
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>
        <Input
          label="Weight (grams)"
          value={weightText}
          onChangeText={handleWeightChange}
          keyboardType="decimal-pad"
          placeholder="e.g. 5"
        />

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Purchase Summary</Text>
          {isPreviewLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.summaryLoader} />
          ) : preview ? (
            <View>
              <SummaryRow label="Metal" value={metalLabel} />
              <SummaryRow label="Rate / gram" value={formatCurrency(preview.rate)} />
              <SummaryRow label="Entered Amount" value={formatCurrency(preview.amount)} />
              <SummaryRow label="CGST" value={formatCurrency(preview.cgst)} />
              <SummaryRow label="SGST" value={formatCurrency(preview.sgst)} />
              <SummaryRow label="Total Tax" value={formatCurrency(preview.totalTax)} />
              <SummaryRow label="Net Investment" value={formatCurrency(preview.netInvestment)} emphasize />
              <View style={styles.quantityBox}>
                <Text style={styles.quantityLabel}>Metal Quantity</Text>
                <Text style={styles.quantityValue}>{formatWeight(preview.metalQuantity)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.placeholder}>Enter an amount or weight to see the breakdown.</Text>
          )}
        </Card>

        <Text style={styles.disclaimer}>No payment gateway — this confirms a demo purchase against your account.</Text>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={isConfirming ? "Processing…" : onlinePayment ? "Proceed to Pay" : "Confirm Purchase"}
          onPress={handleConfirm}
          loading={isConfirming}
          disabled={!preview || isPreviewLoading}
        />
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
  container: { padding: screenPadding, paddingBottom: spacing.xl },
  rateCard: { alignItems: "center", marginBottom: spacing.lg, borderWidth: 1.5 },
  rateLabelRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  rateLabel: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  rateValue: { fontSize: 24, fontWeight: "800", marginTop: spacing.xs },
  rateUnit: { fontSize: 14, fontWeight: "600" },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 0.4 },
  orRow: { flexDirection: "row", alignItems: "center", marginTop: -spacing.xs, marginBottom: spacing.sm, gap: spacing.sm },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { color: colors.textMuted, fontWeight: "700", fontSize: 12 },
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
  disclaimer: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  bottomBar: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.md,
  },
});
