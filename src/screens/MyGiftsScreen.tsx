import { useCallback, useState } from "react";
import { Alert, Animated, FlatList, Pressable, Share, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Loader } from "../components/Loader";
import { StatusBadge } from "../components/StatusBadge";
import { MetalIcon } from "../components/MetalIcon";
import { AppearOnMount } from "../components/AppearOnMount";
import { usePressScale } from "../hooks/usePressScale";
import { getApiErrorMessage } from "../services/apiClient";
import { cancelGift, listGifts } from "../services/customerApi";
import type { Gift } from "../services/types";
import { formatCurrency, formatDate, formatGrams } from "../utils/formatters";
import { buildGiftShareMessage } from "../utils/giftShare";
import { colors, radius, screenPadding, shadow, spacing } from "../utils/theme";
import type { AppStackScreenProps } from "../navigation/types";

type Props = AppStackScreenProps<"MyGifts">;
type Tab = "SENT" | "RECEIVED";

export function MyGiftsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("SENT");
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    listGifts()
      .then(setGifts)
      .catch((error) => Alert.alert("Couldn't load gifts", getApiErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleShare(gift: Gift) {
    try {
      await Share.share({
        message: buildGiftShareMessage({
          senderName: gift.sender.FullName,
          metalType: gift.metalType,
          title: gift.template.Title,
          shareLink: gift.shareLink,
        }),
      });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  }

  async function handleCopyLink(gift: Gift) {
    await Clipboard.setStringAsync(gift.shareLink);
    Alert.alert("Copied", "Gift link copied to clipboard.");
  }

  function handleCancel(gift: Gift) {
    Alert.alert("Cancel this gift?", "The grams you sent will be returned to your holdings.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Cancel gift",
        style: "destructive",
        onPress: async () => {
          setBusyId(gift.id);
          try {
            await cancelGift(gift.id);
            load();
          } catch (error) {
            Alert.alert("Couldn't cancel gift", getApiErrorMessage(error));
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  }

  const filtered = gifts.filter((g) => g.direction === tab);

  return (
    <View style={styles.flex}>
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          <TabButton label="Sent" active={tab === "SENT"} onPress={() => setTab("SENT")} />
          <TabButton label="Received" active={tab === "RECEIVED"} onPress={() => setTab("RECEIVED")} />
        </View>
      </View>

      {isLoading ? (
        <Loader fullscreen label="Loading your gifts…" />
      ) : (
        <AppearOnMount style={styles.flex}>
          <FlatList
            style={styles.flex}
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
            ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
            renderItem={({ item }) =>
              tab === "SENT" ? (
                <SentGiftCard
                  gift={item}
                  isBusy={busyId === item.id}
                  onShare={() => handleShare(item)}
                  onCopyLink={() => handleCopyLink(item)}
                  onCancel={() => handleCancel(item)}
                />
              ) : (
                <ReceivedGiftCard gift={item} />
              )
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyBadge}>
                  <Ionicons name={tab === "SENT" ? "paper-plane-outline" : "gift-outline"} size={30} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>{tab === "SENT" ? "No gifts sent yet" : "No gifts received yet"}</Text>
                <Text style={styles.emptyText}>
                  {tab === "SENT"
                    ? "Send a Gold Lifafa to a friend or family member from the gift store."
                    : "When someone sends you a gift, it will show up here after you open it."}
                </Text>
                {tab === "SENT" && (
                  <Button title="Browse gift store" onPress={() => navigation.navigate("GiftStore")} style={styles.emptyButton} />
                )}
              </View>
            }
          />
        </AppearOnMount>
      )}
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({ toScale: 0.96 });
  return (
    <Pressable style={styles.tabButtonWrap} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.tabButton, active && styles.tabButtonActive, animatedStyle]}>
        <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function SentGiftCard({
  gift,
  isBusy,
  onShare,
  onCopyLink,
  onCancel,
}: {
  gift: Gift;
  isBusy: boolean;
  onShare: () => void;
  onCopyLink: () => void;
  onCancel: () => void;
}) {
  const isUnclaimed = gift.status === "UNCLAIMED";
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({ toScale: 0.97 });
  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.metalRow}>
          <MetalIcon metal={gift.metalType} size={24} />
          <Text style={styles.title}>{gift.template.Title ?? `${gift.metalType === "GOLD" ? "Gold" : "Silver"} Gift`}</Text>
        </View>
        <StatusBadge status={gift.status} />
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountValue}>{formatCurrency(gift.amount)}</Text>
        <Text style={styles.amountSub}>{formatGrams(gift.grams)}</Text>
      </View>

      {gift.status === "CLAIMED" && gift.receiver && (
        <Text style={styles.metaText}>
          Opened by {gift.receiver.FullName} · {formatDate(gift.claimedAt)}
        </Text>
      )}
      {gift.status === "CANCELLED" && <Text style={styles.metaText}>Cancelled — grams returned to your holdings.</Text>}
      {isUnclaimed && (
        <Text style={styles.metaText}>
          Assigned to {gift.recipientName ?? gift.recipientMobile ?? "recipient"} · Sent {formatDate(gift.createdAt)} · waiting to
          be opened
        </Text>
      )}

      {isUnclaimed && (
        <View style={styles.actions}>
          <Button title="Share" onPress={onShare} style={styles.actionButton} />
          <Button title="Copy link" variant="secondary" onPress={onCopyLink} style={styles.actionButton} />
        </View>
      )}
      {isUnclaimed && (
        <Pressable onPress={onCancel} disabled={isBusy} onPressIn={onPressIn} onPressOut={onPressOut}>
          <Animated.View style={[styles.cancelLink, animatedStyle]}>
            <Text style={styles.cancelLinkText}>{isBusy ? "Cancelling…" : "Cancel gift"}</Text>
          </Animated.View>
        </Pressable>
      )}
    </Card>
  );
}

function ReceivedGiftCard({ gift }: { gift: Gift }) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.metalRow}>
          <MetalIcon metal={gift.metalType} size={24} />
          <Text style={styles.title}>{gift.template.Title ?? `${gift.metalType === "GOLD" ? "Gold" : "Silver"} Gift`}</Text>
        </View>
        <StatusBadge status={gift.status} />
      </View>
      <View style={styles.amountRow}>
        <Text style={styles.amountValue}>{formatCurrency(gift.amount)}</Text>
        <Text style={styles.amountSub}>{formatGrams(gift.grams)}</Text>
      </View>
      <Text style={styles.metaText}>From {gift.sender.FullName}</Text>
      {gift.claimedAt && <Text style={styles.metaText}>Opened {formatDate(gift.claimedAt)}</Text>}
      {gift.message && <Text style={styles.messageText}>&ldquo;{gift.message}&rdquo;</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  tabBarWrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: screenPadding,
    paddingVertical: spacing.sm,
  },
  tabBar: { flexDirection: "row", backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4, gap: 4 },
  tabButtonWrap: { flex: 1 },
  tabButton: { paddingVertical: spacing.sm + 2, alignItems: "center", borderRadius: radius.sm },
  tabButtonActive: { backgroundColor: colors.surface, ...shadow.sm },
  tabButtonText: { color: colors.textMuted, fontWeight: "600", fontSize: 14 },
  tabButtonTextActive: { color: colors.primary },

  container: { padding: screenPadding, flexGrow: 1 },
  card: { padding: spacing.md },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metalRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 1 },
  title: { fontSize: 15, fontWeight: "700", color: colors.text, flexShrink: 1 },
  amountRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.xs, marginTop: spacing.sm },
  amountValue: { fontSize: 22, fontWeight: "800", color: colors.primary },
  amountSub: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  metaText: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  messageText: { fontSize: 13, color: colors.text, fontStyle: "italic", marginTop: spacing.sm },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  actionButton: { flex: 1 },
  cancelLink: { marginTop: spacing.sm, alignSelf: "center" },
  cancelLinkText: { color: colors.danger, fontWeight: "700", fontSize: 12 },

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
  emptyText: { color: colors.textMuted, textAlign: "center", paddingHorizontal: spacing.xl, fontSize: 13, marginBottom: spacing.lg },
  emptyButton: { minWidth: 180 },
});
