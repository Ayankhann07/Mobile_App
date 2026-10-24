import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { useReducedMotion } from "./useReducedMotion";

interface UseCountUpOptions {
  /** Animation length in ms. Defaults to 1000 — within the ~800-1200ms "Paytm reveal" range. */
  duration?: number;
  /** Delay before this value starts counting — used to stagger multiple values. */
  delay?: number;
  /** Fires once the count-up settles on `value` (not called if interrupted by a new value). */
  onComplete?: () => void;
}

/**
 * Counts a number up from its previous displayed value to a new target whenever `value`
 * changes (from 0 on first mount). Re-renders that don't change `value` are a no-op — the
 * effect only re-runs when the underlying number actually changes, not on every render.
 *
 * Number text can't use the native driver, so this drives state via an Animated listener.
 * Reduced-motion users get the final value instantly instead of a count-up.
 */
export function useCountUp(value: number, { duration = 1000, delay = 0, onComplete }: UseCountUpOptions = {}): number {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  const currentRef = useRef(0);
  const isFirstRun = useRef(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const isFirst = isFirstRun.current;
    isFirstRun.current = false;

    if (reducedMotion) {
      anim.stopAnimation();
      anim.setValue(value);
      currentRef.current = value;
      setDisplay(value);
      onCompleteRef.current?.();
      return;
    }

    const startValue = isFirst ? 0 : currentRef.current;
    anim.setValue(startValue);

    const listenerId = anim.addListener(({ value: v }) => {
      currentRef.current = v;
      setDisplay(v);
    });

    const animation = Animated.timing(anim, {
      toValue: value,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) onCompleteRef.current?.();
    });

    return () => {
      anim.removeListener(listenerId);
      animation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reducedMotion, duration, delay]);

  return display;
}
