import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import BaseIcon from "@/components/svg/base-icon";
import StellarIcon from "@/components/svg/stellar-icon";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/providers";
import { useApp } from "@/providers/app.provider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SettingItem } from "./setting-item";

export const SwitchPrimaryWallet: React.FC = () => {
  const insets = useSafeAreaInsets();

  const { t } = useTranslation();
  const { preferredPrimaryChain, setPreferredPrimaryChain } = useApp();
  const { error: toastError } = useToast();
  const { switchWallet, isCreating } = useWallet();

  const [showActionsheet, setShowActionsheet] = useState<boolean>(false);

  const handleOpen = useCallback(() => setShowActionsheet(true), []);
  const handleClose = useCallback(() => setShowActionsheet(false), []);

  const isEth = useMemo(
    () => preferredPrimaryChain === "ethereum",
    [preferredPrimaryChain]
  );

  const title = useMemo(
    () => t(`settings.switchWallet.${isEth ? "toStellar" : "toBase"}`),
    [t, isEth]
  );

  const description = useMemo(
    () =>
      t(
        `settings.switchWallet.${
          isEth ? "stellarDescription" : "baseDescription"
        }`
      ),
    [t, isEth]
  );

  const confirmMessage = useMemo(
    () =>
      t(
        `settings.switchWallet.${
          isEth ? "confirmMessageToStellar" : "confirmMessageToBase"
        }`
      ),
    [t, isEth]
  );

  const handleSwitch = async () => {
    try {
      await switchWallet();
      handleClose();
      setTimeout(() => {
        setPreferredPrimaryChain(isEth ? "stellar" : "ethereum");
      }, 300);
    } catch (error) {
      toastError(error instanceof Error ? error.message : (error as string));
    }
  };

  return (
    <>
      <SettingItem
        customIcon={
          isEth ? (
            <StellarIcon width={20} height={20} />
          ) : (
            <BaseIcon width={20} height={20} />
          )
        }
        title={title}
        description={description}
        onPress={handleOpen}
      />

      <Actionsheet isOpen={showActionsheet} onClose={handleClose}>
        <ActionsheetBackdrop />
        <ActionsheetContent style={{ paddingBottom: insets.bottom + 8 }}>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack space="lg" className="w-full">
            <Box className="items-center">
              <Heading size="lg" className="text-typography-950">
                {title}
              </Heading>
            </Box>

            <View className="relative w-full items-center">
              {isEth ? (
                <StellarIcon width={72} height={72} />
              ) : (
                <BaseIcon width={72} height={72} />
              )}

              <Text className="text-center text-gray-600 dark:text-gray-400 mt-4">
                {confirmMessage}
              </Text>
            </View>

            <View className="relative mt-4 flex-col gap-2">
              <Button
                size="lg"
                action="primary"
                className="w-full rounded-xl"
                onPress={handleSwitch}
                disabled={isCreating}
              >
                <ButtonText>
                  {isCreating
                    ? `Creating ${isEth ? "Stellar" : "Ethereum"}`
                    : t("general.confirmAndProceed")}
                </ButtonText>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onPress={handleClose}
                className="w-full rounded-xl"
                disabled={isCreating}
              >
                <ButtonText>{t("general.cancel")}</ButtonText>
              </Button>
            </View>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
};
