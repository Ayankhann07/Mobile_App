import { StyleSheet, View } from "react-native";
import { colors } from "../utils/theme";
import type { MetalType } from "../services/types";

interface MetalIconProps {
  metal: MetalType;
  size?: number;
}

const GOLD_BASE = "#B8860B";
const GOLD_HIGHLIGHT = "#F2DFA0";
const SILVER_BASE = "#8E99A8";
const SILVER_HIGHLIGHT = "#E7ECF2";

/**
 * Small badge showing a stylized gold/silver bar (ingot) — gold-tinted badge for Gold,
 * silver-tinted for Silver. There's no ingot/bullion glyph in the installed
 * MaterialCommunityIcons set (only a "gold medal" icon), so the bar silhouette is built
 * from plain Views instead of a vector icon.
 */
export function MetalIcon({ metal, size = 34 }: MetalIconProps) {
  const isGold = metal === "GOLD";
  const background = isGold ? colors.goldLight : colors.silverLight;
  const border = isGold ? colors.gold : colors.silverDark;
  const barBase = isGold ? GOLD_BASE : SILVER_BASE;
  const barHighlight = isGold ? GOLD_HIGHLIGHT : SILVER_HIGHLIGHT;

  const barWidth = size * 0.6;
  const barHeight = size * 0.36;
  const barRadius = barHeight * 0.3;

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: background,
          borderColor: border,
          borderWidth: Math.max(1, size * 0.045),
        },
      ]}
    >
      <View
        style={{
          width: barWidth,
          height: barHeight,
          borderRadius: barRadius,
          backgroundColor: barBase,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: barHeight * 0.16,
            left: barWidth * 0.12,
            width: barWidth * 0.76,
            height: barHeight * 0.26,
            borderRadius: barRadius * 0.6,
            backgroundColor: barHighlight,
            opacity: 0.9,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
});
