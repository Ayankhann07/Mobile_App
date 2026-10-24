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
import { confirmSell, getPortfolio, getRates, previewSell, type PreviewInput } from "../services/customerApi";
import type { MetalRate, Portfolio, SellPreview } from "../services/types";
import { formatCurrency, formatWeight } from "../utils/formatters";
import { colors, radius, screenPadding, shadow, spacing } from "../utils/theme";
import { isKycRequiredError, showKycRequiredAlert } from "../utils/kyc";
import type { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "SellMetal">;
type EditedField = "amount" | "weight" | null;

const PREVIEW_DEBOUNCE_MS = 500;

export function SellMetalScreen({ route, navigation }: Props) {
  const { metalType } = route.params;
  const metalLabel = metalType === "GOLD" ? "Gold" : "Silver";
  const insets = useSafeAreaInsets();

  const [rates, setRates] = useState<MetalRate | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  const [amountText, setAmountText] = useState("");
  const [weightText, setWeightText] = useState("");
  const [lastEdited, setLastEdited] = useState<EditedField>(null);

  const [preview, setPreview] = useState<SellPreview | null>(null);
  const [previewInput, setPreviewInput] = useState<PreviewInput | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const rate = rates ? Number(metalType === "GOLD" ? rates.GoldSellRatePerGram : rates.SilverSellRatePerGram) : null;
  const heldGrams = portfolio ? (metalType === "GOLD" ? portfolio.goldGrams : portfolio.silverGrams) : 0;

  useEffect(() => {
    Promise.all([getRates(), getPortfolio()])
      .then(([ratesData, portfolioData]) => {
        setRates(ratesData);
        setPortfolio(portfolioData);
      })
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

  // Debounced call to the authoritative /sell/preview endpoint.
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
      previewSell(input)
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

  const exceedsHoldings = preview !== null && preview.weight > heldGrams;

  async function handleConfirm() {
    if (!previewInput || !preview) return;
    if (exceedsHoldings) {
      Alert.alert("Not enough holdings", `You only hold ${formatWeight(heldGrams)} of ${metalLabel}.`);
      return;
    }
    setIsConfirming(true);
    try {
      const purchase = await confirmSell(previewInput);
      navigation.replace("PurchaseConfirmation", { purchase });
    } catch (error) {
      if (isKycRequiredError(error)) {
        showKycRequiredAlert(error, () => navigation.navigate("MainTabs", { screen: "ProfileTab", params: { initialTab: "kyc" } }));
      } else {
        Alert.alert("Sell failed", getApiErrorMessage(error));
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
            <MetalIcon metal={metalType} size={20} />
            <Text style={styles.rateLabel}>{metalLabel}</Text>
          </View>
          <Text style={[styles.rateValue, { color: isGold ? colors.goldDark : colors.silverDark }]}>
            Selling rate: {formatCurrency(rate)} <Text style={styles.rateUnit}>/ g</Text>
          </Text>
          <Text style={styles.heldText}>You hold {formatWeight(heldGrams)}</Text>
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
        {exceedsHoldings && (
          <Text style={styles.warningText}>You only hold {formatWeight(heldGrams)} of {metalLabel}.</Text>
        )}

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Sell Summary</Text>
          {isPreviewLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.summaryLoader} />
          ) : preview ? (
            <View>
              <SummaryRow label="Metal" value={metalLabel} />
              <SummaryRow label="Rate / gram" value={formatCurrency(preview.rate)} />
              <SummaryRow label="Amount" value={formatCurrency(preview.amount)} emphasize />
              <View style={styles.quantityBox}>
                <Text style={styles.quantityLabel}>Weight to Sell</Text>
                <Text style={styles.quantityValue}>{formatWeight(preview.weight)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.placeholder}>Enter an amount or weight to see the breakdown.</Text>
          )}
        </Card>

        <Text style={styles.disclaimer}>No payment gateway — this confirms a demo sale against your account.</Text>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={isConfirming ? "Processing…" : "Confirm Sell"}
          onPress={handleConfirm}
          loading={isConfirming}
          disabled={!preview || isPreviewLoading || exceedsHoldings}
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
  heldText: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, fontWeight: "600" },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textMuted, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 0.4 },
  orRow: { flexDirection: "row", alignItems: "center", marginTop: -spacing.xs, marginBottom: spacing.sm, gap: spacing.sm },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { color: colors.textMuted, fontWeight: "700", fontSize: 12 },
  warningText: { color: colors.danger, fontSize: 12, fontWeight: "600", marginTop: -spacing.xs, marginBottom: spacing.sm },
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
