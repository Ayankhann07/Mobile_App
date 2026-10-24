import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "../components/Card";
import { Loader } from "../components/Loader";
import { MetalIcon } from "../components/MetalIcon";
import { getApiErrorMessage } from "../services/apiClient";
import { listSipInstallments } from "../services/customerApi";
import type { SipInstallment } from "../services/types";
import { formatCurrency, formatDate, formatWeight } from "../utils/formatters";
import { colors, screenPadding, spacing } from "../utils/theme";
import type { AppStackScreenProps } from "../navigation/types";

type Props = AppStackScreenProps<"SipInstallments">;

export function SipInstallmentsScreen({ route }: Props) {
  const { sipId, metalType } = route.params;
  const insets = useSafeAreaInsets();
  const [installments, setInstallments] = useState<SipInstallment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    listSipInstallments(sipId)
      .then((data) => {
        if (isActive) setInstallments(data);
      })
      .catch((error) => Alert.alert("Couldn't load installments", getApiErrorMessage(error)))
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [sipId]);

  if (isLoading) {
    return <Loader fullscreen label="Loading installments…" />;
  }

  return (
    <FlatList
      style={styles.flex}
      data={installments}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      renderItem={({ item }) => <InstallmentRow installment={item} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <MetalIcon metal={metalType} size={76} />
          </View>
          <Text style={styles.emptyTitle}>No installments yet</Text>
          <Text style={styles.emptyText}>This SIP hasn&apos;t auto-invested yet. It runs on its next scheduled due date.</Text>
        </View>
      }
    />
  );
}

function InstallmentRow({ installment }: { installment: SipInstallment }) {
  const isGold = installment.purchase.MetalType === "GOLD";
  return (
    <Card style={styles.row}>
      <View style={styles.rowTop}>
        <View style={styles.metalRow}>
          <MetalIcon metal={installment.purchase.MetalType} size={20} />
          <Text style={styles.metal}>{isGold ? "Gold" : "Silver"}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(installment.RunDate)}</Text>
      </View>
      <View style={styles.detailRow}>
        <Detail label="Rate" value={formatCurrency(installment.Rate)} />
        <Detail label="Weight" value={formatWeight(installment.Weight)} />
      </View>
      <View style={styles.detailRow}>
        <Detail label="Amount" value={formatCurrency(installment.Amount)} />
        <Detail label="Net Amount" value={formatCurrency(installment.purchase.NetAmount)} />
      </View>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: screenPadding, flexGrow: 1 },
  row: { padding: spacing.md },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metalRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metal: { fontSize: 15, fontWeight: "700", color: colors.text },
  dateText: { fontSize: 11, color: colors.textMuted },
  detailRow: { flexDirection: "row", marginTop: spacing.xs },
  detail: { flex: 1 },
  detailLabel: { fontSize: 11, color: colors.textMuted },
  detailValue: { fontSize: 13, fontWeight: "600", color: colors.text, marginTop: 1 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: spacing.xl * 2 },
  emptyIconWrap: { marginBottom: spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  emptyText: { color: colors.textMuted, textAlign: "center", paddingHorizontal: spacing.xl, fontSize: 13 },
});
