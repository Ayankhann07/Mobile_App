import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../utils/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";

const PARTICLE_COUNT = 8;
const BURST_RADIUS = 80;

interface SparkleBurstProps {
  /** Fires the burst whenever this flips to true (from a false/initial state). */
  active: boolean;
}

/**
 * A lightweight, one-shot sparkle burst radiating from the center — the "light celebratory
 * touch" for the gift reveal. Plain Animated (transform + opacity, all native-driver), no
 * Lottie or confetti library needed for a handful of particles.
 */
export function SparkleBurst({ active }: SparkleBurstProps) {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (!active || reducedMotion || hasFiredRef.current) return;
    hasFiredRef.current = true;
    Animated.timing(progress, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [active, reducedMotion, progress]);

  if (!active || reducedMotion) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      {Array.from({ length: PARTICLE_COUNT }).map((_, index) => {
        const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * BURST_RADIUS] });
        const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * BURST_RADIUS] });
        const opacity = progress.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] });
        const scale = progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.3, 1, 0.6] });
        return (
          <Animated.View
            key={index}
            style={[styles.particle, { opacity, transform: [{ translateX }, { translateY }, { scale }] }]}
          >
            <Ionicons name="sparkles" size={16} color={colors.gold} />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -8,
    marginTop: -8,
  },
});
