import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainTabs } from "./MainTabs";
import { BuyMetalScreen } from "../screens/BuyMetalScreen";
import { SellMetalScreen } from "../screens/SellMetalScreen";
import { RedeemMetalScreen } from "../screens/RedeemMetalScreen";
import { PurchaseConfirmationScreen } from "../screens/PurchaseConfirmationScreen";
import { RedeemConfirmationScreen } from "../screens/RedeemConfirmationScreen";
import { MyRedemptionsScreen } from "../screens/MyRedemptionsScreen";
import { RedemptionDetailScreen } from "../screens/RedemptionDetailScreen";
import { StartSipScreen } from "../screens/StartSipScreen";
import { SipInstallmentsScreen } from "../screens/SipInstallmentsScreen";
import { CatalogueScreen } from "../screens/CatalogueScreen";
import { GiftStoreScreen } from "../screens/GiftStoreScreen";
import { BuyGiftScreen } from "../screens/BuyGiftScreen";
import { MyGiftsScreen } from "../screens/MyGiftsScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { OpenGiftScreen } from "../screens/OpenGiftScreen";
import { PaymentScreen } from "../screens/PaymentScreen";
import { colors } from "../utils/theme";
import type { AppStackParamList } from "./types";

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700", fontSize: 17, color: colors.text },
        animation: "ios_from_right",
        animationDuration: 220,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="BuyMetal"
        component={BuyMetalScreen}
        options={({ route }) => ({ title: route.params.metalType === "GOLD" ? "Buy Gold" : "Buy Silver" })}
      />
      <Stack.Screen
        name="SellMetal"
        component={SellMetalScreen}
        options={({ route }) => ({ title: route.params.metalType === "GOLD" ? "Sell Gold" : "Sell Silver" })}
      />
      <Stack.Screen
        name="RedeemMetal"
        component={RedeemMetalScreen}
        options={({ route }) => ({ title: route.params.metalType === "GOLD" ? "Redeem Gold" : "Redeem Silver" })}
      />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: "Secure Payment" }} />
      <Stack.Screen
        name="PurchaseConfirmation"
        component={PurchaseConfirmationScreen}
        options={{ title: "Confirmation", headerBackVisible: false }}
      />
      <Stack.Screen
        name="RedeemConfirmation"
        component={RedeemConfirmationScreen}
        options={{ title: "Confirmation", headerBackVisible: false }}
      />
      <Stack.Screen name="MyRedemptions" component={MyRedemptionsScreen} options={{ title: "My Redemptions" }} />
      <Stack.Screen name="RedemptionDetail" component={RedemptionDetailScreen} options={{ title: "Redemption Detail" }} />
      <Stack.Screen name="StartSip" component={StartSipScreen} options={{ title: "Start a SIP" }} />
      <Stack.Screen
        name="SipInstallments"
        component={SipInstallmentsScreen}
        options={({ route }) => ({ title: route.params.metalType === "GOLD" ? "Gold SIP History" : "Silver SIP History" })}
      />
      <Stack.Screen name="Catalogue" component={CatalogueScreen} options={{ title: "Catalogue" }} />
      <Stack.Screen
        name="GiftStore"
        component={GiftStoreScreen}
        options={({ navigation }) => ({
          title: "Gold Lifafa",
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate("MyGifts")} hitSlop={8}>
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>My Gifts</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen name="BuyGift" component={BuyGiftScreen} options={{ title: "Send a Gift" }} />
      <Stack.Screen name="MyGifts" component={MyGiftsScreen} options={{ title: "My Gifts" }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="OpenGift" component={OpenGiftScreen} options={{ title: "Open Gift" }} />
    </Stack.Navigator>
  );
}
