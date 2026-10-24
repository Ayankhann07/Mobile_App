import { useEffect, useRef, useState } from "react";
import { Animated, BackHandler, Image, Platform, StyleSheet, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewNavigation } from "react-native-webview";
import * as SplashScreen from "expo-splash-screen";

// ---------------------------------------------------------------------------
// Native app disabled — this is now a WebView-only shell that just loads the
// web app below. The original native implementation (navigation, screens,
// auth, etc.) is commented out at the bottom of this file, untouched, so it
// can be restored by deleting this component and uncommenting that block.
// ---------------------------------------------------------------------------


const WEBVIEW_URL = "http://saigems.in";
// Android's system splash screen (API 31+) can only ever show a small app
// icon — it will not render our full logo + "Save today, Shine tomorrow."
// tagline, no matter what image we point expo-splash-screen at. So we keep
// the native splash up just long enough to hand off to this JS splash below,
// which uses the same artwork and background color, then fades into the
// WebView once the page has actually loaded.
SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_SPLASH_MS = 1200;
const SPLASH_TIMEOUT_MS = 6000; // don't get stuck here forever if the network is slow/down

// Real pixel dimensions of assets/splash-icon.png — used to size it in JS
// instead of relying on percentage-width + aspectRatio together, which was
// rendering the image at its raw 1360x652 *point* size (way wider than the
// screen) instead of scaling it down.
const SPLASH_IMAGE_WIDTH = 1360;
const SPLASH_IMAGE_HEIGHT = 652;

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const { width: windowWidth } = useWindowDimensions();
  const splashDisplayWidth = windowWidth * 0.72;
  const splashDisplayHeight = (splashDisplayWidth * SPLASH_IMAGE_HEIGHT) / SPLASH_IMAGE_WIDTH;
  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewReady, setWebViewReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Swap the native splash for this JS splash right away — same logo and
    // background color, so the handoff is invisible.
    SplashScreen.hideAsync().catch(() => {});
    const minTimer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    const timeoutTimer = setTimeout(() => setWebViewReady(true), SPLASH_TIMEOUT_MS);
    return () => {
      clearTimeout(minTimer);
      clearTimeout(timeoutTimer);
    };
  }, []);

  useEffect(() => {
    if (!(webViewReady && minTimeElapsed)) return;
    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => setSplashVisible(false));
  }, [webViewReady, minTimeElapsed, splashOpacity]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const onBackPress = () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [canGoBack]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ uri: WEBVIEW_URL }}
          style={{ flex: 1 }}
          onNavigationStateChange={(navState: WebViewNavigation) => setCanGoBack(navState.canGoBack)}
          onLoadEnd={() => setWebViewReady(true)}
          onError={() => setWebViewReady(true)}
        />
      </SafeAreaView>

      {splashVisible && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.splash, { opacity: splashOpacity }]}>
          <Image
            source={require("./assets/splash-icon.png")}
            style={{ width: splashDisplayWidth, height: splashDisplayHeight }}
            resizeMode="contain"
          />
        </Animated.View>
      )}

      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    backgroundColor: "#1C2230",
    alignItems: "center",
    justifyContent: "center",
  },
});

// -----------------------------------------------------------------------
// Original native app — commented out, not deleted. To restore: delete the
// WebView-only App() above and uncomment everything below.
// -----------------------------------------------------------------------

/*
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { SoundProvider } from "./src/context/SoundContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SoundProvider>
            <RootNavigator />
            <StatusBar style="dark" />
          </SoundProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
*/
