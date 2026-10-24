import { useCallback, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Loader } from "../components/Loader";
import { ScreenHeader } from "../components/ScreenHeader";
import { KycThresholdBanner } from "../components/KycThresholdBanner";
import { MetalIcon } from "../components/MetalIcon";
import { getApiErrorMessage } from "../services/apiClient";
import { getKycStatus, getPortfolio, getRates } from "../services/customerApi";
import type { KycThresholdInfo, MetalRate, MetalType, Portfolio } from "../services/types";
import { formatCurrency, formatWeight } from "../utils/formatters";
import { colors, radius, screenPadding, shadow, spacing } from "../utils/theme";
import type { MainTabScreenProps } from "../navigation/types";

type Props = MainTabScreenProps<"Invest">;

export function InvestScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [rates, setRates] = useState<MetalRate | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [kycInfo, setKycInfo] = useState<KycThresholdInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setIsLoading(true);
    try {
      const [ratesData, portfolioData, kycData] = await Promise.all([getRates(), getPortfolio(), getKycStatus()]);
      setRates(ratesData);
      setPortfolio(portfolioData);
      setKycInfo(kycData);
    } catch (error) {
      Alert.alert("Couldn't load rates", getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(rates === null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load])
  );

  function handleBuy(metalType: MetalType) {
    navigation.navigate("BuyMetal", { metalType });
  }

  function handleSell(metalType: MetalType, heldGrams: number) {
    if (heldGrams <= 0) {
      Alert.alert("Nothing to sell", `You don't hold any ${metalType === "GOLD" ? "Gold" : "Silver"} yet.`);
      return;
    }
    navigation.navigate("SellMetal", { metalType });
  }

  function handleRedeem(metalType: MetalType, heldGrams: number) {
    if (heldGrams <= 0) {
      Alert.alert("Nothing to redeem", `You don't hold any ${metalType === "GOLD" ? "Gold" : "Silver"} yet.`);
      return;
    }
    navigation.navigate("RedeemMetal", { metalType });
  }

  if (isLoading) {
    return <Loader fullscreen label="Loading rates…" />;
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title="Invest"
        subtitle="Buy or sell gold & silver at today's rate"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); load(false); }} />}
      >
        <KycThresholdBanner info={kycInfo} onPress={() => navigation.navigate("ProfileTab", { initialTab: "kyc" })} />

        <MetalInvestCard
          label="Gold"
          variant="gold"
          buyRate={rates?.GoldRatePerGram}
          sellRate={rates?.GoldSellRatePerGram}
          grams={portfolio?.goldGrams ?? 0}
          value={portfolio?.goldValue ?? 0}
          onBuy={() => handleBuy("GOLD")}
          onSell={() => handleSell("GOLD", portfolio?.goldGrams ?? 0)}
          onRedeem={() => handleRedeem("GOLD", portfolio?.goldGrams ?? 0)}
        />
        <MetalInvestCard
          label="Silver"
          variant="silver"
          buyRate={rates?.SilverRatePerGram}
          sellRate={rates?.SilverSellRatePerGram}
          grams={portfolio?.silverGrams ?? 0}
          value={portfolio?.silverValue ?? 0}
          onBuy={() => handleBuy("SILVER")}
          onSell={() => handleSell("SILVER", portfolio?.silverGrams ?? 0)}
          onRedeem={() => handleRedeem("SILVER", portfolio?.silverGrams ?? 0)}
        />

        <Pressable style={styles.sipPromo} onPress={() => navigation.navigate("SIP")}>
          <Text style={styles.sipPromoEmoji}>🔁</Text>
          <View style={styles.sipPromoText}>
            <Text style={styles.sipPromoTitle}>Prefer to invest monthly?</Text>
            <Text style={styles.sipPromoSubtitle}>Start a SIP and auto-invest a fixed amount every month.</Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function MetalInvestCard({
  label,
  variant,
  buyRate,
  sellRate,
  grams,
  value,
  onBuy,
  onSell,
  onRedeem,
}: {
  label: string;
  variant: "gold" | "silver";
  buyRate?: string;
  sellRate?: string;
  grams: number;
  value: number;
  onBuy: () => void;
  onSell: () => void;
  onRedeem: () => void;
}) {
  const isGold = variant === "gold";
  const canSell = grams > 0;
  return (
    <Card
      style={[
        styles.metalCard,
        { backgroundColor: isGold ? colors.goldLight : colors.silverLight, borderColor: isGold ? colors.gold : colors.silverDark },
      ]}
    >
      <View style={styles.metalHeader}>
        <View style={styles.metalLabelRow}>
          <MetalIcon metal={isGold ? "GOLD" : "SILVER"} size={24} />
          <Text style={styles.metalLabel}>{label}</Text>
        </View>
        <View style={styles.metalRateGroup}>
          <View style={styles.metalRateBox}>
            <Text style={styles.metalRateBoxLabel}>Buy</Text>
            <Text style={[styles.metalRateBoxValue, { color: isGold ? colors.goldDark : colors.silverDark }]}>
              {formatCurrency(buyRate)}
            </Text>
          </View>
          <View style={styles.metalRateBox}>
            <Text style={styles.metalRateBoxLabel}>Sell</Text>
            <Text style={styles.metalRateBoxValue}>{formatCurrency(sellRate)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.metalHoldingRow}>
        <Text style={styles.metalHoldingLabel}>You hold</Text>
        <Text style={styles.metalHoldingValue}>
          {formatWeight(grams)} · {formatCurrency(value)}
        </Text>
      </View>
      <View style={styles.metalActions}>
        <Button title={`Buy ${label}`} onPress={onBuy} style={styles.metalActionButton} />
        <Button title="Sell" variant="secondary" onPress={onSell} disabled={!canSell} style={styles.metalActionButton} />
      </View>
      <Button
        title="Redeem for delivery"
        variant="secondary"
        onPress={onRedeem}
        disabled={!canSell}
        style={styles.redeemButton}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: screenPadding },
  metalCard: { borderWidth: 1.5, marginBottom: spacing.md },
  metalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metalLabelRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metalLabel: { fontSize: 16, fontWeight: "800", color: colors.text },
  metalRateGroup: { flexDirection: "row", gap: spacing.md },
  metalRateBox: { alignItems: "flex-end" },
  metalRateBoxLabel: { fontSize: 10, color: colors.textMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  metalRateBoxValue: { fontSize: 15, fontWeight: "800", color: colors.text, marginTop: 1 },
  metalHoldingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  metalHoldingLabel: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  metalHoldingValue: { fontSize: 12, color: colors.text, fontWeight: "700" },
  metalActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  metalActionButton: { flex: 1 },
  redeemButton: { marginTop: spacing.sm },
  sipPromo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.maroon,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    ...shadow.sm,
  },
  sipPromoEmoji: { fontSize: 28 },
  sipPromoText: { flex: 1 },
  sipPromoTitle: { color: colors.white, fontWeight: "800", fontSize: 14 },
  sipPromoSubtitle: { color: "#C9C2AE", fontSize: 12, marginTop: 2, lineHeight: 16 },
});
