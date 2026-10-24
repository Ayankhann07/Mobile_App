import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationBell } from "./NotificationBell";
import { colors, radius, screenPadding, shadow, spacing } from "../utils/theme";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
}

/** Consistent pinned top header for primary tab screens (Home manages its own bespoke header instead). */
export function ScreenHeader({ title, subtitle, onMenuPress }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        {onMenuPress ? (
          <Pressable onPress={onMenuPress} style={styles.menuButton} hitSlop={8}>
            <Ionicons name="menu" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <NotificationBell />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: screenPadding,
    paddingBottom: spacing.md,
    ...shadow.sm,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm + 2 },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});
