import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, gradients, radius, shadow, spacing } from "../utils/theme";
import { usePressScale } from "../hooks/usePressScale";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, onPress, variant = "primary", disabled, loading, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();

  if (variant === "primary") {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={isDisabled ? undefined : onPressIn}
        onPressOut={isDisabled ? undefined : onPressOut}
        disabled={isDisabled}
        style={[!isDisabled && shadow.sm, isDisabled && styles.disabled, style]}
      >
        <Animated.View style={!isDisabled && animatedStyle}>
          <LinearGradient
            colors={isDisabled ? [colors.border, colors.borderStrong] : gradients.gold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.base}
          >
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.text}>{title}</Text>}
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={isDisabled ? undefined : onPressIn}
      onPressOut={isDisabled ? undefined : onPressOut}
      disabled={isDisabled}
      style={style}
    >
      <Animated.View
        style={[styles.base, variantStyles[variant], isDisabled && styles.disabled, !isDisabled && animatedStyle]}
      >
        {loading ? (
          <ActivityIndicator color={variant === "secondary" ? colors.primary : colors.white} />
        ) : (
          <Text style={[styles.text, variant === "secondary" && styles.textSecondary]}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  textSecondary: {
    color: colors.primary,
  },
});

const variantStyles = StyleSheet.create({
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
    ...shadow.sm,
  },
});
