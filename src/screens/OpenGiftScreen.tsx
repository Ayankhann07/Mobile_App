import { useEffect, useState } from "react";
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Loader } from "../components/Loader";
import { MetalIcon } from "../components/MetalIcon";
import { ScratchCard } from "../components/ScratchCard";
import { SparkleBurst } from "../components/SparkleBurst";
import { useIncomingGifts } from "../hooks/useIncomingGifts";
import { useMountAnimation } from "../hooks/useMountAnimation";
import { useSound } from "../hooks/useSound";
import { getApiErrorMessage } from "../services/apiClient";
import { claimGift, getGiftPreview, getGiftPreviewById } from "../services/customerApi";
import type { GiftClaimResult, GiftPreview, MetalType } from "../services/types";
import { formatCurrency, formatGrams } from "../utils/formatters";
import { colors, gradients, radius, screenPadding, spacing } from "../utils/theme";
import type { AppStackScreenProps } from "../navigation/types";

type Props = AppStackScreenProps<"OpenGift">;
const SCRATCH_HEIGHT = 300;

/** Reached only via a notification item (giftId) or the saigems://gift/<CODE> deep link (code) — there is no manual code-entry UI. */
export function OpenGiftScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = width - screenPadding * 2;
  const { refresh: refreshIncomingGifts } = useIncomingGifts();
  const { playRevealChime } = useSound();
  const code = route.params?.code ?? null;
  const giftId = route.params?.giftId ?? null;

  const [isLoadingPreview, setIsLoadingPreview] = useState(!!code || !!giftId);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GiftPreview | null>(null);

  const [hasRevealed, setHasRevealed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<GiftClaimResult | null>(null);

  useEffect(() => {
    if (!code && !giftId) return;
    setIsLoadingPreview(true);
    setPreviewError(null);
    setPreview(null);
    setHasRevealed(false);
    setClaimResult(null);
    setClaimError(null);
    const fetchPreview = giftId !== null ? getGiftPreviewById(giftId) : getGiftPreview(code!);
    fetchPreview
      .then(setPreview)
      .catch((error) => setPreviewError(getApiErrorMessage(error)))
      .finally(() => setIsLoadingPreview(false));
  }, [code, giftId]);

  async function attemptClaim() {
    setIsClaiming(true);
    setClaimError(null);
    try {
      const result = await claimGift(giftId !== null ? { giftId } : { code: code! });
      setClaimResult(result);
      refreshIncomingGifts();
    } catch (error) {
      setClaimError(getApiErrorMessage(error));
    } finally {
      setIsClaiming(false);
    }
  }

  async function handleRevealed() {
    setHasRevealed(true);
    playRevealChime();
    if (!code && !giftId) return;
    await attemptClaim();
  }

  async function handleRetryClaim() {
    if (!code && !giftId) return;
    await attemptClaim();
  }

  if (!code && !giftId) {
    return (
      <View style={styles.centeredContainer}>
        <View style={styles.entryIconWrap}>
          <Ionicons name="gift-outline" size={40} color={colors.gold} />
        </View>
        <Text style={styles.entryTitle}>Open a Gold Lifafa</Text>
        <Text style={styles.entryText}>
          Gifts open from the notification bell once someone sends you one, or from the link they share — there&apos;s no
          code to type in.
        </Text>
        <Button title="Back to Gift Store" onPress={() => navigation.replace("GiftStore")} style={styles.entryButton} />
      </View>
    );
  }

  if (isLoadingPreview) {
    return <Loader fullscreen label="Loading gift…" />;
  }

  if (previewError) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="close-circle-outline" size={40} color={colors.danger} />
        <Text style={styles.errorTitle}>{previewError}</Text>
        <Button title="Back to Gift Store" onPress={() => navigation.replace("GiftStore")} style={styles.entryButton} />
      </View>
    );
  }

  if (!preview) return null;

  if (preview.isOwnGift) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="information-circle-outline" size={40} color={colors.textMuted} />
        <Text style={styles.errorTitle}>You can&apos;t open your own gift.</Text>
        <Button title="Back to Gift Store" onPress={() => navigation.replace("GiftStore")} style={styles.entryButton} />
      </View>
    );
  }

  if (preview.alreadyClaimed) {
    const text = preview.status === "CANCELLED" ? "This gift was cancelled by the sender." : "This gift has already been opened.";
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="mail-open-outline" size={40} color={colors.textMuted} />
        <Text style={styles.errorTitle}>{text}</Text>
        <Button title="Back to Gift Store" onPress={() => navigation.replace("GiftStore")} style={styles.entryButton} />
      </View>
    );
  }

  const senderName = claimResult?.senderName ?? preview.senderName;
  const metalType: MetalType = claimResult?.metalType ?? preview.metalType;
  const amount = claimResult?.amount ?? preview.amount;
  const grams = claimResult?.grams ?? preview.grams;

  return (
    <ScrollView contentContainerStyle={[styles.revealContainer, { paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.scratchWrap}>
        <ScratchCard width={cardWidth} height={SCRATCH_HEIGHT} onRevealed={handleRevealed}>
          <RevealedGiftContent senderName={senderName} metalType={metalType} amount={amount} grams={grams} message={preview.message} />
        </ScratchCard>
        <View style={styles.sparkleOverlay} pointerEvents="none">
          <SparkleBurst active={hasRevealed} />
        </View>
      </View>

      {hasRevealed && (
        <View style={styles.postReveal}>
          {isClaiming && (
            <View style={styles.claimingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.claimingText}>Adding this to your portfolio…</Text>
            </View>
          )}
          {claimError && !claimResult && (
            <Card style={styles.claimErrorCard}>
              <Text style={styles.claimErrorText}>{claimError}</Text>
              <Button title="Try again" onPress={handleRetryClaim} loading={isClaiming} style={styles.entryButton} />
            </Card>
          )}
          {claimResult && (
            <CelebrationBlock
              senderName={senderName}
              metalType={metalType}
              amount={amount}
              grams={grams}
              onViewPortfolio={() => navigation.navigate("MainTabs", { screen: "Home" })}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
}

function RevealedGiftContent({
  senderName,
  metalType,
  amount,
  grams,
  message,
}: {
  senderName: string;
  metalType: MetalType;
  amount: number;
  grams: number;
  message: string | null;
}) {
  return (
    <LinearGradient colors={gradients.heroLight} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.revealCard}>
      <Text style={styles.revealSender}>{senderName} sent you a gift!</Text>
      <View style={styles.revealMetalRow}>
        <MetalIcon metal={metalType} size={44} />
        <View>
          <Text style={styles.revealGrams}>{formatGrams(grams)}</Text>
          <Text style={styles.revealValue}>{formatCurrency(amount)}</Text>
        </View>
      </View>
      {message ? <Text style={styles.revealMessage}>&ldquo;{message}&rdquo;</Text> : null}
    </LinearGradient>
  );
}

function CelebrationBlock({
  senderName,
  metalType,
  amount,
  grams,
  onViewPortfolio,
}: {
  senderName: string;
  metalType: MetalType;
  amount: number;
  grams: number;
  onViewPortfolio: () => void;
}) {
  const mountAnim = useMountAnimation({ distance: 10 });
  return (
    <Animated.View style={[styles.celebrationWrap, mountAnim]}>
      <Text style={styles.celebrationTitle}>🎉 {senderName} sent you a gift!</Text>
      <Text style={styles.celebrationSubtitle}>
        {formatGrams(grams)} of {metalType === "GOLD" ? "Gold" : "Silver"} ({formatCurrency(amount)}) has been added to your
        portfolio.
      </Text>
      <Button title="View Portfolio" onPress={onViewPortfolio} style={styles.entryButton} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  entryIconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.goldLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  entryTitle: { fontSize: 20, fontWeight: "800", color: colors.text, textAlign: "center" },
  entryText: { fontSize: 13, color: colors.textMuted, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.lg },
  entryButton: { marginTop: spacing.sm, alignSelf: "stretch" },

  centeredContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: screenPadding, backgroundColor: colors.background },
  errorTitle: { fontSize: 15, fontWeight: "700", color: colors.text, textAlign: "center", marginTop: spacing.md, marginBottom: spacing.sm },

  revealContainer: { flexGrow: 1, padding: screenPadding, alignItems: "center" },
  scratchWrap: { borderRadius: radius.xl, overflow: "hidden" },
  sparkleOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  revealCard: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  revealSender: { fontSize: 15, fontWeight: "800", color: colors.maroon, textAlign: "center", marginBottom: spacing.md },
  revealMetalRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  revealGrams: { fontSize: 24, fontWeight: "800", color: colors.text },
  revealValue: { fontSize: 14, fontWeight: "700", color: colors.textMuted, marginTop: 2 },
  revealMessage: { fontSize: 13, color: colors.text, fontStyle: "italic", textAlign: "center", marginTop: spacing.md, paddingHorizontal: spacing.md },

  postReveal: { alignItems: "center", marginTop: spacing.lg, width: "100%" },
  claimingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  claimingText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  claimErrorCard: { alignItems: "center", width: "100%" },
  claimErrorText: { color: colors.danger, fontSize: 13, fontWeight: "600", textAlign: "center" },
  celebrationWrap: { alignItems: "center", width: "100%" },
  celebrationTitle: { fontSize: 20, fontWeight: "800", color: colors.text, textAlign: "center" },
  celebrationSubtitle: { fontSize: 13, color: colors.textMuted, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.sm, lineHeight: 18 },
});
