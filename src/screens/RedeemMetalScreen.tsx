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
import { confirmRedeem, getKycStatus, getPortfolio, getRates, previewRedeem, type RedeemPreviewInput } from "../services/customerApi";
import type { KycThresholdInfo, MetalRate, Portfolio, RedeemPreview } from "../services/types";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency, formatWeight } from "../utils/formatters";
import { colors, radius, screenPadding, shadow, spacing } from "../utils/theme";
import { isKycRequiredError, showKycRequiredAlert } from "../utils/kyc";
import type { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "RedeemMetal">;
type EditedField = "amount" | "grams" | null;

interface AddressErrors {
  name?: string;
  phone?: string;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

const PREVIEW_DEBOUNCE_MS = 500;

export function RedeemMetalScreen({ route, navigation }: Props) {
  const { metalType } = route.params;
  const metalLabel = metalType === "GOLD" ? "Gold" : "Silver";
  const insets = useSafeAreaInsets();
  const { customer } = useAuth();

  const [rates, setRates] = useState<MetalRate | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [kycInfo, setKycInfo] = useState<KycThresholdInfo | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  const [amountText, setAmountText] = useState("");
  const [gramsText, setGramsText] = useState("");
  const [lastEdited, setLastEdited] = useState<EditedField>(null);

  const [preview, setPreview] = useState<RedeemPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [name, setName] = useState(customer?.FullName ?? "");
  const [phone, setPhone] = useState(customer?.MobileNumber ?? "");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({});

  const rate = rates ? Number(metalType === "GOLD" ? rates.GoldSellRatePerGram : rates.SilverSellRatePerGram) : null;
  const heldGrams = portfolio ? (metalType === "GOLD" ? portfolio.goldGrams : portfolio.silverGrams) : 0;

  useEffect(() => {
    Promise.all([getRates(), getPortfolio(), getKycStatus()])
      .then(([ratesData, portfolioData, kycData]) => {
        setRates(ratesData);
        setPortfolio(portfolioData);
        setKycInfo(kycData);
      })
      .catch((error) => Alert.alert("Couldn't load rate", getApiErrorMessage(error)))
      .finally(() => setIsLoadingRates(false));
  }, []);

  function handleAmountChange(text: string) {
    setAmountText(text);
    setLastEdited("amount");
    const numeric = Number(text);
    if (rate && text.trim() !== "" && !Number.isNaN(numeric)) {
      setGramsText((numeric / rate).toFixed(4));
    } else {
      setGramsText("");
    }
  }

  function handleGramsChange(text: string) {
    setGramsText(text);
    setLastEdited("grams");
    const numeric = Number(text);
    if (rate && text.trim() !== "" && !Number.isNaN(numeric)) {
      setAmountText((numeric * rate).toFixed(2));
    } else {
      setAmountText("");
    }
  }

  // Debounced call to the authoritative /redeem/preview endpoint.
  useEffect(() => {
    if (!lastEdited) return;
    const raw = lastEdited === "amount" ? amountText : gramsText;
    const numeric = Number(raw);

    if (raw.trim() === "" || Number.isNaN(numeric) || numeric <= 0) {
      setPreview(null);
      return;
    }

    setIsPreviewLoading(true);
    const timer = setTimeout(() => {
      const input: RedeemPreviewInput =
        lastEdited === "amount" ? { metalType, amount: numeric } : { metalType, grams: numeric };
      previewRedeem(input)
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setIsPreviewLoading(false));
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountText, gramsText, lastEdited, metalType]);

  const exceedsHoldings = preview !== null && preview.grams > heldGrams;

  function validateAddress(): AddressErrors | null {
    const next: AddressErrors = {};
    if (!name.trim()) next.name = "Name is required";
    if (!/^\d{10}$/.test(phone.trim())) next.phone = "Enter a valid 10-digit phone number";
    if (!line1.trim()) next.line1 = "Address line 1 is required";
    if (!city.trim()) next.city = "City is required";
    if (!state.trim()) next.state = "State is required";
    if (!/^\d{6}$/.test(pincode.trim())) next.pincode = "Enter a valid 6-digit pincode";
    return Object.keys(next).length > 0 ? next : null;
  }

  async function handleConfirm() {
    if (!preview) return;
    if (exceedsHoldings) {
      Alert.alert("Not enough holdings", `You only hold ${formatWeight(heldGrams)} of ${metalLabel}.`);
      return;
    }
    const errors = validateAddress();
    if (errors) {
      setAddressErrors(errors);
      Alert.alert("Check delivery address", "Please fill in a valid name, phone, address and pincode.");
      return;
    }
    setAddressErrors({});

    setIsConfirming(true);
    try {
      const redemption = await confirmRedeem({
        metalType,
        grams: preview.grams,
        address: {
          name: name.trim(),
          phone: phone.trim(),
          line1: line1.trim(),
          line2: line2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        },
      });
      navigation.replace("RedeemConfirmation", { redemption });
    } catch (error) {
      if (isKycRequiredError(error)) {
        showKycRequiredAlert(error, () => navigation.navigate("MainTabs", { screen: "ProfileTab", params: { initialTab: "kyc" } }));
      } else {
        Alert.alert("Redemption failed", getApiErrorMessage(error));
      }
    } finally {
      setIsConfirming(false);
    }
  }

  if (isLoadingRates) {
    return <Loader fullscreen label="Loading current rate…" />;
  }

  const isGold = metalType === "GOLD";
  const kycApproved = kycInfo?.kycStatus === "APPROVED";

  if (!kycApproved) {
    return (
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.heldText}>You hold {formatWeight(heldGrams)}</Text>
          </Card>

          <Card style={styles.kycCard}>
            <Text style={styles.kycTitle}>KYC approval required</Text>
            <Text style={styles.kycText}>
              Redeeming physical {metalLabel.toLowerCase()} means we ship real metal to your address, so an approved KYC is
              required first — regardless of your transaction value.
            </Text>
            <Button
              title="Complete KYC"
              onPress={() => navigation.navigate("MainTabs", { screen: "ProfileTab", params: { initialTab: "kyc" } })}
              style={styles.kycButton}
            />
          </Card>
        </ScrollView>
      </View>
    );
  }

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
            Sell rate: {formatCurrency(rate)} <Text style={styles.rateUnit}>/ g</Text>
          </Text>
          <Text style={styles.heldText}>You hold {formatWeight(heldGrams)}</Text>
        </Card>

        <Text style={styles.sectionTitle}>How much to redeem</Text>
        <Input
          label="Grams"
          value={gramsText}
          onChangeText={handleGramsChange}
          keyboardType="decimal-pad"
          placeholder="e.g. 5"
        />
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>
        <Input
          label="Amount (₹)"
          value={amountText}
          onChangeText={handleAmountChange}
          keyboardType="decimal-pad"
          placeholder="e.g. 5000"
        />
        {exceedsHoldings && (
          <Text style={styles.warningText}>You only hold {formatWeight(heldGrams)} of {metalLabel}.</Text>
        )}

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Redemption Summary</Text>
          {isPreviewLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.summaryLoader} />
          ) : preview ? (
            <View>
              <SummaryRow label="Metal" value={metalLabel} />
              <SummaryRow label="Sell rate / gram" value={formatCurrency(preview.currentSellRate)} />
              <SummaryRow label="Approx. value" value={formatCurrency(preview.approxValue)} />
              <SummaryRow label="Holdings after" value={formatWeight(preview.holdingsAfter)} />
              <View style={styles.quantityBox}>
                <Text style={styles.quantityLabel}>Grams to Redeem</Text>
                <Text style={styles.quantityValue}>{formatWeight(preview.grams)}</Text>
              </View>
              <View style={styles.courierBox}>
                <Text style={styles.courierLabel}>Courier charge</Text>
                <Text style={styles.courierValue}>{formatCurrency(preview.courierCharge)}</Text>
              </View>
              <Text style={styles.courierNote}>
                Courier charge is collected on delivery / offline — no online payment.
              </Text>
            </View>
          ) : (
            <Text style={styles.placeholder}>Enter grams or an amount to see the breakdown.</Text>
          )}
        </Card>

        <Text style={styles.sectionTitle}>Delivery address</Text>
        <Card style={styles.addressCard}>
          <Input label="Full Name" value={name} onChangeText={setName} placeholder="Recipient's name" error={addressErrors.name} />
          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="number-pad"
            maxLength={10}
            placeholder="10-digit mobile number"
            error={addressErrors.phone}
          />
          <Input label="Address Line 1" value={line1} onChangeText={setLine1} placeholder="House no., street" error={addressErrors.line1} />
          <Input label="Address Line 2 (optional)" value={line2} onChangeText={setLine2} placeholder="Landmark, area" />
          <Input label="City" value={city} onChangeText={setCity} placeholder="City" error={addressErrors.city} />
          <Input label="State" value={state} onChangeText={setState} placeholder="State" error={addressErrors.state} />
          <Input
            label="Pincode"
            value={pincode}
            onChangeText={setPincode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="6-digit pincode"
            error={addressErrors.pincode}
          />
        </Card>

        <Text style={styles.disclaimer}>
          No payment gateway — the dealer will process and ship this order; courier charges are settled offline.
        </Text>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={isConfirming ? "Processing…" : "Confirm Redemption"}
          onPress={handleConfirm}
          loading={isConfirming}
          disabled={!preview || isPreviewLoading || exceedsHoldings}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
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

  kycCard: { alignItems: "center", padding: spacing.lg },
  kycTitle: { fontSize: 17, fontWeight: "800", color: colors.text, textAlign: "center" },
  kycText: { fontSize: 13, color: colors.textMuted, textAlign: "center", marginTop: spacing.sm, lineHeight: 18 },
  kycButton: { marginTop: spacing.lg, alignSelf: "stretch" },

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
  courierBox: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  courierLabel: { color: colors.text, fontWeight: "700", fontSize: 13 },
  courierValue: { color: colors.primary, fontWeight: "800", fontSize: 15 },
  courierNote: { color: colors.textMuted, fontSize: 11, marginTop: spacing.xs, lineHeight: 15 },

  addressCard: { marginBottom: spacing.lg },

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
