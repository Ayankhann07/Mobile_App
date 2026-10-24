import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { listIncomingGifts } from "../services/customerApi";
import type { IncomingGift } from "../services/types";

interface IncomingGiftsContextValue {
  gifts: IncomingGift[];
  /** Unseen count — this is what the bell badge shows, not the total incoming count. */
  unseenCount: number;
  isLoading: boolean;
  refresh: () => Promise<IncomingGift[]>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const IncomingGiftsContext = createContext<IncomingGiftsContextValue | undefined>(undefined);

/**
 * Best-effort in-app polling (no push/Firebase yet): fetches once on mount, again whenever
 * the OS brings the app back to the foreground, and whenever a screen explicitly calls
 * refresh() (e.g. on focus, or right after a claim/mark-seen action).
 */
export function IncomingGiftsProvider({ children }: { children: ReactNode }) {
  const [gifts, setGifts] = useState<IncomingGift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await listIncomingGifts();
      setGifts(data);
      return data;
    } catch {
      // Silent — this can fire from a background poll; screens that need to surface
      // a load failure do their own fetch-and-alert instead of relying on this.
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const unseenCount = useMemo(() => gifts.filter((g) => !g.seen).length, [gifts]);

  const value = useMemo<IncomingGiftsContextValue>(
    () => ({ gifts, unseenCount, isLoading, refresh }),
    [gifts, unseenCount, isLoading, refresh]
  );

  return <IncomingGiftsContext.Provider value={value}>{children}</IncomingGiftsContext.Provider>;
}
