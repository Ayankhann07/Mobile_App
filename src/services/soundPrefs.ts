import * as SecureStore from "expo-secure-store";

const SOUND_ENABLED_KEY = "metaltrade_sound_enabled";

export async function getSoundEnabledPref(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(SOUND_ENABLED_KEY);
  return stored === null ? true : stored === "true";
}

export async function setSoundEnabledPref(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(SOUND_ENABLED_KEY, enabled ? "true" : "false");
}
