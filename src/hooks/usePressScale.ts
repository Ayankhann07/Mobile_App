import { useRef } from "react";
import { Animated } from "react-native";

interface UsePressScaleOptions {
  /** Scale applied at full press, e.g. 0.97. */
  toScale?: number;
  /** Opacity applied at full press. */
  toOpacity?: number;
}

/**
 * Gentle press feedback (scale + opacity) for primary CTAs and tiles, driven entirely on the
 * native thread (transform/opacity only) so it stays smooth even during JS-thread work.
 */
export function usePressScale({ toScale = 0.97, toOpacity = 0.92 }: UsePressScaleOptions = {}) {
  const progress = useRef(new Animated.Value(0)).current;

  function onPressIn() {
    Animated.timing(progress, { toValue: 1, duration: 90, useNativeDriver: true }).start();
  }

  function onPressOut() {
    Animated.timing(progress, { toValue: 0, duration: 150, useNativeDriver: true }).start();
  }

  const animatedStyle = {
    transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, toScale] }) }],
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, toOpacity] }),
  };

  return { animatedStyle, onPressIn, onPressOut };
}
