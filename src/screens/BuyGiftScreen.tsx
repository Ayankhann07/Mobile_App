import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { MetalIcon } from "../components/MetalIcon";
import { KycThresholdBanner } from "../components/KycThresholdBanner";
import { DEALER_NAME } from "../config";
import { useAuth } from "../hooks/useAuth";
import { fileUrl, getApiErrorMessage, getApiErrorStatus } from "../services/apiClient";
import { buyGift, getKycStatus, getPortfolio, getRates, lookupMobile } from "../services/customerApi";
import type { KycThresholdInfo, LookupMobileResult, MetalRate, Portfolio } from "../services/types";
import { formatCurrency, formatGrams } from "../utils/formatters";
import { colors, gradients, radius, screenPadding, shadow, spacing } from "../utils/theme";
import { isKycRequiredError, showKycRequiredAlert } from "../utils/kyc";
import type { AppStackScreenProps } from "../navigation/types";

type Props = AppStackScreenProps<"BuyGift">;
const MESSAGE_MAX_LENGTH = 200;
const MOBILE_REGEX = /^\d{10}$/;
const LOOKUP_DEBOUNCE_MS = 400;

export function BuyGiftScreen({ route, navigation }: Props) {
  const { template } = route.params;
  const { customer } = useAuth();
  const insets = useSafeAreaInsets();
  const isGold = template.MetalType === "GOLD";
  const metalLabel = isGold ? "Gold" : "Silver";
  const title = template.Title ?? `${metalLabel} Gift`;

  const [imageFailed, setImageFailed] = useState(false);
  const [rates, setRates] = useState<MetalRate | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [kycInfo, setKycInfo] = useState<KycThresholdInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [recipientMobile, setRecipientMobile] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupMobileResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const isOwnNumber = !!customer && recipientMobile.trim() === customer.MobileNumber;

  useEffect(() => {
    Promise.all([getRates(), getPortfolio(), getKycStatus()])
      .then(([rateData, portfolioData, kyc]) => {
        setRates(rateData);
        setPortfolio(portfolioData);
        setKycInfo(kyc);
      })
      .catch((error) => Alert.alert("Couldn't load gift details", getApiErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, []);

  // UPI-style payee-name reveal: only fires once a full 10-digit number is typed, debounced
  // so we don't hammer the API on every keystroke.
  useEffect(() => {
    const trimmed = recipientMobile.trim();
    if (!MOBILE_REGEX.test(trimmed) || trimmed === customer?.MobileNumber) {
      setLookupResult(null);
      setIsLookingUp(false);
      return;
    }
    let isActive = true;
    setIsLookingUp(true);
    const timer = setTimeout(() => {
      lookupMobile(trimmed)
        .then((result) => {
          if (isActive) setLookupResult(result);
        })
        .catch(() => {
          if (isActive) setLookupResult(null);
        })
        .finally(() => {
          if (isActive) setIsLookingUp(false);
        });
    }, LOOKUP_DEBOUNCE_MS);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [recipientMobile, customer?.MobileNumber]);

  const rate = rates ? Number(isGold ? rates.GoldRatePerGram : rates.SilverRatePerGram) : null;
  const estimatedGrams = rate ? Number(template.Amount) / rate : null;
  const heldGrams = portfolio ? (isGold ? portfolio.goldGrams : portfolio.silverGrams) : 0;

  function goToKyc() {
    navigation.navigate("MainTabs", { screen: "ProfileTab", params: { initialTab: "kyc" } });
  }

  async function handleSend() {
    const trimmedMobile = recipientMobile.trim();
    if (!MOBILE_REGEX.test(trimmedMobile)) {
      Alert.alert("Enter a valid number", "Please enter the recipient's 10-digit mobile number.");
      return;
    }
    if (isOwnNumber) {
      Alert.alert("That's your own number", "Enter a different mobile number to send this gift to.");
      return;
    }

    setIsSending(true);
    try {
      const gift = await buyGift({ giftTemplateId: template.id, recipientMobile: trimmedMobile, message: message.trim() || undefined });
      const recipientLabel = gift.recipientName ?? trimmedMobile;
      Alert.alert(
        "Gift sent! 🎁",
        `Your ${metalLabel} gift of ${formatGrams(gift.grams)} has been assigned to ${recipientLabel}. Send them an invite so they know to open it.`,
        [
          {
            text: "Share invite",
            onPress: async () => {
              try {
                await Share.share({ message: gift.shareMessage });
              } finally {
                navigation.replace("MyGifts");
              }
            },
          },
          {
            text: "Copy invite",
            onPress: async () => {
              await Clipboard.setStringAsync(gift.shareMessage);
              navigation.replace("MyGifts");
            },
          },
          { text: "Done", onPress: () => navigation.replace("MyGifts") },
        ]
      );
    } catch (error) {
      if (isKycRequiredError(error)) {
        showKycRequiredAlert(error, goToKyc);
      } else if (getApiErrorStatus(error) === 400) {
        Alert.alert("Couldn't send gift", getApiErrorMessage(error), [
          { text: "Cancel", style: "cancel" },
          { text: `Buy ${metalLabel}`, onPress: () => navigation.navigate("BuyMetal", { metalType: template.MetalType }) },
        ]);
      } else {
        Alert.alert("Couldn't send gift", getApiErrorMessage(error));
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {template.ImagePath && !imageFailed ? (
          <Image
            source={{ uri: fileUrl(template.ImagePath) }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <LinearGradient
            colors={isGold ? gradients.gold : gradients.silver}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.image}
          >
            <Ionicons name="gift" size={48} color={colors.white} />
          </LinearGradient>
        )}

        <Text style={styles.title}>{title}</Text>
        {template.Description ? <Text style={styles.description}>{template.Description}</Text> : null}

        <Card style={[styles.summaryCard, { backgroundColor: isGold ? colors.goldLight : colors.silverLight, borderColor: isGold ? colors.gold : colors.silverDark }]}>
          <View style={styles.summaryRow}>
            <View style={styles.metalRow}>
              <MetalIcon metal={template.MetalType} size={24} />
              <Text style={styles.metalLabel}>{metalLabel}</Text>
            </View>
            <Text style={styles.amount}>{formatCurrency(template.Amount)}</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <>
              <Text style={styles.estimateText}>
                ≈ {estimatedGrams !== null ? formatGrams(estimatedGrams) : "-"} at today&apos;s rate — the exact grams are
                locked in at the moment you send.
              </Text>
              <Text style={styles.holdingsText}>
                You currently hold {formatGrams(heldGrams)} of {metalLabel}
              </Text>
            </>
          )}
        </Card>

        <KycThresholdBanner info={kycInfo} onPress={goToKyc} />

        <Input
          label="Recipient's mobile number"
          value={recipientMobile}
          onChangeText={(text) => setRecipientMobile(text.replace(/[^\d]/g, "").slice(0, 10))}
          placeholder="10-digit mobile number"
          keyboardType="number-pad"
          maxLength={10}
          error={isOwnNumber ? "That's your own number — enter a different one." : undefined}
        />
        {!isOwnNumber && isLookingUp && (
          <View style={styles.lookupRow}>
            <ActivityIndicator size="small" color={colors.textMuted} />
            <Text style={styles.lookupChecking}>Checking…</Text>
          </View>
        )}
        {!isOwnNumber && !isLookingUp && lookupResult?.exists && (
          <View style={styles.lookupRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.lookupFound}>{lookupResult.fullName}</Text>
          </View>
        )}
        {!isOwnNumber && !isLookingUp && lookupResult !== null && !lookupResult.exists && (
          <Text style={styles.lookupNotFound}>
            This number isn&apos;t on {DEALER_NAME} yet — they&apos;ll get an invite to open the gift.
          </Text>
        )}

        <Input
          label="Add a personal message (optional)"
          value={message}
          onChangeText={(text) => setMessage(text.slice(0, MESSAGE_MAX_LENGTH))}
          placeholder="e.g. Happy Diwali! Wishing you prosperity."
          multiline
          numberOfLines={3}
          style={styles.messageInput}
          maxLength={MESSAGE_MAX_LENGTH}
        />
        <Text style={styles.messageCount}>{message.length}/{MESSAGE_MAX_LENGTH}</Text>

        <Text style={styles.disclaimer}>No payment gateway — this sends the gift against your account&apos;s holdings.</Text>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title={isSending ? "Sending…" : "Send Gift"}
          onPress={handleSend}
          loading={isSending}
          disabled={isLoading || !MOBILE_REGEX.test(recipientMobile.trim()) || isOwnNumber}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: screenPadding, paddingBottom: spacing.xl },
  image: { width: "100%", height: 160, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  description: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 18 },
  summaryCard: { borderWidth: 1.5, marginTop: spacing.md, marginBottom: spacing.md },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metalRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metalLabel: { fontSize: 15, fontWeight: "800", color: colors.text },
  amount: { fontSize: 20, fontWeight: "800", color: colors.text },
  loader: { marginTop: spacing.sm },
  estimateText: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },
  holdingsText: { fontSize: 12, color: colors.text, fontWeight: "600", marginTop: spacing.sm },
  lookupRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: -spacing.sm, marginBottom: spacing.md },
  lookupChecking: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  lookupFound: { fontSize: 13, color: colors.success, fontWeight: "700" },
  lookupNotFound: { fontSize: 11, color: colors.textMuted, marginTop: -spacing.sm, marginBottom: spacing.md, lineHeight: 15 },
  messageInput: { minHeight: 80, textAlignVertical: "top" },
  messageCount: { fontSize: 11, color: colors.textMuted, textAlign: "right", marginTop: -spacing.sm, marginBottom: spacing.md },
  disclaimer: { textAlign: "center", color: colors.textMuted, fontSize: 11, marginTop: spacing.xs, paddingHorizontal: spacing.md },
  bottomBar: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.md,
  },
});
