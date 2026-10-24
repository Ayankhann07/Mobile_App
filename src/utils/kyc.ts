import { Alert } from "react-native";
import { getApiErrorMessage, getApiErrorStatus } from "../services/apiClient";

/**
 * Buy/sell/SIP/gift all share the same backend threshold check, which returns
 * a 403 with a message containing "KYC" — this is the only 403 those specific
 * call sites can produce, so a status check is enough to identify it.
 */
export function isKycRequiredError(error: unknown): boolean {
  return getApiErrorStatus(error) === 403 && /kyc/i.test(getApiErrorMessage(error));
}

/** Never a dead end — always offers a direct path to the KYC screen. */
export function showKycRequiredAlert(error: unknown, onGoToKyc: () => void) {
  Alert.alert("KYC required", getApiErrorMessage(error), [
    { text: "Not now", style: "cancel" },
    { text: "Complete KYC", onPress: onGoToKyc },
  ]);
}
