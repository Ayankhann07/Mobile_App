import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { useReducedMotion } from "./useReducedMotion";

interface UseMountAnimationOptions {
  /** Animation length in ms. Keep quick — this runs once per mount, not on every scroll. */
  duration?: number;
  /** Stagger delay in ms, e.g. `index * 60` for a list of cards assembling in sequence. */
  delay?: number;
  /** Vertical distance (px) the content slides up from. */
  distance?: number;
}

/** Fade-in + slide-up applied once on mount, skipped entirely under reduced motion. */
export function useMountAnimation({ duration = 280, delay = 0, distance = 14 }: UseMountAnimationOptions = {}) {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  };
}
