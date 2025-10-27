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
import { SettingItem } from "@/features/settings/setting-item";
import { usePOSToggle } from "@/providers/preferences.provider";
import { ShoppingCartIcon } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function POSToggleSetting() {
  const { t } = useTranslation();
  const { showPOS, togglePOS } = usePOSToggle();
  const insets = useSafeAreaInsets();
  const [showActionsheet, setShowActionsheet] = useState<boolean>(false);

  const handleOpen = useCallback(() => setShowActionsheet(true), []);
  const handleClose = useCallback(() => setShowActionsheet(false), []);

  const handleEnableDisable = useCallback(() => {
    togglePOS(!showPOS);
    handleClose();
  }, [togglePOS, showPOS, handleClose]);

  const customization = useMemo(() => {
    const isEnabled = showPOS;
    return {
      statusText: isEnabled ? t("settings.pointOfSales.enabled") : t("settings.pointOfSales.disabled"),
      buttonText: isEnabled ? t("settings.pointOfSales.disable") : t("settings.pointOfSales.enable"),
      buttonVariant: isEnabled ? "outline" : "solid",
      buttonAction: isEnabled ? "negative" : "positive",
      iconColor: isEnabled ? "#10B981" : "#6B7280",
      message: isEnabled 
        ? t("settings.pointOfSales.disableMessage")
        : t("settings.pointOfSales.enableMessage"),
    };
  }, [showPOS, t]);

  return (
    <>
      <SettingItem
        icon={ShoppingCartIcon}
        title={t("settings.pointOfSales.title")}
        description={t("settings.pointOfSales.description")}
        value={customization.statusText}
        onPress={handleOpen}
        iconColor={customization.iconColor}
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
                {t("settings.pointOfSales.title")}
              </Heading>
            </Box>

            <View className="relative w-full items-center">
              <Text className="text-center text-gray-600 dark:text-gray-400">
                {customization.message}
              </Text>
            </View>

            <View className="relative mt-4 flex-col gap-2">
              <Button
                size="lg"
                variant={customization.buttonVariant}
                action={customization.buttonAction}
                onPress={handleEnableDisable}
                className="w-full rounded-xl"
              >
                <ButtonText>{customization.buttonText}</ButtonText>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onPress={handleClose}
                className="w-full rounded-xl"
              >
                <ButtonText>{t("general.cancel")}</ButtonText>
              </Button>
            </View>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
