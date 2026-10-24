import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { getSoundEnabledPref, setSoundEnabledPref } from "../services/soundPrefs";

type ChimeName = "coin" | "reveal";

interface SoundContextValue {
  soundEnabled: boolean;
  isReady: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playCoinChime: () => void;
  playRevealChime: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const SoundContext = createContext<SoundContextValue | undefined>(undefined);

const CHIME_SOURCES: Record<ChimeName, number> = {
  coin: require("../../assets/sounds/coin.wav"),
  reveal: require("../../assets/sounds/reveal.wav"),
};

/**
 * Preloads the two short money-moment chimes once and exposes play()/toggle helpers app-wide.
 * `playsInSilentMode: false` so the effects stay quiet when the device's silent switch is on —
 * expo-audio defaults this to `true`, which would otherwise ignore the silent switch on iOS.
 */
export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const playersRef = useRef<Partial<Record<ChimeName, AudioPlayer>>>({});

  useEffect(() => {
    let isMounted = true;
    getSoundEnabledPref().then((enabled) => {
      if (isMounted) {
        setSoundEnabledState(enabled);
        setIsReady(true);
      }
    });
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" }).catch(() => {});

    try {
      // expo-audio is a native module — on a JS-only Metro reload before the app has been
      // rebuilt (`expo run:android`) it isn't linked yet, so this can throw. Fail silently:
      // the rest of the app (all animations, everything else) must keep working regardless.
      playersRef.current.coin = createAudioPlayer(CHIME_SOURCES.coin);
      playersRef.current.reveal = createAudioPlayer(CHIME_SOURCES.reveal);
    } catch {
      playersRef.current = {};
    }

    return () => {
      isMounted = false;
      try {
        playersRef.current.coin?.remove();
        playersRef.current.reveal?.remove();
      } catch {
        // ignore — best-effort cleanup
      }
      playersRef.current = {};
    };
  }, []);

  const play = useCallback(
    (name: ChimeName) => {
      if (!soundEnabled) return;
      const player = playersRef.current[name];
      if (!player) return;
      try {
        player.seekTo(0).catch(() => {});
        player.play();
      } catch {
        // Best-effort — a playback glitch should never interrupt the underlying money flow.
      }
    },
    [soundEnabled]
  );

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    setSoundEnabledPref(enabled);
  }, []);

  const value = useMemo<SoundContextValue>(
    () => ({
      soundEnabled,
      isReady,
      setSoundEnabled,
      playCoinChime: () => play("coin"),
      playRevealChime: () => play("reveal"),
    }),
    [soundEnabled, isReady, setSoundEnabled, play]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}
