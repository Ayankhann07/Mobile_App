import { useCallback, useState } from "react";
import { Alert, Animated, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Loader } from "../components/Loader";
import { MetalIcon } from "../components/MetalIcon";
import { KycThresholdBanner } from "../components/KycThresholdBanner";
import { useMountAnimation } from "../hooks/useMountAnimation";
import { usePressScale } from "../hooks/usePressScale";
import { fileUrl, getApiErrorMessage } from "../services/apiClient";
import { getGiftTemplates, getKycStatus, getRates } from "../services/customerApi";
import type { GiftTemplate, KycThresholdInfo, MetalRate } from "../services/types";
import { formatCurrency, formatGrams } from "../utils/formatters";
import { colors, gradients, radius, screenPadding, shadow, spacing } from "../utils/theme";
import type { AppStackScreenProps } from "../navigation/types";

type Props = AppStackScreenProps<"GiftStore">;

export function GiftStoreScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [templates, setTemplates] = useState<GiftTemplate[]>([]);
  const [rates, setRates] = useState<MetalRate | null>(null);
  const [kycInfo, setKycInfo] = useState<KycThresholdInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback((showSpinner: boolean) => {
    if (showSpinner) setIsLoading(true);
    Promise.all([getGiftTemplates(), getRates(), getKycStatus()])
      .then(([templateList, rateData, kyc]) => {
        setTemplates(templateList);
        setRates(rateData);
        setKycInfo(kyc);
      })
      .catch((error) => Alert.alert("Couldn't load gift store", getApiErrorMessage(error)))
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(templates.length === 0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load])
  );

  function estimateGrams(template: GiftTemplate): number | null {
    if (!rates) return null;
    const rate = Number(template.MetalType === "GOLD" ? rates.GoldRatePerGram : rates.SilverRatePerGram);
    if (!rate) return null;
    return Number(template.Amount) / rate;
  }

  function goToKyc() {
    navigation.navigate("MainTabs", { screen: "ProfileTab", params: { initialTab: "kyc" } });
  }

  if (isLoading) {
    return <Loader fullscreen label="Loading gift store…" />;
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={templates}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={templates.length > 0 ? styles.row : undefined}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); load(false); }} />}
        ListHeaderComponent={<GiftStoreHeader kycInfo={kycInfo} onKycPress={goToKyc} onMyGiftsPress={() => navigation.navigate("MyGifts")} />}
        renderItem={({ item }) => (
          <TemplateCard
            template={item}
            estimatedGrams={estimateGrams(item)}
            onPress={() => navigation.navigate("BuyGift", { template: item })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyBadge}>
              <Ionicons name="gift-outline" size={30} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No gift templates yet</Text>
            <Text style={styles.emptyText}>Your dealer hasn&apos;t published any gift envelopes yet. Check back soon.</Text>
          </View>
        }
      />
    </View>
  );
}

function GiftStoreHeader({
  kycInfo,
  onKycPress,
  onMyGiftsPress,
}: {
  kycInfo: KycThresholdInfo | null;
  onKycPress: () => void;
  onMyGiftsPress: () => void;
}) {
  const mountAnim = useMountAnimation();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({ toScale: 0.95 });

  return (
    <Animated.View style={mountAnim}>
      <Text style={styles.introTitle}>Gold Lifafa</Text>
      <Text style={styles.introText}>
        Send gold or silver as a gift envelope — your loved ones scratch it open and the metal lands straight in their
        portfolio.
      </Text>
      <KycThresholdBanner info={kycInfo} onPress={onKycPress} />
      <View style={styles.quickLinks}>
        <Pressable onPress={onMyGiftsPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <Animated.View style={[styles.quickLink, animatedStyle]}>
            <Ionicons name="albums-outline" size={16} color={colors.primary} />
            <Text style={styles.quickLinkText}>My Gifts</Text>
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function TemplateCard({
  template,
  estimatedGrams,
  onPress,
}: {
  template: GiftTemplate;
  estimatedGrams: number | null;
  onPress: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const isGold = template.MetalType === "GOLD";
  const title = template.Title ?? (isGold ? "Gold Gift" : "Silver Gift");
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({ toScale: 0.96 });

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.cardWrap}>
      <Animated.View style={[styles.card, animatedStyle]}>
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
          <Ionicons name="gift" size={40} color={colors.white} />
        </LinearGradient>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        {template.Description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {template.Description}
          </Text>
        ) : null}
        <View style={styles.metalRow}>
          <MetalIcon metal={template.MetalType} size={22} />
          <Text style={styles.amount}>{formatCurrency(template.Amount)}</Text>
        </View>
        {estimatedGrams !== null && <Text style={styles.gramsEstimate}>~{formatGrams(estimatedGrams)}</Text>}
      </View>
      </Animated.View>
    </Pressable>
  );
}

const CARD_GAP = spacing.md;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: screenPadding, flexGrow: 1 },
  row: { gap: CARD_GAP },
  introTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  introText: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 18 },
  quickLinks: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 4,
    ...shadow.sm,
  },
  quickLinkText: { fontSize: 12, fontWeight: "700", color: colors.primary },

  cardWrap: { flex: 1, marginBottom: CARD_GAP },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.sm,
  },
  image: { width: "100%", height: 110, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" },
  cardBody: { padding: spacing.sm + 2 },
  cardTitle: { fontSize: 13, fontWeight: "800", color: colors.text },
  cardDescription: { fontSize: 11, color: colors.textMuted, marginTop: 2, lineHeight: 15 },
  metalRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm },
  amount: { fontSize: 15, fontWeight: "800", color: colors.text },
  gramsEstimate: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: "600" },

  empty: { alignItems: "center", justifyContent: "center", paddingTop: spacing.xl * 2 },
  emptyBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  emptyText: { color: colors.textMuted, textAlign: "center", paddingHorizontal: spacing.xl, fontSize: 13 },
});
