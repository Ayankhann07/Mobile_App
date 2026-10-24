import { useEffect, useRef } from "react";
import { Linking } from "react-native";
import { useAuth } from "./useAuth";
import { navigationRef } from "../navigation/navigationRef";

function extractGiftCode(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/gift\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * saigems://gift/<CODE> is handled declaratively by navigation/linking.ts while the user is
 * already authenticated. This hook covers the other case: a link opened while logged out,
 * where the code must be remembered and the user routed to it right after they log in.
 */
export function useDeepLinking() {
  const { isAuthenticated, isInitializing, pendingGiftCode, setPendingGiftCode, consumePendingGiftCode } = useAuth();
  const handledInitial = useRef(false);

  // Only read the initial URL once auth state has settled, so its async resolution can't
  // land after we've already given up on it (that race previously dropped cold-start links).
  useEffect(() => {
    if (isInitializing || handledInitial.current) return;
    handledInitial.current = true;
    if (isAuthenticated) return; // React Navigation's `linking` config resolves this case itself.
    Linking.getInitialURL().then((url) => {
      const code = extractGiftCode(url);
      if (code) setPendingGiftCode(code);
    });
  }, [isInitializing, isAuthenticated, setPendingGiftCode]);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const code = extractGiftCode(url);
      if (code && !isAuthenticated) {
        setPendingGiftCode(code);
      }
    });
    return () => subscription.remove();
  }, [isAuthenticated, setPendingGiftCode]);

  useEffect(() => {
    if (isInitializing || !isAuthenticated || !pendingGiftCode) return;
    const code = pendingGiftCode;
    consumePendingGiftCode();

    let attempts = 0;
    const tryNavigate = () => {
      attempts += 1;
      if (navigationRef.isReady()) {
        navigationRef.navigate("AppStack", { screen: "OpenGift", params: { code } });
      } else if (attempts < 30) {
        setTimeout(tryNavigate, 100);
      }
    };
    tryNavigate();
  }, [isAuthenticated, isInitializing, pendingGiftCode, consumePendingGiftCode]);
}
