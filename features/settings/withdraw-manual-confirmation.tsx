import * as React from "react";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

type Props = {
  isOpen: boolean;
  onClose?: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  balance?: string;
};

export function WithdrawManualConfirmation({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  balance = "0",
}: Props) {
  const { t } = useTranslation();

  return (
    <AlertDialog isOpen={isOpen} onClose={onClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Text size="lg" className="font-semibold">
            Confirm Manual Withdraw
          </Text>
        </AlertDialogHeader>

        <AlertDialogBody className="my-4">
          <VStack space="md">
            <Text size="sm" className="text-typography-700">
              You are about to initiate a manual withdraw that will transfer
              your entire balance.
            </Text>

            <VStack space="xs" className="rounded-lg bg-background-50 p-3">
              <HStack className="justify-between">
                <Text size="sm" className="font-medium">
                  Amount to withdraw:
                </Text>
                <Text size="sm" className="font-semibold">
                  {balance} USDC
                </Text>
              </HStack>
            </VStack>

            <Text size="xs" className="text-typography-600">
              After confirming, please contact the Rozo team at{" "}
              <Text size="xs" className="font-semibold text-typography-900">
                hi@rozo.ai
              </Text>{" "}
              to complete the withdrawal process.
            </Text>
          </VStack>
        </AlertDialogBody>

        <AlertDialogFooter>
          <HStack space="sm" className="w-full">
            <Button
              variant="outline"
              onPress={onClose}
              isDisabled={isLoading}
              className="flex-1"
            >
              <ButtonText>{t("general.cancel")}</ButtonText>
            </Button>

            <Button
              onPress={onConfirm}
              isDisabled={isLoading}
              className="flex-1"
            >
              {isLoading && <ButtonSpinner />}
              <ButtonText>
                {isLoading ? t("general.processing") : "Confirm"}
              </ButtonText>
            </Button>
          </HStack>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
