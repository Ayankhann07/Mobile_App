import type { LinkingOptions } from "@react-navigation/native";
import type { AppDrawerParamList } from "./types";

/**
 * Handles saigems://gift/<CODE> while the app is already authenticated (AppDrawer mounted).
 * When the user isn't logged in, this config simply can't match (AuthStack has no such
 * route) — useDeepLinking.ts covers that case by stashing the code and resuming after login.
 */
export const linking: LinkingOptions<AppDrawerParamList> = {
  prefixes: ["saigems://"],
  config: {
    screens: {
      AppStack: {
        screens: {
          OpenGift: "gift/:code",
        },
      },
    },
  },
};
