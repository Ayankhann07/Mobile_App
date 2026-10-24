import { useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../components/Button";
import { useAuth } from "../hooks/useAuth";
import { getApiErrorMessage, getApiErrorStatus } from "../services/apiClient";
import { DEALER_NAME } from "../config";
import { colors, gradients, radius, screenPadding, shadow, spacing } from "../utils/theme";
import type { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Otp">;

const OTP_LENGTH = 6;

export function OtpScreen({ route, navigation }: Props) {
  const { mode, mobileNumber, fullName } = route.params;
  const { loginWithOtp, registerWithOtp } = useAuth();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  async function handleVerify() {
    if (otp.length !== OTP_LENGTH) {
      Alert.alert("Enter OTP", "Please enter the 6-digit OTP.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await loginWithOtp(mobileNumber, otp);
      } else {
        await registerWithOtp(fullName ?? "", mobileNumber, otp);
      }
    } catch (error) {
      handleFailure(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFailure(error: unknown) {
    const status = getApiErrorStatus(error);
    const message = getApiErrorMessage(error);

    if (isLogin && status === 404) {
      Alert.alert("Not registered", message, [
        { text: "Cancel", style: "cancel" },
        { text: "Register", onPress: () => navigation.replace("Register", { mobileNumber }) },
      ]);
      return;
    }

    if (!isLogin && status === 409) {
      Alert.alert("Already registered", message, [
        { text: "Cancel", style: "cancel" },
        { text: "Log In", onPress: () => navigation.replace("Otp", { mode: "login", mobileNumber }) },
      ]);
      return;
    }

    Alert.alert(isLogin ? "Login failed" : "Registration failed", message);
  }

  return (
    <LinearGradient colors={gradients.authBackground} style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <StatusBar style="dark" />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Text style={styles.brand}>{DEALER_NAME}</Text>
            <Text style={styles.title}>{isLogin ? "Verify to sign in" : "Verify your number"}</Text>
            <Text style={styles.subtitle}>Enter the 6-digit OTP sent to +91 {mobileNumber}</Text>

            <View style={styles.form}>
              <Pressable onPress={() => inputRef.current?.focus()}>
                <OtpBoxes value={otp} length={OTP_LENGTH} />
              </Pressable>
              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH))}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                autoFocus
                style={styles.hiddenInput}
                returnKeyType="done"
              />

              <View style={styles.testHint}>
                <Text style={styles.testHintText}>Testing OTP: 123456</Text>
              </View>

              <Button title="Verify" onPress={handleVerify} loading={isSubmitting} style={styles.button} />
            </View>

            <Pressable onPress={() => navigation.goBack()} style={styles.footer}>
              <Text style={styles.footerText}>‹ Change number</Text>
            </Pressable>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function OtpBoxes({ value, length }: { value: string; length: number }) {
  return (
    <View style={styles.otpRow}>
      {Array.from({ length }).map((_, index) => {
        const filled = index < value.length;
        const isNext = index === value.length;
        return (
          <View key={index} style={[styles.otpBox, filled && styles.otpBoxFilled, isNext && styles.otpBoxActive]}>
            <Text style={styles.otpBoxText}>{value[index] ?? ""}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: screenPadding,
  },
  brand: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderTopColor: colors.gold,
    padding: spacing.lg,
    ...shadow.lg,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxFilled: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  otpBoxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  otpBoxText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 1,
    width: 1,
  },
  testHint: {
    alignSelf: "center",
    backgroundColor: colors.goldLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginTop: spacing.lg,
  },
  testHintText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: "700",
  },
  button: {
    marginTop: spacing.lg,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  footerText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
});
