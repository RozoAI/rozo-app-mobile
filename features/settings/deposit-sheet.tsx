import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import {
    FormControl,
    FormControlError,
    FormControlErrorText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import useKeyboardBottomInset from "@/hooks/use-keyboard-bottom-inset";
import { getRedirectUri, showToast } from "@/libs/utils";
import { useCreateDeposit } from "@/modules/api/api/merchant/deposits";
import { type DepositResponse } from "@/modules/api/schema/deposit";
import { useApp } from "@/providers/app.provider";

import { useDynamicStyles } from "../payment";
import { PaymentModal } from "../payment/payment-modal";

export type DepositDialogRef = {
  open: () => void;
  close: () => void;
};

type DepositDialogProps = {
  onConfirm?: (amount: string) => void;
  onCancel?: () => void;
  onComplete?: () => void;
};

type FormValues = {
  amount: string;
};

export const TopupSheet = forwardRef<DepositDialogRef, DepositDialogProps>(
  ({ onConfirm, onCancel, onComplete }, ref) => {
    const { t } = useTranslation();
    const { defaultCurrency } = useApp();
    const insets = useSafeAreaInsets();
    const bottomInset = useKeyboardBottomInset();
    const [isOpen, setIsOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [createdDeposit, setCreatedDeposit] = useState<DepositResponse>();
    const dynamicStyles = useDynamicStyles();
    const [amount, setAmount] = useState("0");
    const router = useRouter();
    const { mutateAsync: createDeposit, isPending } = useCreateDeposit();

    const MIN_AMOUNT = 0.1;

    // Create Zod schema for form validation
    const createFormSchema = () => {
      return z.object({
        amount: z
          .string()
          .trim()
          .min(1, t("validation.required"))
          .refine((val) => !isNaN(parseFloat(val)), {
            message: t("validation.invalidAmount"),
          })
          .refine((val) => parseFloat(val) >= MIN_AMOUNT, {
            message: t("validation.minAmount", { min: MIN_AMOUNT }),
          }),
      });
    };

    const formSchema = createFormSchema();

    const {
      control,
      handleSubmit: hookFormSubmit,
      formState: { errors, isValid },
      reset,
    } = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        amount: "",
      },
      mode: "onChange",
    });

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => {
        setIsOpen(false);
        reset();
      },
    }));

    // Format amount with appropriate decimal and thousand separators
    const formatAmount = (value: string) => {
      if (!value) return "";

      // Handle decimal separator
      const decimalSeparator = defaultCurrency?.decimalSeparator || ".";
      // Check if the amount ends with a decimal separator
      const endsWithSeparator = value.endsWith(decimalSeparator);
      // Split by decimal separator
      const parts = value.split(decimalSeparator);
      const integerPart = parts[0] || "0"; // Default to '0' if empty
      const decimalPart = parts.length > 1 ? parts[1] : "";

      // Format integer part with thousand separators
      const thousandSeparator = defaultCurrency?.thousandSeparator || ",";
      const formattedInteger =
        integerPart === "0"
          ? "0"
          : integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

      // Return formatted amount with decimal part if it exists or if amount ends with separator
      if (decimalPart) {
        return `${formattedInteger}${decimalSeparator}${decimalPart}`;
      } else if (endsWithSeparator) {
        return `${formattedInteger}${decimalSeparator}`;
      } else {
        return formattedInteger;
      }
    };

    const onSubmit = async (data: FormValues) => {
      try {
        const response = await createDeposit({
          display_amount: Number(data.amount),
          display_currency: defaultCurrency?.code ?? "USD",
          redirect_uri: getRedirectUri("/orders"),
        });
        setAmount(data.amount);
        onConfirm?.(data.amount);
        setCreatedDeposit({
          qrcode: response.qrcode,
          deposit_id: response.deposit_id,
          order_number: response.order_number,
        });
        setIsPaymentModalOpen(true);
        setIsOpen(false);
        reset();
      } catch (error: any) {
        console.error("Error creating order:", error);
        showToast({ type: "danger", message: error.message as string });
      }
    };

    const handleCancel = () => {
      onCancel?.();
      setIsOpen(false);
      reset();
    };

    const handleClose = () => {
      setIsOpen(false);
      reset();
    };

    const handleClosePaymentModal = () => {
      setIsOpen(false);
      setIsPaymentModalOpen(false);
      reset();
    };

    const handleBackToHome = () => {
      handleClosePaymentModal();
      router.replace("/balance");
      onComplete?.();
    };

    return (
      <>
        <Actionsheet isOpen={isOpen} onClose={handleClose}>
          <ActionsheetBackdrop />
          <ActionsheetContent
            style={{ paddingBottom: insets.bottom + bottomInset + 8 }}
          >
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>

            <VStack className="w-full" space="lg">
              <Box className="items-center">
                <Heading size="lg" className="text-typography-950">
                  {t("general.receive")}
                </Heading>
              </Box>

              <VStack space="md">
                <Text size="sm" className="text-typography-600">
                  {t("general.enterAmount")}
                </Text>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field: { onChange, value } }) => (
                    <FormControl isInvalid={!!errors.amount}>
                      <Input className="rounded-xl" isInvalid={!!errors.amount}>
                        <InputSlot>
                          <Text
                            size="sm"
                            className="text-typography-500"
                            style={{ marginLeft: 8 }}
                          >
                            {defaultCurrency?.code}
                          </Text>
                        </InputSlot>
                        <InputField
                          placeholder="0.00"
                          value={formatAmount(value)}
                          onChangeText={(text) => {
                            // Remove formatting to store raw value
                            const thousandSeparator =
                              defaultCurrency?.thousandSeparator || ",";

                            // Only allow numbers, comma, and dot - no negative signs
                            const sanitizedText = text.replace(/[^0-9.,]/g, "");
                            // Remove thousand separators and keep only numbers and decimal separator
                            const cleanValue = sanitizedText.replace(
                              new RegExp(`\\${thousandSeparator}`, "g"),
                              ""
                            );
                            onChange(cleanValue);
                          }}
                          keyboardType="decimal-pad"
                        />
                      </Input>
                      {errors.amount && (
                        <FormControlError>
                          <FormControlErrorText>
                            {errors.amount.message}
                          </FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>
                  )}
                />
              </VStack>

              <View className="mt-4 flex-col gap-2">
                <Button
                  size="lg"
                  onPress={hookFormSubmit(onSubmit)}
                  isDisabled={!isValid || isPending}
                  className="w-full rounded-xl"
                >
                  <ButtonText>{t("general.confirm")}</ButtonText>
                </Button>
                <Button
                  size="lg"
                  onPress={handleCancel}
                  isDisabled={isPending}
                  className="w-full rounded-xl"
                  variant="link"
                >
                  <ButtonText>{t("general.cancel")}</ButtonText>
                </Button>
              </View>
            </VStack>
          </ActionsheetContent>
        </Actionsheet>

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          dynamicStyles={dynamicStyles}
          amount={amount || "0"}
          deposit={createdDeposit}
          onBackToHome={handleBackToHome}
          showOpenLink
        />
      </>
    );
  }
);

TopupSheet.displayName = "TopupSheet";
