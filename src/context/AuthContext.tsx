import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { setUnauthorizedHandler } from "../services/apiClient";
import { clearToken, getToken, setToken } from "../services/tokenStorage";
import { loginWithOtp as loginWithOtpApi, registerWithOtp as registerWithOtpApi } from "../services/authApi";
import { getProfile } from "../services/customerApi";
import type { Customer } from "../services/types";

interface AuthContextValue {
  customer: Customer | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  loginWithOtp: (mobileNumber: string, otp: string) => Promise<void>;
  registerWithOtp: (fullName: string, mobileNumber: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCustomer: (customer: Customer) => void;
  /** A gift code captured from a saigems://gift/<CODE> link opened while logged out. */
  pendingGiftCode: string | null;
  setPendingGiftCode: (code: string) => void;
  consumePendingGiftCode: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [pendingGiftCode, setPendingGiftCodeState] = useState<string | null>(null);

  const setPendingGiftCode = useCallback((code: string) => setPendingGiftCodeState(code), []);
  const consumePendingGiftCode = useCallback(() => setPendingGiftCodeState(null), []);

  const reset = useCallback(() => {
    setCustomer(null);
    setHasToken(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(reset);
    return () => setUnauthorizedHandler(null);
  }, [reset]);

  useEffect(() => {
    (async () => {
      const existingToken = await getToken();
      if (!existingToken) {
        setIsInitializing(false);
        return;
      }
      try {
        const profile = await getProfile();
        setCustomer(profile);
        setHasToken(true);
      } catch {
        await clearToken();
      } finally {
        setIsInitializing(false);
      }
    })();
  }, []);

  const loginWithOtp = useCallback(async (mobileNumber: string, otp: string) => {
    const result = await loginWithOtpApi(mobileNumber, otp);
    await setToken(result.token);
    setCustomer(result.customer);
    setHasToken(true);
  }, []);

  const registerWithOtp = useCallback(async (fullName: string, mobileNumber: string, otp: string) => {
    const result = await registerWithOtpApi(fullName, mobileNumber, otp);
    await setToken(result.token);
    setCustomer(result.customer);
    setHasToken(true);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    reset();
  }, [reset]);

  const updateCustomer = useCallback((next: Customer) => {
    setCustomer(next);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      customer,
      isAuthenticated: hasToken,
      isInitializing,
      loginWithOtp,
      registerWithOtp,
      logout,
      updateCustomer,
      pendingGiftCode,
      setPendingGiftCode,
      consumePendingGiftCode,
    }),
    [
      customer,
      hasToken,
      isInitializing,
      loginWithOtp,
      registerWithOtp,
      logout,
      updateCustomer,
      pendingGiftCode,
      setPendingGiftCode,
      consumePendingGiftCode,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
