import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useIncomingGifts } from "../hooks/useIncomingGifts";
import { colors, radius } from "../utils/theme";
import type { AppStackParamList } from "../navigation/types";

/** Rendered from screens nested inside MainTabs, so the navigation prop is cast up to the
 * enclosing AppStack — same pattern DrawerContent.tsx uses to reach cross-navigator screens. */
export function NotificationBell() {
  const { unseenCount } = useIncomingGifts();
  const navigation = useNavigation() as unknown as NativeStackNavigationProp<AppStackParamList>;

  return (
    <Pressable onPress={() => navigation.navigate("Notifications")} style={styles.button} hitSlop={8}>
      <Ionicons name="notifications-outline" size={20} color={colors.text} />
      {unseenCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unseenCount > 9 ? "9+" : unseenCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: "800" },
});
