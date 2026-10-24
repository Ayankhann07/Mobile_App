import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEALER_NAME } from "../config";
import { colors, radius, spacing } from "../utils/theme";

export function SplashScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <View style={styles.logoBadge}>
        <Image source={require("../../assets/sai_gems.jpg")} style={styles.logoImage} resizeMode="cover" />
      </View>
      <Text style={styles.title}>{DEALER_NAME}</Text>
      <View style={styles.divider} />
      <Text style={styles.subtitle}>Digital Gold &amp; Silver Investments</Text>
      <ActivityIndicator style={styles.spinner} color={colors.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.maroon,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    backgroundColor: colors.maroonMuted,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.5,
  },
  divider: {
    width: 36,
    height: 3,
    borderRadius: radius.full,
    backgroundColor: colors.gold,
    marginTop: spacing.sm,
  },
  subtitle: {
    marginTop: spacing.md,
    fontSize: 14,
    color: "#C9C2AE",
  },
  spinner: {
    marginTop: spacing.xl,
  },
});
