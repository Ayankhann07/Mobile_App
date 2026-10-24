import { useCallback, useState } from "react";
import { Alert, Animated, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { Card } from "../components/Card";
import { StatusBadge } from "../components/StatusBadge";
import { KycThresholdBanner } from "../components/KycThresholdBanner";
import { MetalIcon } from "../components/MetalIcon";
import { NotificationBell } from "../components/NotificationBell";
import { AnimatedValue } from "../components/AnimatedValue";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../hooks/useAuth";
import { useIncomingGifts } from "../hooks/useIncomingGifts";
import { useSound } from "../hooks/useSound";
import { useMountAnimation } from "../hooks/useMountAnimation";
import { usePressScale } from "../hooks/usePressScale";
import { getApiErrorMessage } from "../services/apiClient";
import { getKycStatus, getPortfolio } from "../services/customerApi";
import type { KycThresholdInfo, MetalType, Portfolio } from "../services/types";
import { formatCurrency, formatGrams } from "../utils/formatters";
import { colors, gradients, radius, screenPadding, shadow, spacing } from "../utils/theme";
import type { MainTabScreenProps } from "../navigation/types";

type Props = MainTabScreenProps<"Home">;

export function DashboardScreen({ navigation }: Props) {
  const { customer, logout } = useAuth();
  const { refresh: refreshIncomingGifts } = useIncomingGifts();
  const { playCoinChime } = useSound();
  const insets = useSafeAreaInsets();
  const [kycInfo, setKycInfo] = useState<KycThresholdInfo | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [kycData, portfolioData] = await Promise.all([getKycStatus(), getPortfolio()]);
      setKycInfo(kycData);
      setPortfolio(portfolioData);
    } catch (error) {
      Alert.alert("Couldn't load dashboard", getApiErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      refreshIncomingGifts();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load])
  );

  function handleRefresh() {
    setIsRefreshing(true);
    load();
  }

  function handleLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);
  }

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

  const isPortfolioLoaded = portfolio !== null;
  const hasHoldings = isPortfolioLoaded && (portfolio.goldGrams > 0 || portfolio.silverGrams > 0);
  const firstName = customer?.FullName?.split(" ")[0] ?? "there";

  const heroAnim = useMountAnimation({ delay: 0 });
  const holdingsAnim = useMountAnimation({ delay: 70 });
  const actionsAnim = useMountAnimation({ delay: 140 });
  const linksAnim = useMountAnimation({ delay: 200 });

  return (
    <View style={styles.flex}>
      <StatusBar style="dark" />

      {/* Pinned header — stays fixed while content below scrolls, matching ScreenHeader elsewhere. */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.menuButton}
            hitSlop={8}
          >
            <Ionicons name="menu" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerBrand}>
            <Image source={require("../../assets/sai_gems.jpg")} style={styles.headerLogo} />
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.name}>{firstName}</Text>
            </View>
          </View>
          <NotificationBell />
          <Pressable onPress={handleLogout} style={styles.logoutButton} hitSlop={8}>
            <Ionicons name="log-out-outline" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.container,
          { paddingTop: spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <KycThresholdBanner
          info={kycInfo}
          onPress={() => navigation.navigate("ProfileTab", { initialTab: "kyc" })}
        />

        <Animated.View style={heroAnim}>
          <LinearGradient colors={gradients.heroLight} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <Text style={styles.heroLabel}>Total Portfolio Value</Text>
              <View style={styles.heroIconBadge}>
                <Ionicons name="trending-up" size={14} color={colors.goldDark} />
              </View>
            </View>

            {isPortfolioLoaded ? (
              <AnimatedValue
                value={portfolio.totalValue}
                format={formatCurrency}
                duration={1000}
                onComplete={playCoinChime}
                style={styles.heroValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              />
            ) : (
              <Skeleton width={170} height={32} style={styles.heroValueSkeleton} />
            )}

            {!isPortfolioLoaded ? (
              <View style={styles.heroSplitRow}>
                <Skeleton width={70} height={14} />
                <View style={styles.heroDivider} />
                <Skeleton width={70} height={14} />
              </View>
            ) : hasHoldings ? (
              <View style={styles.heroSplitRow}>
                <View style={styles.heroSplitItem}>
                  <MetalIcon metal="GOLD" size={20} />
                  <AnimatedValue
                    value={portfolio.goldGrams}
                    format={formatGrams}
                    duration={900}
                    delay={150}
                    style={styles.heroSplitText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  />
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroSplitItem}>
                  <MetalIcon metal="SILVER" size={20} />
                  <AnimatedValue
                    value={portfolio.silverGrams}
                    format={formatGrams}
                    duration={900}
                    delay={200}
                    style={styles.heroSplitText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  />
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.heroEmptyText}>
                  You haven&apos;t invested yet — buy gold or silver to start building your portfolio.
                </Text>
                <HeroCta onPress={() => handleBuy("GOLD")} />
              </>
            )}
          </LinearGradient>
        </Animated.View>

        <Animated.View style={holdingsAnim}>
          <Text style={styles.sectionTitle}>My Holdings</Text>
          <View style={styles.holdingsStack}>
            <HoldingCard
              label="Gold"
              metal="GOLD"
              variant="gold"
              grams={portfolio?.goldGrams ?? 0}
              value={portfolio?.goldValue ?? 0}
              isLoading={!isPortfolioLoaded}
              staggerIndex={0}
              onSell={() => handleSell("GOLD", portfolio?.goldGrams ?? 0)}
              onRedeem={() => handleRedeem("GOLD", portfolio?.goldGrams ?? 0)}
            />
            <HoldingCard
              label="Silver"
              metal="SILVER"
              variant="silver"
              grams={portfolio?.silverGrams ?? 0}
              value={portfolio?.silverValue ?? 0}
              isLoading={!isPortfolioLoaded}
              staggerIndex={1}
              onSell={() => handleSell("SILVER", portfolio?.silverGrams ?? 0)}
              onRedeem={() => handleRedeem("SILVER", portfolio?.silverGrams ?? 0)}
            />
          </View>
        </Animated.View>

        <Animated.View style={actionsAnim}>
          <Text style={styles.sectionTitle}>Invest now</Text>
          <View style={styles.actionRow}>
            <ActionTile label="Buy Gold" metal="GOLD" colorsPair={gradients.gold} onPress={() => handleBuy("GOLD")} />
            <ActionTile label="Buy Silver" metal="SILVER" colorsPair={gradients.silver} onPress={() => handleBuy("SILVER")} />
            <ActionTile label="Start SIP" emoji="🔁" colorsPair={gradients.hero} onPress={() => navigation.navigate("SIP")} />
          </View>
        </Animated.View>

        <Animated.View style={linksAnim}>
          <View style={styles.linkRow}>
            <LinkTile emoji="🧾" label="History" onPress={() => navigation.navigate("History")} />
            <LinkTile emoji="🔁" label="My SIPs" onPress={() => navigation.navigate("SIP")} />
            <LinkTile emoji="🎁" label="Gifts" onPress={() => navigation.navigate("GiftStore")} />
            <LinkTile
              emoji="👤"
              label="Profile"
              onPress={() => navigation.navigate("ProfileTab")}
              badge={kycInfo && kycInfo.kycStatus !== "NONE" ? <StatusBadge status={kycInfo.kycStatus} /> : null}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function HeroCta({ onPress }: { onPress: () => void }) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.heroCta, animatedStyle]}>
        <Text style={styles.heroCtaText}>Start investing</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.maroon} />
      </Animated.View>
    </Pressable>
  );
}

function LinkTile({
  emoji,
  label,
  onPress,
  badge,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
  badge?: React.ReactNode;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({ toScale: 0.95 });
  return (
    <Pressable style={styles.linkCardWrap} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.linkCard, animatedStyle]}>
        <Text style={styles.linkEmoji}>{emoji}</Text>
        <Text style={styles.linkLabel}>{label}</Text>
        {badge ? <View style={styles.statusBadgeContainer}>{badge}</View> : null}
      </Animated.View>
    </Pressable>
  );
}

function HoldingCard({
  label,
  metal,
  variant,
  grams,
  value,
  isLoading,
  staggerIndex,
  onSell,
  onRedeem,
}: {
  label: string;
  metal: MetalType;
  variant: "gold" | "silver";
  grams: number;
  value: number;
  isLoading: boolean;
  staggerIndex: number;
  onSell: () => void;
  onRedeem: () => void;
}) {
  const isGold = variant === "gold";
  const accent = isGold ? colors.goldDark : colors.silverDark;
  const canSell = !isLoading && grams > 0;
  const sellPress = usePressScale();
  const redeemPress = usePressScale();

  return (
    <Card
      style={[
        styles.holdingCard,
        { backgroundColor: isGold ? colors.goldLight : colors.silverLight },
      ]}
    >
      <View style={styles.holdingTopRow}>
        <View style={styles.holdingMetalWrap}>
          <MetalIcon metal={metal} size={32} />
          <Text style={styles.holdingLabel}>{label}</Text>
        </View>
        <View style={styles.holdingPillGroup}>
          <Pressable
            onPress={onRedeem}
            disabled={!canSell}
            onPressIn={canSell ? redeemPress.onPressIn : undefined}
            onPressOut={canSell ? redeemPress.onPressOut : undefined}
          >
            <Animated.View
              style={[styles.redeemPill, !canSell && styles.sellPillDisabled, canSell && redeemPress.animatedStyle]}
            >
              <Text style={[styles.redeemPillText, !canSell && styles.sellPillTextDisabled]}>Redeem</Text>
            </Animated.View>
          </Pressable>
          <Pressable
            onPress={onSell}
            disabled={!canSell}
            onPressIn={canSell ? sellPress.onPressIn : undefined}
            onPressOut={canSell ? sellPress.onPressOut : undefined}
          >
            <Animated.View style={[styles.sellPill, !canSell && styles.sellPillDisabled, canSell && sellPress.animatedStyle]}>
              <Text style={[styles.sellPillText, !canSell && styles.sellPillTextDisabled]}>Sell</Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>

      <Text style={styles.holdingCaption}>Holdings</Text>
      {isLoading ? (
        <Skeleton width={90} height={17} style={styles.holdingGramsSkeleton} />
      ) : (
        <AnimatedValue
          value={grams}
          format={formatGrams}
          duration={900}
          delay={120 + staggerIndex * 40}
          style={styles.holdingGrams}
          numberOfLines={1}
          adjustsFontSizeToFit
        />
      )}

      {isLoading ? (
        <Skeleton width={80} height={16} style={styles.holdingValueSkeleton} />
      ) : (
        <AnimatedValue
          value={value}
          format={formatCurrency}
          duration={900}
          delay={200 + staggerIndex * 40}
          style={[styles.holdingValue, { color: accent }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        />
      )}
    </Card>
  );
}

function ActionTile({
  label,
  emoji,
  metal,
  colorsPair,
  disabled,
  onPress,
}: {
  label: string;
  emoji?: string;
  metal?: MetalType;
  colorsPair: readonly [string, string];
  disabled?: boolean;
  onPress: () => void;
}) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      style={[styles.actionTileWrap, !disabled && shadow.sm]}
    >
      <Animated.View style={!disabled && animatedStyle}>
        <LinearGradient
          colors={disabled ? [colors.border, colors.borderStrong] : colorsPair}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionTile}
        >
          {metal ? (
            <View style={styles.actionTileIcon}>
              <MetalIcon metal={metal} size={32} />
            </View>
          ) : (
            <Text style={styles.actionTileEmoji}>{emoji}</Text>
          )}
          <Text style={[styles.actionTileLabel, disabled && styles.actionTileLabelDisabled]}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: screenPadding },

  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: screenPadding,
    paddingBottom: spacing.md,
    ...shadow.sm,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerBrand: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  headerLogo: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  greeting: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  name: { fontSize: 17, fontWeight: "800", color: colors.text, marginTop: 1 },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  heroCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.lg,
  },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroLabel: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  heroIconBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.goldLight,
    alignItems: "center",
    justifyContent: "center",
  },
  heroValue: { fontSize: 32, fontWeight: "800", color: colors.gold, marginTop: spacing.xs },
  heroValueSkeleton: { marginTop: spacing.sm + 2, marginBottom: 2 },
  heroSplitRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm + 2 },
  heroSplitItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 1 },
  heroSplitText: { color: colors.text, fontSize: 12, fontWeight: "700", flexShrink: 1 },
  heroDivider: { width: 1, height: 12, backgroundColor: colors.border, marginHorizontal: spacing.md },
  heroEmptyText: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  heroCtaText: { color: colors.maroon, fontWeight: "800", fontSize: 13 },

  holdingsStack: { gap: spacing.sm },
  // Same treatment as heroCard: no border, just soft rounded corners + elevation.
  holdingCard: { borderWidth: 0, paddingVertical: 12, paddingHorizontal: 14, ...shadow.lg },
  holdingTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  holdingMetalWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 1 },
  holdingPillGroup: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 0 },
  holdingLabel: { fontSize: 15, fontWeight: "800", color: colors.text },
  holdingCaption: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: spacing.xs + 2,
  },
  holdingGrams: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: 2 },
  holdingGramsSkeleton: { marginTop: 6 },
  holdingValue: { fontSize: 17, fontWeight: "800", marginTop: 2 },
  holdingValueSkeleton: { marginTop: 6 },
  sellPill: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.full,
    backgroundColor: colors.maroon,
    flexShrink: 0,
  },
  sellPillDisabled: { backgroundColor: colors.border },
  sellPillText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  sellPillTextDisabled: { color: colors.textMuted },
  redeemPill: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.maroon,
    flexShrink: 0,
  },
  redeemPillText: { color: colors.maroon, fontSize: 12, fontWeight: "700" },

  actionRow: { flexDirection: "row", gap: spacing.sm },
  actionTileWrap: { flex: 1, borderRadius: radius.lg },
  actionTile: {
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 4,
    alignItems: "center",
  },
  actionTileEmoji: { fontSize: 24, marginBottom: spacing.xs },
  actionTileIcon: { marginBottom: spacing.xs },
  actionTileLabel: { color: colors.white, fontWeight: "800", fontSize: 12, textAlign: "center" },
  actionTileLabelDisabled: { color: colors.textMuted },

  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.sm,
    marginTop: spacing.lg,
  },
  linkCardWrap: { flexBasis: "48%" },
  linkCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 0,
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: spacing.xs + 2,
    ...shadow.md,
  },
  linkEmoji: { fontSize: 26 },
  linkLabel: { fontSize: 13, fontWeight: "700", color: colors.text },
  statusBadgeContainer: { marginTop: 2 },
});
