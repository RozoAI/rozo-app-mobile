import { t } from "i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { VStack } from "@/components/ui/vstack";

import { TransactionList } from "./transaction-list";

export function TransactionScreen() {
  return (
    <View className="my-6 flex-1">
      {/* Header */}
      <VStack className="flex flex-row items-start justify-between">
        <View className="mb-6">
          <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
            {t("transaction.recentTransactions")}
          </ThemedText>
          <ThemedText style={{ fontSize: 14, color: "#6B7280" }} type="default">
            {t("transaction.recentTransactionsDesc")}
          </ThemedText>
        </View>
      </VStack>

      <View className="flex-1">
        <TransactionList />
      </View>
    </View>
  );
}
