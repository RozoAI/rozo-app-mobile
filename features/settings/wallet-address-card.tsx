import * as Clipboard from "expo-clipboard";
import { Copy, QrCode, Wallet } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import QRCode from "react-qr-code";

import BaseIcon from "@/components/svg/base-icon";
import StellarIcon from "@/components/svg/stellar-icon";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useActivateTrustlineWithPin } from "@/features/settings/pin/use-activate-trustline-with-pin";
import { useToast } from "@/hooks/use-toast";
import { getShortId } from "@/libs/utils";
import { useWallet } from "@/providers";
import { useApp } from "@/providers/app.provider";
import { useStellar } from "@/providers/stellar.provider";

export const WalletAddressCard = () => {
  const { t } = useTranslation();
  const { primaryWallet } = useApp();
  const { success } = useToast();
  const { preferredPrimaryChain } = useWallet();
  const { account, hasUsdcTrustline, refreshAccount } = useStellar();
  const activateTrustlineWithPin = useActivateTrustlineWithPin({
    onSuccess: () => {
      refreshAccount();
    },
  });

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(primaryWallet?.address ?? "");
    success(
      `${t("general.copiedToClipboard")} - ${t(
        "general.copiedWalletAddressDescription"
      )}`
    );
  };

  const getChainIcon = (chain: "ethereum" | "stellar") => {
    return chain === "ethereum" ? (
      <BaseIcon width={20} height={20} />
    ) : (
      <StellarIcon width={20} height={20} />
    );
  };

  const handleQrCodePress = () => {
    setIsQrModalOpen(true);
  };

  // Activation handled via PIN validation hook

  return (
    <View className="w-full flex-row items-center justify-between px-4 py-3">
      <HStack className="items-center" space="md">
        <Icon as={Wallet} className="mb-auto mt-1" />
        <VStack className="items-start" space="xs">
          <Text size="md">{t("general.address")}</Text>
          {primaryWallet && (
            <View className="flex-row items-center space-x-1 gap-1">
              {primaryWallet.chain && getChainIcon(primaryWallet.chain)}
              <Text className="text-primary-500" size="sm">
                {getShortId(primaryWallet.address ?? "", 6, 4)}
              </Text>
            </View>
          )}
        </VStack>
      </HStack>

      <View className="flex flex-row items-center gap-3">
        {preferredPrimaryChain === "stellar" &&
          (!account || !hasUsdcTrustline) && (
            <Button
              onPress={activateTrustlineWithPin.initiateActivate}
              size="xs"
            >
              <ButtonText>{"Activate"}</ButtonText>
            </Button>
          )}
        <Button
          onPress={handleQrCodePress}
          size="xs"
          variant="outline"
          className="rounded-full p-2"
        >
          <ButtonIcon as={QrCode}></ButtonIcon>
        </Button>
        <Button
          onPress={copyToClipboard}
          size="xs"
          variant="outline"
          className="rounded-full p-2"
        >
          <ButtonIcon as={Copy}></ButtonIcon>
        </Button>
      </View>

      <Actionsheet
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <VStack space="lg">
            <HStack className="w-full items-center justify-between">
              <Text size="lg" className="font-semibold">
                {t("general.walletAddress")}
              </Text>
            </HStack>

            <View className="items-center">
              <QRCode value={primaryWallet?.address ?? ""} size={200} />
            </View>

            <VStack className="w-full items-center" space="sm">
              <Text size="sm" className="font-mono text-center">
                {primaryWallet?.address ?? ""}
              </Text>
            </VStack>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
      {activateTrustlineWithPin.renderPinValidationInput()}
    </View>
  );
};
