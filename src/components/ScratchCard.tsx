import { useMemo, useRef } from "react";
import { Animated, PanResponder, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, radius } from "../utils/theme";

interface ScratchCardProps {
  width: number;
  height: number;
  /** Fraction of cells that must be scratched before onRevealed fires (0-1). */
  revealThreshold?: number;
  onRevealed: () => void;
  /** Content underneath the foil, revealed as the user scratches. */
  children: React.ReactNode;
}

const COLS = 12;
const ROWS = 8;
const CELL_COUNT = COLS * ROWS;
const NEIGHBOR_RADIUS = 1;

/**
 * A scratch-to-reveal surface built from a grid of small Views whose opacity is animated
 * to 0 as the user's finger passes over them — no masking/native deps, just PanResponder +
 * Animated. Once enough cells are cleared, the rest fade out together and onRevealed fires.
 */
export function ScratchCard({ width, height, revealThreshold = 0.5, onRevealed, children }: ScratchCardProps) {
  const cellWidth = width / COLS;
  const cellHeight = height / ROWS;

  const opacities = useRef(Array.from({ length: CELL_COUNT }, () => new Animated.Value(1))).current;
  const hintOpacity = useRef(new Animated.Value(1)).current;
  const revealedFlags = useRef(new Set<number>()).current;
  const hasFiredRef = useRef(false);

  function revealCell(index: number) {
    if (revealedFlags.has(index)) return;
    revealedFlags.add(index);
    Animated.timing(opacities[index], { toValue: 0, duration: 140, useNativeDriver: true }).start();
  }

  function revealAll() {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;
    Animated.parallel([
      ...opacities.map((value) => Animated.timing(value, { toValue: 0, duration: 320, useNativeDriver: true })),
      Animated.timing(hintOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onRevealed());
  }

  function handleTouch(evt: GestureResponderEvent) {
    const { locationX, locationY } = evt.nativeEvent;
    const col = Math.floor(locationX / cellWidth);
    const row = Math.floor(locationY / cellHeight);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;

    for (let dr = -NEIGHBOR_RADIUS; dr <= NEIGHBOR_RADIUS; dr++) {
      for (let dc = -NEIGHBOR_RADIUS; dc <= NEIGHBOR_RADIUS; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        revealCell(r * COLS + c);
      }
    }

    Animated.timing(hintOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();

    if (!hasFiredRef.current && revealedFlags.size / CELL_COUNT >= revealThreshold) {
      revealAll();
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: handleTouch,
      onPanResponderMove: handleTouch,
    })
  ).current;

  const cells = useMemo(() => Array.from({ length: CELL_COUNT }, (_, i) => i), []);

  return (
    <View style={[styles.container, { width, height, borderRadius: radius.xl }]} {...panResponder.panHandlers}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {children}
      </View>

      {cells.map((index) => {
        const row = Math.floor(index / COLS);
        const col = index % COLS;
        const shade = (row + col) % 2 === 0 ? "#D9B24C" : "#C9A227";
        return (
          <Animated.View
            key={index}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: col * cellWidth,
              top: row * cellHeight,
              width: cellWidth + 0.5,
              height: cellHeight + 0.5,
              backgroundColor: shade,
              opacity: opacities[index],
            }}
          />
        );
      })}

      <Animated.View pointerEvents="none" style={[styles.hint, { opacity: hintOpacity }]}>
        <Ionicons name="gift" size={34} color={colors.maroon} />
        <Text style={styles.hintText}>Scratch to reveal your gift</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  hint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  hintText: {
    color: colors.maroon,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
