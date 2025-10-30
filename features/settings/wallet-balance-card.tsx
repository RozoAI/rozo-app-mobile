import { Coins, RefreshCw } from "lucide-react-native";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useToast } from "@/hooks/use-toast";
import { useWalletBalance } from "@/hooks/use-wallet-balance";

import { type DepositDialogRef, TopupSheet } from "./deposit-sheet";
import { WithdrawDialogRef, WithdrawSheet } from "./withdraw-sheet";

export const WalletBalanceCard = () => {
  const { t } = useTranslation();
  const { balance, isLoading, refetch } = useWalletBalance();
  const { success } = useToast();
  const DepositDialogRef = useRef<DepositDialogRef>(null);
  const WithdrawDialogRef = useRef<WithdrawDialogRef>(null);

  const handleTopUpPress = () => {
    DepositDialogRef.current?.open();
  };

  const handleWithdrawPress = () => {
    WithdrawDialogRef.current?.open();
  };

  const handleTopUpConfirm = (amount: string) => {
    success(`Top up of ${amount} initiated`);
  };

  return (
    <VStack space="sm" className="w-full">
      <View className="w-full flex-row items-center justify-between px-2 py-3">
        <HStack className="items-center" space="md">
          <Icon as={Coins} className="mb-auto mt-1 stroke-[#747474]" />
          <VStack className="items-start" space="xs">
            <Text size="md">{t("general.walletBalance")}</Text>
            <View className="flex-row items-center space-x-1">
              <Text className="font-bold text-primary-500" size="sm">
                {balance?.formattedBalance ?? "0"}{" "}
                {balance?.token?.label ?? "USDC"}
              </Text>
            </View>

            {isLoading && (
              <View className="absolute inset-x-0 top-0 z-10 flex size-full items-center justify-center bg-white/50 py-2">
                <Spinner />
              </View>
            )}
          </VStack>
        </HStack>

        <View className="flex flex-row items-center gap-3">
          <Button
            onPress={handleTopUpPress}
            size="xs"
            variant="solid"
            action="secondary"
            className="p-2"
          >
            <ButtonText>{t("general.receive")}</ButtonText>
          </Button>
          <Button
            size="xs"
            variant="solid"
            action="secondary"
            className="p-2"
            onPress={handleWithdrawPress}
          >
            <ButtonText>{t("general.withdraw")}</ButtonText>
          </Button>
          <Button
            onPress={refetch}
            disabled={isLoading}
            size="xs"
            variant="outline"
            className="rounded-full p-2"
          >
            <ButtonIcon as={RefreshCw}></ButtonIcon>
          </Button>
        </View>
      </View>

      <TopupSheet ref={DepositDialogRef} onConfirm={handleTopUpConfirm} />
      <WithdrawSheet
        ref={WithdrawDialogRef}
        onSuccess={() => refetch()}
        balance={balance ?? undefined}
      />
    </VStack>
  );
};
