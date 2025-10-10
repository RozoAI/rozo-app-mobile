import { CheckIcon, Funnel } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { type MerchantOrderStatus } from "@/resources/schema/order";

type Props = {
  onStatusChange: (status: MerchantOrderStatus) => void;
};

export function FilterOrderActionSheet({ onStatusChange }: Props) {
  const { t } = useTranslation();
  const theme = useColorScheme();
  const insets = useSafeAreaInsets();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] =
    useState<MerchantOrderStatus>("COMPLETED");

  const orderStatuses: MerchantOrderStatus[] = ["PENDING", "COMPLETED"];

  const handleStatusSelect = (status: MerchantOrderStatus) => {
    setSelectedStatus(status);
    onStatusChange(status);
    setIsOpen(false);
  };

  const getStatusLabel = (status: MerchantOrderStatus) => {
    return t(`order.status.${status.toLowerCase()}`);
  };

  return (
    <>
      <Button
        variant="outline"
        size="xs"
        onPress={() => setIsOpen(true)}
        className="rounded-xl"
      >
        <ButtonIcon as={Funnel} />
        <ButtonText>{getStatusLabel(selectedStatus)}</ButtonText>
      </Button>

      <Actionsheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent style={{ paddingBottom: insets.bottom }}>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>

          <VStack className="w-full" space="lg">
            <Box className="items-center">
              <Heading size="lg">{t("order.filterByStatus")}</Heading>
            </Box>

            <Box>
              {orderStatuses.map((status) => (
                <ActionsheetItem
                  key={status}
                  onPress={() => handleStatusSelect(status)}
                  className="flex-row items-center justify-between py-3"
                >
                  <ActionsheetItemText className="flex-1">
                    {getStatusLabel(status)}
                  </ActionsheetItemText>
                  {selectedStatus === status && (
                    <CheckIcon
                      size={16}
                      color={theme === "dark" ? "#fff" : "#000"}
                    />
                  )}
                </ActionsheetItem>
              ))}
            </Box>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
