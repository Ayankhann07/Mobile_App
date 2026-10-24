import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../utils/theme";

export function Loader({ label, fullscreen = false }: { label?: string; fullscreen?: boolean }) {
  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  label: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "500",
  },
});
