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
import { useApp } from "@/providers/app.provider";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";
import { OtpInput } from "react-native-otp-entry";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export enum ValidationState {
  IDLE = "IDLE",
  VALIDATING = "VALIDATING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
  BLOCKED = "BLOCKED",
}

interface PINValidationInputProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onValidate: (pin: string) => Promise<void>;
  validationState: ValidationState;
  errorMessage?: string;
  attemptsRemaining?: number;
  isBlocked?: boolean;
}

export const PINValidationInput: React.FC<PINValidationInputProps> = ({
  isOpen,
  onClose,
  title,
  description,
  onValidate,
  validationState,
  errorMessage,
  attemptsRemaining,
  isBlocked = false,
}) => {
  const { t } = useTranslation();
  const { error: showError } = useToast();
  const { logout } = useApp();
  const insets = useSafeAreaInsets();
  const otpInputRef = useRef<any>(null);

  // Debug: Log attempts remaining
  useEffect(() => {
    if (validationState === ValidationState.ERROR) {
      console.log("[PIN Input] Attempts remaining prop:", attemptsRemaining);
    }
  }, [attemptsRemaining, validationState]);

  // Auto-focus OTP input when sheet opens
  useEffect(() => {
    if (isOpen && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Clear PIN on error
  useEffect(() => {
    if (validationState === ValidationState.ERROR && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.clear();
      }, 500);
    }
  }, [validationState]);

  // Handle blocked state - show error toast and trigger logout
  useEffect(() => {
    if (isBlocked && validationState === ValidationState.BLOCKED) {
      showError(t("pin.validation.blocked"), { duration: 5000 });

      // Close the modal and trigger logout after a short delay
      onClose();
      setTimeout(() => {
        logout();
      }, 1000);
    }
  }, [isBlocked, validationState, showError, onClose, logout, t]);

  const handlePinFilled = async (text: string) => {
    await onValidate(text);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const isValidating = validationState === ValidationState.VALIDATING;

  return (
    <Actionsheet isOpen={isOpen} onClose={handleClose}>
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

          <View className="w-full items-center space-y-4">
            {description && (
              <Text className="text-sm text-gray-600 text-center">
                {description}
              </Text>
            )}

            {isBlocked ? (
              <View className="w-full items-center space-y-4 py-8">
                <Text className="text-sm text-red-600 text-center font-semibold">
                  {t("pin.validation.blocked")}
                </Text>
                <Text className="text-xs text-gray-500 text-center">
                  {t("pin.validation.blockedDescription")}
                </Text>
              </View>
            ) : (
              <>
                <OtpInput
                  ref={otpInputRef}
                  numberOfDigits={6}
                  onFilled={handlePinFilled}
                  focusColor="#3B82F6"
                  focusStickBlinkingDuration={500}
                  disabled={isValidating || isBlocked}
                  textInputProps={{
                    accessibilityLabel: "PIN Verification",
                  }}
                  theme={{
                    containerStyle: {
                      marginVertical: 20,
                    },
                    pinCodeContainerStyle: {
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor:
                        validationState === ValidationState.ERROR
                          ? "#EF4444"
                          : "#D1D5DB",
                      backgroundColor: isValidating ? "#F3F4F6" : "#FFFFFF",
                    },
                    pinCodeTextStyle: {
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#1F2937",
                    },
                    focusStickStyle: {
                      width: 2,
                      height: 30,
                      backgroundColor: "#3B82F6",
                    },
                    focusedPinCodeContainerStyle: {
                      borderColor: "#3B82F6",
                      backgroundColor: "#F3F4F6",
                    },
                  }}
                />

                {validationState === ValidationState.ERROR && errorMessage && (
                  <View className="w-full items-center space-y-1">
                    <Text className="text-sm text-red-500 text-center font-medium">
                      {errorMessage}
                    </Text>
                    {attemptsRemaining !== undefined &&
                      attemptsRemaining > 0 && (
                        <Text className="text-xs text-gray-500 text-center">
                          {t("pin.validation.attemptsRemaining", {
                            count: attemptsRemaining,
                          })}
                        </Text>
                      )}
                  </View>
                )}

                {isValidating && (
                  <Text className="text-sm text-gray-600 text-center">
                    {t("pin.validation.validating")}
                  </Text>
                )}
              </>
            )}
          </View>

          <View className="mt-4">
            <Button
              size="lg"
              onPress={handleClose}
              className="w-full rounded-xl"
              variant="outline"
            >
              <ButtonText>{t("general.cancel")}</ButtonText>
            </Button>
          </View>
        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
};
