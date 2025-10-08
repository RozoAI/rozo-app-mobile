import { ArrowDownIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
// import { type DepositDialogRef, TopupSheet } from '@/features/settings/deposit-sheet';
// import { WithdrawActionSheet } from '@/features/settings/withdraw-sheet';
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { showToast } from "@/libs/utils";

import { useRef } from "react";
import { DepositDialogRef, TopupSheet } from "../settings/deposit-sheet";
import { WithdrawActionSheet } from "../settings/withdraw-sheet";
import { BalanceInfo } from "./balance-info";

export function BalanceScreen() {
  const { t } = useTranslation();
  const { balance, refetch, isLoading } = useWalletBalance();

  const depositDialogRef = useRef<DepositDialogRef>(null);

  const handleReceivePress = () => {
    depositDialogRef.current?.open();
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
          <Text className="mb-1 text-2xl font-bold">{t("balance.title")}</Text>
          <Text className="text-sm text-gray-400">
            {t("balance.description")}
          </Text>
        </View>
      </VStack>

      <VStack space="lg">
        {/* Balance Card */}

        <VStack className="rounded-xl border border-background-300 bg-background-0 px-4 py-2">
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

            {/* Withdraw Button */}
            <View className="flex-1">
              <WithdrawActionSheet
                onSuccess={() => refetch()}
                balance={balance ?? undefined}
              />
            </View>
          </HStack>
        </VStack>
      </VStack>

      {/* Receive Sheet */}
      <TopupSheet ref={depositDialogRef} onConfirm={handleTopUpConfirm} />
    </ScrollView>
  );
}
