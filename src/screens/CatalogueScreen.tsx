import { useCallback, useState } from "react";
import { Alert, Animated, FlatList, Image, Modal, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Loader } from "../components/Loader";
import { AppearOnMount } from "../components/AppearOnMount";
import { usePressScale } from "../hooks/usePressScale";
import { fileUrl, getApiErrorMessage } from "../services/apiClient";
import { getCatalogue } from "../services/customerApi";
import type { CatalogueItem } from "../services/types";
import { formatDate } from "../utils/formatters";
import { colors, radius, screenPadding, shadow, spacing } from "../utils/theme";

export function CatalogueScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogueItem | null>(null);

  const load = useCallback((showSpinner: boolean) => {
    if (showSpinner) setIsLoading(true);
    getCatalogue()
      .then(setItems)
      .catch((error) => Alert.alert("Couldn't load catalogue", getApiErrorMessage(error)))
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(items.length === 0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load])
  );

  function handleRefresh() {
    setIsRefreshing(true);
    load(false);
  }

  if (isLoading) {
    return <Loader fullscreen label="Loading catalogue…" />;
  }

  return (
    <View style={styles.flex}>
      <AppearOnMount style={styles.flex}>
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={items.length > 0 ? styles.row : undefined}
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          ListHeaderComponent={
            <Text style={styles.introText}>Browse our dealer&apos;s latest collection, newest first.</Text>
          }
          renderItem={({ item }) => <CatalogueCard item={item} onPress={() => setSelectedItem(item)} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyBadge}>
                <Ionicons name="images-outline" size={30} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No catalogue items yet</Text>
              <Text style={styles.emptyText}>Check back soon — your dealer hasn&apos;t added any items yet.</Text>
            </View>
          }
        />
      </AppearOnMount>

      <CatalogueDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </View>
  );
}

function CatalogueCard({ item, onPress }: { item: CatalogueItem; onPress: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({ toScale: 0.96 });

  return (
    <Pressable style={styles.cardWrap} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {imageFailed ? (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={28} color={colors.textMuted} />
            <Text style={styles.imageFallbackText}>Image unavailable</Text>
          </View>
        ) : (
          <Image
            source={{ uri: fileUrl(item.ImagePath) }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        )}
        <View style={styles.cardBody}>
          {item.Title ? (
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.Title}
            </Text>
          ) : null}
          {item.Description ? (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.Description}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

function CatalogueDetailModal({ item, onClose }: { item: CatalogueItem | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Modal visible={!!item} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.modalHandle} />
          {item && (
            <>
              {imageFailed ? (
                <View style={[styles.imageFallback, styles.modalImage]}>
                  <Ionicons name="image-outline" size={36} color={colors.textMuted} />
                  <Text style={styles.imageFallbackText}>Image unavailable</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: fileUrl(item.ImagePath) }}
                  style={styles.modalImage}
                  resizeMode="cover"
                  onError={() => setImageFailed(true)}
                />
              )}
              <View style={styles.modalBody}>
                {item.Title ? <Text style={styles.modalTitle}>{item.Title}</Text> : null}
                {item.Description ? <Text style={styles.modalDescription}>{item.Description}</Text> : null}
                <Text style={styles.modalDate}>Added {formatDate(item.CreatedAt)}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const CARD_GAP = spacing.md;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: screenPadding, flexGrow: 1 },
  introText: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
  row: { gap: CARD_GAP },

  cardWrap: { flex: 1, marginBottom: CARD_GAP },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadow.sm,
  },
  image: { width: "100%", height: 130, backgroundColor: colors.surfaceAlt },
  imageFallback: {
    width: "100%",
    height: 130,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  imageFallbackText: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  cardBody: { padding: spacing.sm + 2 },
  cardTitle: { fontSize: 13, fontWeight: "800", color: colors.text },
  cardDescription: { fontSize: 11, color: colors.textMuted, marginTop: 2, lineHeight: 15 },

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

  modalBackdrop: { flex: 1, backgroundColor: "rgba(28,34,48,0.55)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalImage: { width: "100%", height: 220 },
  modalBody: { padding: screenPadding },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  modalDescription: { fontSize: 14, color: colors.text, marginTop: spacing.sm, lineHeight: 20 },
  modalDate: { fontSize: 11, color: colors.textMuted, marginTop: spacing.md },
  modalCloseButton: {
    marginHorizontal: screenPadding,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
  },
  modalCloseText: { fontSize: 14, fontWeight: "700", color: colors.text },
});
