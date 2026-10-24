import { Animated, type StyleProp, type ViewStyle } from "react-native";
import { useMountAnimation } from "../hooks/useMountAnimation";

interface AppearOnMountProps {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Fades/slides its children in once, exactly when this wrapper mounts. Drop it in at the point
 * where a loading spinner is swapped for real content so the reveal feels intentional — e.g.
 * `{isLoading ? <Loader /> : <AppearOnMount><FlatList .../></AppearOnMount>}`. Because it only
 * mounts once real content is ready, the fade always lands on the actual reveal moment instead
 * of racing the data fetch and finishing before there's anything to show.
 */
export function AppearOnMount({ delay, style, children }: AppearOnMountProps) {
  const anim = useMountAnimation({ delay });
  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}
