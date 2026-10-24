import { Text, type StyleProp, type TextStyle } from "react-native";
import { useCountUp } from "../hooks/useCountUp";

interface AnimatedValueProps {
  value: number;
  format: (value: number) => string;
  duration?: number;
  delay?: number;
  onComplete?: () => void;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
}

/** Renders a formatted number that counts up whenever `value` changes — the Paytm-style balance reveal. */
export function AnimatedValue({
  value,
  format,
  duration,
  delay,
  onComplete,
  style,
  numberOfLines,
  adjustsFontSizeToFit,
}: AnimatedValueProps) {
  const display = useCountUp(value, { duration, delay, onComplete });
  return (
    <Text style={style} numberOfLines={numberOfLines} adjustsFontSizeToFit={adjustsFontSizeToFit}>
      {format(display)}
    </Text>
  );
}
