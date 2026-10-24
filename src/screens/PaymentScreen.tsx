import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, StyleSheet, View } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getApiErrorMessage } from "../services/apiClient";
import { getPaymentStatus, listPurchases } from "../services/customerApi";
import { colors } from "../utils/theme";
import type { AppStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AppStackParamList, "Payment">;

/**
 * Hosts the CCAvenue checkout. The pay page is served from the dealer's registered domain
 * (see backend payment.service.ts); when the gateway sends the customer back to
 * returnUrlPrefix we stop the WebView and read the settled order from the API.
 */
export function PaymentScreen({ route, navigation }: Props) {
  const { payUrl, returnUrlPrefix, orderId } = route.params;
  const [isFinishing, setIsFinishing] = useState(false);
  const finished = useRef(false);

  const finish = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    setIsFinishing(true);
    try {
      const order = await getPaymentStatus(orderId);
      if (order.status === "SUCCESS" && order.purchaseId) {
        const purchase = (await listPurchases()).find((p) => p.id === order.purchaseId);
        if (purchase) {
          navigation.replace("PurchaseConfirmation", { purchase });
          return;
        }
      }
      const message =
        order.status === "SUCCESS"
          ? "Payment received. Your metal has been added to your holdings."
          : order.status === "ABORTED"
            ? "You cancelled the payment. No money was charged."
            : order.status === "FAILED"
              ? `${order.statusMessage ?? "The payment failed."} If money was debited, the bank will refund it.`
              : "Your bank hasn't confirmed the payment yet. Check your history in a few minutes.";
      Alert.alert(order.status === "SUCCESS" ? "Payment successful" : "Payment not completed", message, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Payment status unknown", getApiErrorMessage(error), [{ text: "OK", onPress: () => navigation.goBack() }]);
    }
  }, [navigation, orderId]);

  const handleShouldStart = (req: ShouldStartLoadRequest) => {
    const { url } = req;
    if (url.startsWith(returnUrlPrefix)) {
      finish();
      return false;
    }
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("about:") || url.startsWith("data:")) {
      return true;
    }
    // UPI / wallet apps (upi://, tez://, phonepe://, paytmmp://, intent://...) must open outside the WebView.
    openExternal(url);
    return false;
  };

  const handleNavChange = (nav: WebViewNavigation) => {
    if (nav.url.startsWith(returnUrlPrefix)) finish();
  };

  return (
    <View style={styles.flex}>
      <WebView
        source={{ uri: payUrl }}
        originWhitelist={["*"]}
        onShouldStartLoadWithRequest={handleShouldStart}
        onNavigationStateChange={handleNavChange}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => <Centered />}
      />
      {isFinishing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

/** Android "intent://...#Intent;scheme=upi;package=...;end" -> "upi://..." so Linking can open it. */
function openExternal(url: string) {
  let target = url;
  if (url.startsWith("intent://")) {
    const scheme = /;scheme=([^;]+);/.exec(url)?.[1];
    const body = url.slice("intent://".length).split("#Intent")[0];
    if (scheme) target = `${scheme}://${body}`;
  }
  Linking.openURL(target).catch(() => {
    Alert.alert("App not found", "Please install the selected UPI app or choose another payment method.");
  });
}

function Centered() {
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
