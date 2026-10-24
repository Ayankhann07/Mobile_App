import { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { DEALER_NAME } from "../config";
import { colors, gradients, radius, screenPadding, shadow, spacing } from "../utils/theme";
import type { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

const MOBILE_REGEX = /^\d{10}$/;

export function RegisterScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState(route.params.mobileNumber);

  function handleContinue() {
    const mobile = mobileNumber.trim();
    const name = fullName.trim();
    if (!MOBILE_REGEX.test(mobile)) {
      Alert.alert("Invalid mobile number", "Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!name) {
      Alert.alert("Missing details", "Please enter your full name.");
      return;
    }
    navigation.navigate("Otp", { mode: "register", mobileNumber: mobile, fullName: name });
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Just your name — start investing in digital gold &amp; silver</Text>

            <View style={styles.form}>
              <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Jane Doe" returnKeyType="next" />
              <Input
                label="Mobile Number"
                value={mobileNumber}
                onChangeText={(text) => setMobileNumber(text.replace(/[^0-9]/g, "").slice(0, 10))}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="9876543210"
                returnKeyType="done"
              />

              <Button title="Continue" onPress={handleContinue} style={styles.button} />
            </View>

            <Pressable onPress={() => navigation.navigate("Login")} style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account? <Text style={styles.link}>Sign In</Text>
              </Text>
            </Pressable>
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
    width: 60,
    height: 60,
    borderRadius: radius.lg,
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
    fontSize: 22,
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
  footer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  link: {
    color: colors.primary,
    fontWeight: "700",
  },
});
