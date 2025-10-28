import { forwardRef, useCallback, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spinner } from "@/components/ui/spinner";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import { useBaseUSDCTransactions } from "@/modules/api/api/transactions";
import { useApp } from "@/providers/app.provider";

import { HStack } from "@/components/ui/hstack";
import EmptyTransactionsState from "../transactions/empty-transactions";
import { TransactionCard } from "../transactions/transaction-card";

interface BalanceTransactionsProps {
  onRefresh?: () => void;
}

export const BalanceTransactions = forwardRef<
  { refresh: () => void },
  BalanceTransactionsProps
>(({ onRefresh }, ref) => {
  const { t } = useTranslation();
  const { primaryWallet } = useApp();

  const {
    data: transactionData,
    isLoading: isTransactionLoading,
    refetch: refetchTransactions,
  } = useBaseUSDCTransactions({
    variables: { address: primaryWallet?.address || "", force: true },
  });

  const transactions = transactionData?.pages.flat() ?? [];

  const handleRefresh = useCallback(() => {
    refetchTransactions();
  }, [refetchTransactions]);

  useImperativeHandle(ref, () => ({
    refresh: handleRefresh,
  }));

  const handleTransactionPress = (url: string) => {
    Linking.openURL(url);
  };

  if (isTransactionLoading) {
    return (
      <VStack space="lg" className="mt-6">
        <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>
          {t("transactions.title")}
        </ThemedText>
        <Spinner size="small" />
      </VStack>
    );
  }

  if (transactions.length === 0) {
    return (
      <VStack space="lg" className="mt-6">
        <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>
          {t("transactions.title")}
        </ThemedText>
        <EmptyTransactionsState />
      </VStack>
    );
  }

  return (
    <VStack space="lg" className="mt-6 mb-6">
      <HStack className="items-center justify-between">
        <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>
          {t("transactions.title")}
        </ThemedText>

        <ThemedText style={{ fontSize: 12, color: "#6B7280" }}>
          {t("transactions.5Latest")}
        </ThemedText>
      </HStack>

      <View>
        <VStack space="sm">
          {transactions.slice(0, 5).map((transaction, index) => (
            <TransactionCard
              key={transaction.hash || index}
              transaction={transaction}
              onPress={() => handleTransactionPress(transaction.url)}
            />
          ))}
        </VStack>
      </View>
    </VStack>
  );
});

BalanceTransactions.displayName = "BalanceTransactions";
