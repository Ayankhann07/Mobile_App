import { useCallback, useState } from "react";
import { Alert, Animated, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Loader } from "../components/Loader";
import { StatusBadge } from "../components/StatusBadge";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppearOnMount } from "../components/AppearOnMount";
import { useAuth } from "../hooks/useAuth";
import { useSound } from "../hooks/useSound";
import { usePressScale } from "../hooks/usePressScale";
import { getApiErrorMessage, getApiErrorStatus, fileUrl } from "../services/apiClient";
import { getBank, getKyc, submitBank, submitKyc, updateProfile, type PickedImage } from "../services/customerApi";
import type { Bank, Customer, Kyc } from "../services/types";
import { formatDate } from "../utils/formatters";
import { colors, radius, screenPadding, shadow, spacing } from "../utils/theme";
import type { MainTabScreenProps } from "../navigation/types";

type Tab = "profile" | "kyc" | "bank";

const LOCKED_MESSAGE = "Locked after KYC approval — contact your dealer to make changes.";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = MainTabScreenProps<"ProfileTab">;

export function ProfileScreen({ navigation, route }: Props) {
  const { customer } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(route.params?.initialTab ?? "profile");
  const [kyc, setKyc] = useState<Kyc | null>(null);
  const [bank, setBank] = useState<Bank | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    setIsLoading(true);
    Promise.all([getKyc(), getBank()])
      .then(([kycData, bankData]) => {
        setKyc(kycData);
        setBank(bankData);
      })
      .catch((error) => Alert.alert("Couldn't load profile", getApiErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const isKycApproved = kyc?.Status === "APPROVED";

  return (
    <View style={styles.flex}>
      <ScreenHeader title="My Profile" onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())} />
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          <TabButton label="Profile" active={activeTab === "profile"} onPress={() => setActiveTab("profile")} />
          <TabButton label="KYC" active={activeTab === "kyc"} onPress={() => setActiveTab("kyc")} />
          <TabButton label="Bank" active={activeTab === "bank"} onPress={() => setActiveTab("bank")} />
        </View>
      </View>

      {isLoading ? (
        <Loader fullscreen label="Loading…" />
      ) : (
        <AppearOnMount key={activeTab} style={styles.flex}>
          {activeTab === "profile" && customer && <ProfileTab customer={customer} isKycApproved={isKycApproved} />}
          {activeTab === "kyc" && <KycTab kyc={kyc} onSubmitted={load} />}
          {activeTab === "bank" && <BankTab bank={bank} kycApproved={isKycApproved} onSubmitted={load} />}
        </AppearOnMount>
      )}
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({ toScale: 0.96 });
  return (
    <Pressable style={styles.tabButtonWrap} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.tabButton, active && styles.tabButtonActive, animatedStyle]}>
        <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ----- Profile tab -----

function ProfileTab({ customer, isKycApproved }: { customer: Customer; isKycApproved: boolean }) {
  const insets = useSafeAreaInsets();
  const { updateCustomer } = useAuth();
  const { soundEnabled, setSoundEnabled } = useSound();
  const initials = customer.FullName?.trim().charAt(0).toUpperCase() || "?";

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(customer.FullName);
  const [email, setEmail] = useState(customer.Email ?? "");
  const [address, setAddress] = useState(customer.Address ?? "");
  const [isSaving, setIsSaving] = useState(false);

  function startEditing() {
    setFullName(customer.FullName);
    setEmail(customer.Email ?? "");
    setAddress(customer.Address ?? "");
    setIsEditing(true);
  }

  async function handleSave() {
    if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateProfile({
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });
      updateCustomer(updated);
      setIsEditing(false);
    } catch (error) {
      if (getApiErrorStatus(error) === 403) {
        Alert.alert("Locked", getApiErrorMessage(error));
        setIsEditing(false);
      } else {
        Alert.alert("Update failed", getApiErrorMessage(error));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.tabContent, { paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{customer.FullName}</Text>
        <Text style={styles.profileSub}>{customer.MobileNumber}</Text>
      </View>

      <Card style={styles.preferencesCard}>
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceLabelWrap}>
            <Ionicons
              name={soundEnabled ? "volume-high-outline" : "volume-mute-outline"}
              size={18}
              color={colors.textMuted}
            />
            <Text style={styles.preferenceLabel}>Sound effects</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: colors.border, true: colors.gold }}
            thumbColor={colors.white}
          />
        </View>
      </Card>

      {isEditing ? (
        <>
          <Card>
            <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Jane Doe" />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Input label="Address" value={address} onChangeText={setAddress} placeholder="123 Main Street" />
          </Card>
          <View style={styles.editActions}>
            <Button title="Cancel" variant="secondary" onPress={() => setIsEditing(false)} style={styles.editActionButton} />
            <Button title="Save Changes" onPress={handleSave} loading={isSaving} style={styles.editActionButton} />
          </View>
        </>
      ) : (
        <>
          <Card>
            <FieldRow label="Full Name" value={customer.FullName} />
            <FieldRow label="Mobile Number" value={customer.MobileNumber} />
            <FieldRow label="Email" value={customer.Email ?? "Not added yet"} />
            <FieldRow label="Address" value={customer.Address ?? "Not added yet"} />
            <FieldRow label="Customer Since" value={formatDate(customer.CreatedAt)} last />
          </Card>
          {isKycApproved ? (
            <Text style={styles.helperText}>{LOCKED_MESSAGE}</Text>
          ) : (
            <Button title="Edit Profile" variant="secondary" onPress={startEditing} style={styles.submitButton} />
          )}
        </>
      )}
    </ScrollView>
  );
}

function FieldRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.fieldRow, !last && styles.fieldRowBorder]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

// ----- KYC tab -----

function KycTab({ kyc, onSubmitted }: { kyc: Kyc | null; onSubmitted: () => void }) {
  const insets = useSafeAreaInsets();
  const needsSubmission = !kyc || kyc.Status === "REJECTED";

  if (!needsSubmission && kyc) {
    return (
      <ScrollView contentContainerStyle={[styles.tabContent, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Card>
          <View style={styles.statusHeader}>
            <Text style={styles.fieldLabel}>KYC Status</Text>
            <StatusBadge status={kyc.Status} />
          </View>
          <FieldRow label="PAN Holder Name" value={kyc.PanHolderName} />
          <FieldRow label="PAN Number" value={kyc.PanNumber} />
          <FieldRow label="Submitted" value={formatDate(kyc.CreatedAt)} last />
        </Card>
        <Text style={styles.imageCaption}>PAN Image</Text>
        <Image source={{ uri: fileUrl(kyc.PanImagePath) }} style={styles.panPreview} resizeMode="contain" />
        {kyc.Status === "PENDING" && (
          <Text style={styles.helperText}>Your documents are under review. This usually takes 1-2 days.</Text>
        )}
        {kyc.Status === "APPROVED" && <Text style={styles.helperText}>{LOCKED_MESSAGE}</Text>}
      </ScrollView>
    );
  }

  return <KycForm rejected={kyc?.Status === "REJECTED"} onSubmitted={onSubmitted} />;
}

function KycForm({ rejected, onSubmitted }: { rejected: boolean; onSubmitted: () => void }) {
  const insets = useSafeAreaInsets();
  const [panHolderName, setPanHolderName] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [image, setImage] = useState<PickedImage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { animatedStyle: imagePickerAnim, onPressIn: onImagePressIn, onPressOut: onImagePressOut } = usePressScale({
    toScale: 0.98,
  });

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow photo library access to upload your PAN image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        name: asset.fileName ?? "pan.jpg",
        type: asset.mimeType ?? "image/jpeg",
      });
    }
  }

  async function handleSubmit() {
    if (!panHolderName.trim() || !panNumber.trim() || !image) {
      Alert.alert("Missing details", "Please fill in the PAN holder name, PAN number, and select an image.");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitKyc(panHolderName.trim(), panNumber.trim().toUpperCase(), image);
      Alert.alert("KYC submitted", "Your documents are now under review.");
      onSubmitted();
    } catch (error) {
      Alert.alert("Submission failed", getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.tabContent, { paddingBottom: insets.bottom + spacing.xl }]}>
      {rejected && (
        <Card style={styles.rejectedBanner}>
          <Text style={styles.rejectedText}>Your previous KYC was rejected. Please resubmit your details.</Text>
        </Card>
      )}
      <Input label="PAN Holder Name" value={panHolderName} onChangeText={setPanHolderName} placeholder="As per PAN card" />
      <Input
        label="PAN Number"
        value={panNumber}
        onChangeText={(text) => setPanNumber(text.toUpperCase())}
        placeholder="ABCDE1234F"
        autoCapitalize="characters"
        maxLength={10}
      />

      <Text style={styles.fieldLabel}>PAN Image</Text>
      <Pressable onPress={handlePickImage} onPressIn={onImagePressIn} onPressOut={onImagePressOut}>
        <Animated.View style={[styles.imagePicker, imagePickerAnim]}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.pickedImage} resizeMode="cover" />
          ) : (
            <>
              <Text style={styles.imagePickerIcon}>📷</Text>
              <Text style={styles.imagePickerText}>Tap to select PAN image</Text>
            </>
          )}
        </Animated.View>
      </Pressable>

      <Button
        title="Submit KYC"
        onPress={handleSubmit}
        loading={isSubmitting}
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

// ----- Bank tab -----

function BankTab({
  bank,
  kycApproved,
  onSubmitted,
}: {
  bank: Bank | null;
  kycApproved: boolean;
  onSubmitted: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(!bank && !kycApproved);

  if (bank && !isEditing) {
    return (
      <ScrollView contentContainerStyle={[styles.tabContent, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Card>
          <FieldRow label="Account Holder" value={bank.AccountHolderName} />
          <FieldRow label="Bank Name" value={bank.BankName} />
          <FieldRow label="Account Number" value={bank.AccountNumber} />
          <FieldRow label="IFSC" value={bank.IFSC} last />
        </Card>
        {kycApproved ? (
          <Text style={styles.helperText}>{LOCKED_MESSAGE}</Text>
        ) : (
          <Button title="Update Bank Details" variant="secondary" onPress={() => setIsEditing(true)} style={styles.submitButton} />
        )}
      </ScrollView>
    );
  }

  if (!bank && kycApproved) {
    return (
      <ScrollView contentContainerStyle={[styles.tabContent, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Card style={styles.lockedBanner}>
          <Text style={styles.lockedText}>
            You haven&apos;t added bank details, and {LOCKED_MESSAGE.toLowerCase()}
          </Text>
        </Card>
      </ScrollView>
    );
  }

  return <BankForm existing={bank} onSubmitted={() => { onSubmitted(); setIsEditing(false); }} />;
}

function BankForm({ existing, onSubmitted }: { existing: Bank | null; onSubmitted: () => void }) {
  const insets = useSafeAreaInsets();
  const [accountHolderName, setAccountHolderName] = useState(existing?.AccountHolderName ?? "");
  const [bankName, setBankName] = useState(existing?.BankName ?? "");
  const [accountNumber, setAccountNumber] = useState(existing?.AccountNumber ?? "");
  const [ifsc, setIfsc] = useState(existing?.IFSC ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!accountHolderName.trim() || !bankName.trim() || !accountNumber.trim() || !ifsc.trim()) {
      Alert.alert("Missing details", "Please fill in all bank details.");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitBank({
        AccountHolderName: accountHolderName.trim(),
        BankName: bankName.trim(),
        AccountNumber: accountNumber.trim(),
        IFSC: ifsc.trim().toUpperCase(),
      });
      Alert.alert("Saved", "Your bank details have been saved.");
      onSubmitted();
    } catch (error) {
      Alert.alert("Save failed", getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.tabContent, { paddingBottom: insets.bottom + spacing.xl }]}>
      <Input label="Account Holder Name" value={accountHolderName} onChangeText={setAccountHolderName} placeholder="As per bank records" />
      <Input label="Bank Name" value={bankName} onChangeText={setBankName} placeholder="e.g. State Bank of India" />
      <Input
        label="Account Number"
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="number-pad"
        placeholder="1234567890"
      />
      <Input
        label="IFSC Code"
        value={ifsc}
        onChangeText={(text) => setIfsc(text.toUpperCase())}
        placeholder="SBIN0001234"
        autoCapitalize="characters"
        maxLength={11}
      />
      <Button title="Save Bank Details" onPress={handleSubmit} loading={isSubmitting} style={styles.submitButton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  tabBarWrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: screenPadding,
    paddingVertical: spacing.sm,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  tabButtonWrap: { flex: 1 },
  tabButton: {
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  tabButtonActive: { backgroundColor: colors.surface, ...shadow.sm },
  tabButtonText: { color: colors.textMuted, fontWeight: "600", fontSize: 14 },
  tabButtonTextActive: { color: colors.primary },
  tabContent: { padding: screenPadding, flexGrow: 1 },
  profileHeader: { alignItems: "center", marginBottom: spacing.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.maroon,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  avatarText: { color: colors.gold, fontSize: 28, fontWeight: "800" },
  profileName: { fontSize: 18, fontWeight: "800", color: colors.text },
  profileSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  preferencesCard: { marginBottom: spacing.md },
  preferenceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  preferenceLabelWrap: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  preferenceLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
  fieldRow: { paddingVertical: spacing.sm + 2 },
  fieldRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  fieldLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  fieldValue: { fontSize: 15, color: colors.text, fontWeight: "600" },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  imageCaption: { fontSize: 12, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.xs },
  panPreview: {
    width: "100%",
    height: 180,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helperText: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm, textAlign: "center" },
  rejectedBanner: { backgroundColor: colors.dangerBg, borderColor: colors.danger, marginBottom: spacing.md },
  rejectedText: { color: colors.danger, fontSize: 13, fontWeight: "600" },
  lockedBanner: { backgroundColor: colors.surfaceAlt, borderColor: colors.borderStrong, marginBottom: spacing.md },
  lockedText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  imagePicker: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.md,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  imagePickerIcon: { fontSize: 28, marginBottom: spacing.xs },
  imagePickerText: { color: colors.textMuted, fontSize: 14, fontWeight: "500" },
  pickedImage: { width: "100%", height: "100%" },
  submitButton: { marginTop: spacing.sm },
  editActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  editActionButton: { flex: 1 },
});
