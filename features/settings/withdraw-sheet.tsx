import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "lucide-react-native";
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Keyboard, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type Address } from "viem";
import { z } from "zod";

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import useKeyboardBottomInset from "@/hooks/use-keyboard-bottom-inset";
import { useTokenTransfer } from "@/hooks/use-token-transfer";
import { type TokenBalanceResult } from "@/libs/tokens";
import { showToast } from "@/libs/utils";

import { WithdrawManualConfirmation } from "./withdraw-manual-confirmation";

export type WithdrawDialogRef = {
  open: () => void;
  close: () => void;
};

type WithdrawDialogProps = {
  onClose?: () => void;
  onSuccess?: () => void;
  balance?: TokenBalanceResult;
};

type FormValues = {
  withdrawAddress: string;
  amount: string;
};

// Withdraw Sheet Component
export const WithdrawSheet = forwardRef<WithdrawDialogRef, WithdrawDialogProps>(
  ({ onClose, onSuccess, balance }, ref) => {
    const { t } = useTranslation();
    const { isAbleToTransfer, transfer } = useTokenTransfer();
    const insets = useSafeAreaInsets();
    const bottomInset = useKeyboardBottomInset();

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isManualConfirmDialogOpen, setIsManualConfirmDialogOpen] =
      useState(false);
    const [isManualSubmiting, setIsManualSubmitting] = useState(false);

    const MIN_AMOUNT = 0.1;
    const maxAmount = useMemo(
      () => (balance?.balance ? parseFloat(balance?.balance) : 0),
      [balance]
    );

    // Create Zod schema for form validation - memoized to prevent recreation
    const formSchema = useMemo(() => {
      return z.object({
        withdrawAddress: z.string().trim().min(1, t("validation.required")),
        amount: z
          .string()
          .trim()
          .min(1, t("validation.required"))
          .refine((val) => !isNaN(parseFloat(val)), {
            message: t("validation.invalidAmount"),
          })
          .refine((val) => parseFloat(val) >= MIN_AMOUNT, {
            message: t("validation.minAmount", { min: MIN_AMOUNT }),
          })
          .refine((val) => parseFloat(val) <= maxAmount, {
            message: t("validation.maxAmount", { max: maxAmount }),
          }),
      });
    }, [t, maxAmount]);

    const {
      control,
      handleSubmit: hookFormSubmit,
      formState: { errors, isValid },
      setValue,
      reset,
    } = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        withdrawAddress: "",
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

    const onSubmit = async (data: FormValues) => {
      Keyboard.dismiss();
      setIsSubmitting(true);

      try {
        if (isAbleToTransfer) {
          // const result = await transfer(data.withdrawAddress as Address, data.amount, true);
          const result = await transfer({
            toAddress: data.withdrawAddress as Address,
            amount: data.amount,
            useGasless: true,
          });

          if (!result) {
            throw new Error("Failed to transfer tokens");
          }

          if (result.success) {
            showToast({
              message: t("withdraw.success"),
              type: "success",
            });

            resetForm();
            onSuccess?.();
          } else {
            throw result.error;
          }
        }
      } catch (error) {
        showToast({
          message: `${t("withdraw.error")} - ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          type: "danger",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const resetForm = () => {
      reset();
      setIsSubmitting(false);
      setIsOpen(false);
    };

    const handleClose = () => {
      resetForm();
      onClose?.();
    };

    const setMaxAmount = () => {
      setValue("amount", maxAmount.toString(), { shouldValidate: true });
    };

    const handleCancelManualWithdraw = () => {
      if (isManualSubmiting) return;
      setIsManualConfirmDialogOpen(false);
    };

    const handleConfirmManualWithdraw = async () => {
      try {
        if (!process.env.EXPO_PUBLIC_DEFAULT_MANUAL_WITHDRAW_ADDRESS) {
          throw new Error("Missing DEFAULT_MANUAL_WITHDRAW_ADDRESS");
        }

        Keyboard.dismiss();
        setIsManualSubmitting(true);

        const result = await transfer({
          toAddress: process.env
            .EXPO_PUBLIC_DEFAULT_MANUAL_WITHDRAW_ADDRESS as Address,
          amount: maxAmount.toString(),
          useGasless: true,
        });

        if (!result) {
          throw new Error("Failed to transfer tokens");
        }

        if (result.success) {
          showToast({
            message: t("withdraw.success"),
            type: "success",
          });

          resetForm();
          onSuccess?.();
        } else {
          throw result.error;
        }
      } catch {
        showToast({
          message: `${t("withdraw.error")}`,
          type: "danger",
        });
      } finally {
        setIsManualSubmitting(false);
        setIsManualConfirmDialogOpen(false);
      }
    };

    return (
      <Actionsheet isOpen={isOpen} onClose={handleClose}>
        <ActionsheetBackdrop />
        <ActionsheetContent
          style={{
            paddingBottom: insets.bottom + bottomInset + 8,
            paddingHorizontal: 16,
          }}
        >
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            style={{ width: "100%" }}
          >
            <VStack space="lg" className="w-full">
              <Box className="items-center">
                <Heading size="lg" className="text-typography-950">
                  {t("general.withdraw")}
                </Heading>
              </Box>

              <VStack space="md" className="w-full">
                <Alert
                  action="info"
                  className="flex w-full flex-row items-start gap-4"
                  style={{ paddingVertical: 16 }}
                >
                  <AlertIcon as={InfoIcon} className="mt-1" />
                  <VStack className="flex-1">
                    <Text
                      className="font-semibold text-typography-900"
                      size="xs"
                    >
                      Information
                    </Text>
                    <AlertText
                      className="font-light text-typography-900"
                      size="xs"
                    >
                      Currently, withdrawals are only supported for{" "}
                      <Text
                        className="font-semibold text-typography-900"
                        size="xs"
                      >
                        USDC on Base network.
                      </Text>{" "}
                      Please ensure the receiving wallet address is compatible
                      with{" "}
                      <Text
                        className="font-semibold text-typography-900"
                        size="xs"
                      >
                        Base network
                      </Text>{" "}
                      to avoid loss of funds.
                    </AlertText>
                  </VStack>
                </Alert>
                <Controller
                  control={control}
                  name="withdrawAddress"
                  render={({ field: { onChange, value } }) => (
                    <FormControl
                      isInvalid={!!errors.withdrawAddress}
                      className="w-full"
                    >
                      <FormControlLabel>
                        <FormControlLabelText size="sm">
                          {t("general.walletAddress")}
                        </FormControlLabelText>
                      </FormControlLabel>
                      <Input
                        className="w-full rounded-xl"
                        isInvalid={!!errors.withdrawAddress}
                      >
                        <InputField
                          placeholder={t("withdraw.walletAddressPlaceholder")}
                          value={value}
                          onChangeText={onChange}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => Keyboard.dismiss()}
                        />
                      </Input>
                      {errors.withdrawAddress && (
                        <FormControlError>
                          <FormControlErrorText>
                            {errors.withdrawAddress.message}
                          </FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>
                  )}
                />

                <Controller
                  control={control}
                  name="amount"
                  render={({ field: { onChange, value } }) => (
                    <FormControl isInvalid={!!errors.amount} className="w-full">
                      <FormControlLabel>
                        <FormControlLabelText size="sm">
                          {t("general.amount")}
                        </FormControlLabelText>
                      </FormControlLabel>
                      <VStack space="xs" className="w-full">
                        <Input
                          className="w-full rounded-xl"
                          isInvalid={!!errors.amount}
                        >
                          <InputField
                            placeholder="0.00"
                            value={value}
                            onChangeText={(text) => {
                              // Only allow numbers, dots, and commas
                              const filteredText = text.replace(
                                /[^0-9.,]/g,
                                ""
                              );

                              // Replace commas with dots to standardize the value for conversion
                              const standardFormat = filteredText.replace(
                                /,/g,
                                "."
                              );
                              onChange(standardFormat);
                            }}
                            keyboardType="decimal-pad"
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                          />
                        </Input>
                        <HStack className="w-full items-center justify-between">
                          <Button
                            size="xs"
                            variant="link"
                            className="underline"
                            onPress={setMaxAmount}
                            disabled={maxAmount === 0}
                          >
                            <ButtonText>
                              {t("general.max")}: {maxAmount.toFixed(2)}
                            </ButtonText>
                          </Button>
                        </HStack>
                      </VStack>
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

              <VStack space="md" className="mt-4 w-full">
                <Button
                  size="lg"
                  variant="solid"
                  onPress={hookFormSubmit(onSubmit)}
                  isDisabled={isSubmitting || !isValid}
                  className="w-full rounded-xl"
                >
                  {isSubmitting && <ButtonSpinner />}
                  <ButtonText>
                    {isSubmitting
                      ? t("general.processing")
                      : t("general.submit")}
                  </ButtonText>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onPress={handleClose}
                  isDisabled={isSubmitting}
                  className="w-full rounded-xl"
                >
                  <ButtonText>{t("general.cancel")}</ButtonText>
                </Button>

                <WithdrawManualConfirmation
                  balance={maxAmount.toString()}
                  isOpen={isManualConfirmDialogOpen}
                  onClose={handleCancelManualWithdraw}
                  onConfirm={handleConfirmManualWithdraw}
                  isLoading={isManualSubmiting}
                />
              </VStack>
            </VStack>
          </KeyboardAvoidingView>
        </ActionsheetContent>
      </Actionsheet>
    );
  }
);

WithdrawSheet.displayName = "WithdrawSheet";
