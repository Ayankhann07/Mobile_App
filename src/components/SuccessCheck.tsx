import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../utils/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface SuccessCheckProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
}

/** A checkmark that pops/scales into its badge — the reward moment after a purchase, sale, or claim. */
export function SuccessCheck({ size = 72, color = colors.success, backgroundColor = colors.successBg }: SuccessCheckProps) {
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const iconOpacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 140 }).start();
    Animated.timing(iconOpacity, { toValue: 1, duration: 200, delay: 120, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  return (
    <Animated.View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 2, backgroundColor, transform: [{ scale }] },
      ]}
    >
      <Animated.View style={{ opacity: iconOpacity }}>
        <Ionicons name="checkmark" size={size * 0.5} color={color} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: "center", justifyContent: "center" },
});
