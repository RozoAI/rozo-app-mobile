import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView } from "react-native";

import { VStack } from "@/components/ui/vstack";
import { useToast } from "@/hooks/use-toast";
import { useWalletBalance } from "@/hooks/use-wallet-balance";

import { useWallet } from "@/providers";
import { DepositDialogRef, TopupSheet } from "../settings/deposit-sheet";
import { WithdrawDialogRef, WithdrawSheet } from "../settings/withdraw-sheet";
import { BalanceActions } from "./balance-actions";
import { BalanceHeader } from "./balance-header";
import { BalanceInfo } from "./balance-info";
import { BalanceTransactions } from "./balance-transactions";

export function BalanceScreen() {
  const { t } = useTranslation();
  const { balance, refetch, isLoading } = useWalletBalance();
  const { success } = useToast();
  const { preferredPrimaryChain } = useWallet();

  const depositDialogRef = useRef<DepositDialogRef>(null);
  const withdrawDialogRef = useRef<WithdrawDialogRef>(null);
  const transactionsRef = useRef<{ refresh: () => void }>(null);

  const [refreshing, setRefreshing] = useState(false);

  const handleReceivePress = () => {
    depositDialogRef.current?.open();
  };

  const handleWithdrawPress = () => {
    withdrawDialogRef.current?.open();
  };

  const handleTopUpConfirm = (amount: string) => {
    success(t("deposit.topUpInitiated", { amount }));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
    transactionsRef.current?.refresh();

    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, [refetch]);

  const handleBalanceRefresh = useCallback(() => {
    refetch();
    transactionsRef.current?.refresh();
  }, [refetch]);

  return (
    <>
      <ScrollView
        className="flex-1"
        style={{ padding: 0, margin: 0, width: "100%" }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <VStack space="lg" className="pb-6">
          {/* Header */}
          <BalanceHeader />

          {/* Balance Card */}
          <VStack space="lg">
            <VStack
              className="rounded-xl border border-background-300 bg-background-0"
              style={{ padding: 16 }}
              space="lg"
            >
              <BalanceInfo
                balance={balance ?? undefined}
                isLoading={isLoading}
                refetch={handleBalanceRefresh}
              />
            </VStack>
          </VStack>

          {/* Action Buttons */}
          <BalanceActions
            onReceivePress={handleReceivePress}
            onWithdrawPress={handleWithdrawPress}
          />

          {/* Transaction List */}
          {preferredPrimaryChain === "ethereum" && (
            <BalanceTransactions ref={transactionsRef} />
          )}
        </VStack>
      </ScrollView>

      {/* Receive Sheet */}
      <TopupSheet
        ref={depositDialogRef}
        onConfirm={handleTopUpConfirm}
        onComplete={() => refetch()}
      />

      {/* Withdraw Sheet */}
      <WithdrawSheet
        ref={withdrawDialogRef}
        onSuccess={() => refetch()}
        balance={balance ?? undefined}
      />
    </>
  );
}
