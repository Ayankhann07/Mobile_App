import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { DrawerContentScrollView, type DrawerContentComponentProps, type DrawerNavigationProp } from "@react-navigation/drawer";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEALER_NAME } from "../config";
import { useAuth } from "../hooks/useAuth";
import { MetalIcon } from "../components/MetalIcon";
import { colors, radius, spacing } from "../utils/theme";
import type { AppDrawerParamList, MainTabParamList } from "./types";
import type { MetalType } from "../services/types";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface NavState {
  index?: number;
  routes: Array<{ name: string; params?: unknown; state?: NavState }>;
}

function getFocusedRoute(state?: NavState): { name: string; params?: Record<string, unknown> } | undefined {
  if (!state) return undefined;
  const idx = state.index ?? state.routes.length - 1;
  const route = state.routes[idx];
  if (!route) return undefined;
  if (route.state) return getFocusedRoute(route.state);
  return { name: route.name, params: route.params as Record<string, unknown> | undefined };
}

export function DrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const navigation = props.navigation as unknown as DrawerNavigationProp<AppDrawerParamList>;
  const focused = getFocusedRoute(props.state as unknown as NavState);

  function goToTab(screen: keyof MainTabParamList) {
    navigation.navigate("AppStack", { screen: "MainTabs", params: { screen } });
  }

  function goToBuy(metalType: MetalType) {
    navigation.navigate("AppStack", { screen: "BuyMetal", params: { metalType } });
  }

  function goToCatalogue() {
    navigation.navigate("AppStack", { screen: "Catalogue" });
  }

  function goToGiftStore() {
    navigation.navigate("AppStack", { screen: "GiftStore" });
  }

  function goToRedemptions() {
    navigation.navigate("AppStack", { screen: "MyRedemptions" });
  }

  function handleLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);
  }

  const isTab = (name: keyof MainTabParamList) => focused?.name === name;
  const isBuy = (metalType: MetalType) => focused?.name === "BuyMetal" && focused.params?.metalType === metalType;
  const isSell = focused?.name === "Invest" || focused?.name === "SellMetal";
  const isSip = focused?.name === "SIP" || focused?.name === "StartSip" || focused?.name === "SipInstallments";
  const isCatalogue = focused?.name === "Catalogue";
  const isGift =
    focused?.name === "GiftStore" ||
    focused?.name === "BuyGift" ||
    focused?.name === "MyGifts" ||
    focused?.name === "OpenGift";
  const isRedeem =
    focused?.name === "RedeemMetal" || focused?.name === "MyRedemptions" || focused?.name === "RedemptionDetail";

  return (
    <View style={styles.flex}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent} scrollEnabled={false}>
        <View style={[styles.brand, { paddingTop: insets.top + spacing.md }]}>
          <Image source={require("../../assets/sai_gems.jpg")} style={styles.brandLogo} />
          <Text style={styles.brandName}>{DEALER_NAME}</Text>
          <Text style={styles.brandSubtitle}>Gold & Silver Investing</Text>
        </View>

        <View style={styles.menu}>
          <DrawerItem icon="home" label="Home" active={isTab("Home")} onPress={() => goToTab("Home")} />
          <DrawerItem metal="GOLD" label="Buy Gold" active={isBuy("GOLD")} onPress={() => goToBuy("GOLD")} />
          <DrawerItem metal="SILVER" label="Buy Silver" active={isBuy("SILVER")} onPress={() => goToBuy("SILVER")} />
          <DrawerItem icon="cash" label="Sell" active={isSell} onPress={() => goToTab("Invest")} />
          <DrawerItem icon="repeat" label="SIP" active={isSip} onPress={() => goToTab("SIP")} />
          <DrawerItem icon="gift" label="Gold Lifafa" active={isGift} onPress={goToGiftStore} />
          <DrawerItem icon="cube" label="Redeem" active={isRedeem} onPress={goToRedemptions} />
          <DrawerItem icon="receipt" label="Purchase History" active={isTab("History")} onPress={() => goToTab("History")} />
          <DrawerItem icon="images" label="Catalogue" active={isCatalogue} onPress={goToCatalogue} />
          <DrawerItem icon="person" label="Profile" active={isTab("ProfileTab")} onPress={() => goToTab("ProfileTab")} />
        </View>
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutRow, pressed && styles.pressed]}>
          <View style={[styles.iconWrap, styles.logoutIconWrap]}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          </View>
          <Text style={styles.logoutLabel}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DrawerItem({
  icon,
  metal,
  label,
  active,
  onPress,
}: {
  icon?: IconName;
  metal?: MetalType;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
        {metal ? (
          <MetalIcon metal={metal} size={32} />
        ) : (
          <Ionicons name={active ? icon! : (`${icon}-outline` as IconName)} size={20} color={active ? colors.maroon : colors.textMuted} />
        )}
      </View>
      <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { flexGrow: 1 },
  pressed: { opacity: 0.7 },

  brand: {
    backgroundColor: colors.maroon,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    marginBottom: spacing.sm,
  },
  brandLogo: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: spacing.sm,
  },
  brandName: { color: colors.white, fontSize: 18, fontWeight: "800" },
  brandSubtitle: { color: colors.gold, fontSize: 12, fontWeight: "600", marginTop: 2 },

  menu: { paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  itemActive: { backgroundColor: colors.goldLight },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {},
  itemLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
  itemLabelActive: { color: colors.goldDark, fontWeight: "800" },

  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sm + 4,
    paddingTop: spacing.sm,
  },
  logoutRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
  logoutIconWrap: { backgroundColor: colors.dangerBg },
  logoutLabel: { fontSize: 14, fontWeight: "700", color: colors.danger },
});
