import { ArrowDownIcon, BanknoteArrowDown } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { showToast } from "@/libs/utils";

import { ThemedText } from "@/components/themed-text";
import { useRef } from "react";
import { DepositDialogRef, TopupSheet } from "../settings/deposit-sheet";
import { WithdrawDialogRef, WithdrawSheet } from "../settings/withdraw-sheet";
import { BalanceInfo } from "./balance-info";

export function BalanceScreen() {
  const { t } = useTranslation();
  const { balance, refetch, isLoading } = useWalletBalance();

  const depositDialogRef = useRef<DepositDialogRef>(null);
  const withdrawDialogRef = useRef<WithdrawDialogRef>(null);

  const handleReceivePress = () => {
    depositDialogRef.current?.open();
  };

  const handleWithdrawPress = () => {
    withdrawDialogRef.current?.open();
  };

  const handleTopUpConfirm = (amount: string) => {
    showToast({
      message: t("deposit.topUpInitiated", { amount }),
      type: "success",
    });
  };

  return (
    <ScrollView className="my-6 flex-1">
      {/* Header */}
      <VStack className="flex flex-row items-start justify-between">
        <View className="mb-6">
          <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
            {t("balance.title")}
          </ThemedText>
          <ThemedText style={{ fontSize: 14, color: "#6B7280" }} type="default">
            {t("balance.description")}
          </ThemedText>
        </View>
      </VStack>

      <VStack space="lg">
        {/* Balance Card */}

        <VStack
          className="rounded-xl border border-background-300 bg-background-0"
          style={{ padding: 16 }}
          space="lg"
        >
          <BalanceInfo
            balance={balance ?? undefined}
            isLoading={isLoading}
            refetch={refetch}
          />
        </VStack>

        {/* Action Buttons */}
        <VStack space="md" className="flex-1 justify-center">
          <HStack space="md" className="w-full">
            {/* Receive Button */}
            <Button
              size="sm"
              className="flex-1 rounded-xl"
              variant="solid"
              action="secondary"
              onPress={handleReceivePress}
            >
              <ButtonIcon as={ArrowDownIcon}></ButtonIcon>
              <ButtonText>{t("general.receive")}</ButtonText>
            </Button>

            <Button
              size="sm"
              className="flex-1 rounded-xl"
              variant="solid"
              action="primary"
              onPress={handleWithdrawPress}
            >
              <ButtonIcon as={BanknoteArrowDown} />
              <ButtonText>{t("general.withdraw")}</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </VStack>

      {/* Receive Sheet */}
      <TopupSheet ref={depositDialogRef} onConfirm={handleTopUpConfirm} />

      {/* Withdraw Sheet */}
      <WithdrawSheet
        ref={withdrawDialogRef}
        onSuccess={() => refetch()}
        balance={balance ?? undefined}
      />
    </ScrollView>
  );
}
