import { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { checkMobileExists } from "../services/authApi";
import { getApiErrorMessage } from "../services/apiClient";
import { DEALER_NAME } from "../config";
import { colors, gradients, radius, screenPadding, shadow, spacing } from "../utils/theme";
import type { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

const MOBILE_REGEX = /^\d{10}$/;

export function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mobileNumber, setMobileNumber] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  async function handleContinue() {
    const mobile = mobileNumber.trim();
    if (!MOBILE_REGEX.test(mobile)) {
      Alert.alert("Invalid mobile number", "Please enter a valid 10-digit mobile number.");
      return;
    }
    setIsChecking(true);
    try {
      const exists = await checkMobileExists(mobile);
      if (exists) {
        navigation.navigate("Otp", { mode: "login", mobileNumber: mobile });
      } else {
        navigation.navigate("Register", { mobileNumber: mobile });
      }
    } catch (error) {
      Alert.alert("Something went wrong", getApiErrorMessage(error));
    } finally {
      setIsChecking(false);
    }
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
            <View style={styles.logoBadge}>
              <Image source={require("../../assets/sai_gems.jpg")} style={styles.logoImage} resizeMode="cover" />
            </View>
            <Text style={styles.brand}>{DEALER_NAME}</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Enter your mobile number to sign in or create an account</Text>

            <View style={styles.form}>
              <Input
                label="Mobile Number"
                value={mobileNumber}
                onChangeText={(text) => setMobileNumber(text.replace(/[^0-9]/g, "").slice(0, 10))}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="9876543210"
                returnKeyType="done"
              />

              <Button title="Continue" onPress={handleContinue} loading={isChecking} style={styles.button} />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </LinearGradient>
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
  logoBadge: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadow.md,
  },
  logoImage: {
    width: "100%",
    height: "100%",
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
    fontSize: 26,
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
  button: {
    marginTop: spacing.sm,
  },
});
