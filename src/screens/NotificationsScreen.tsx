import { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Card } from "../components/Card";
import { Loader } from "../components/Loader";
import { MetalIcon } from "../components/MetalIcon";
import { markGiftSeen } from "../services/customerApi";
import { useIncomingGifts } from "../hooks/useIncomingGifts";
import type { IncomingGift } from "../services/types";
import { formatCurrency, formatDate, formatGrams } from "../utils/formatters";
import { colors, radius, screenPadding, spacing } from "../utils/theme";
import type { AppStackScreenProps } from "../navigation/types";

type Props = AppStackScreenProps<"Notifications">;

export function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { gifts, isLoading, refresh } = useIncomingGifts();

  // Viewing this list clears the notification badge: mark whatever's still unseen once the
  // fresh list lands, then refresh again so the badge count (and each card's "new" dot) update.
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        const data = await refresh();
        const unseen = data.filter((g) => !g.seen);
        if (unseen.length === 0 || !isActive) return;
        await Promise.all(unseen.map((g) => markGiftSeen(g.id).catch(() => {})));
        if (isActive) refresh();
      })();
      return () => {
        isActive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  function openGift(gift: IncomingGift) {
    navigation.navigate("OpenGift", { giftId: gift.id });
  }

  return (
    <View style={styles.flex}>
      {isLoading ? (
        <Loader fullscreen label="Loading notifications…" />
      ) : (
        <FlatList
          data={gifts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => <NotificationCard gift={item} onPress={() => openGift(item)} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyBadge}>
                <Ionicons name="gift-outline" size={30} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No gifts waiting for you right now.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function NotificationCard({ gift, onPress }: { gift: IncomingGift; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.metalRow}>
            <MetalIcon metal={gift.metalType} size={24} />
            <Text style={styles.title}>{gift.title ?? `${gift.metalType === "GOLD" ? "Gold" : "Silver"} Gift`}</Text>
          </View>
          {!gift.seen && <View style={styles.newDot} />}
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountValue}>{formatCurrency(gift.amount)}</Text>
          <Text style={styles.amountSub}>{formatGrams(gift.grams)}</Text>
        </View>

        <Text style={styles.metaText}>
          From {gift.senderName} · {formatDate(gift.createdAt)}
        </Text>
        {gift.message && <Text style={styles.messageText}>&ldquo;{gift.message}&rdquo;</Text>}

        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>Tap to scratch and open</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: screenPadding, flexGrow: 1 },
  card: { padding: spacing.md },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metalRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 1 },
  title: { fontSize: 15, fontWeight: "700", color: colors.text, flexShrink: 1 },
  newDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger },
  amountRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.xs, marginTop: spacing.sm },
  amountValue: { fontSize: 22, fontWeight: "800", color: colors.primary },
  amountSub: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  metaText: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  messageText: { fontSize: 13, color: colors.text, fontStyle: "italic", marginTop: spacing.sm },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ctaText: { fontSize: 12, fontWeight: "700", color: colors.primary },

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
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.text, textAlign: "center", paddingHorizontal: spacing.xl },
});
