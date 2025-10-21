import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper
} from '@/components/ui/actionsheet';
import { Alert, AlertIcon, AlertText } from '@/components/ui/alert';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from "@/components/ui/view";
import { VStack } from '@/components/ui/vstack';
import useKeyboardBottomInset from '@/hooks/use-keyboard-bottom-inset';
import { useToast } from '@/hooks/use-toast';
import { usePinOperations } from '@/modules/api/api/merchant/pin';
import { useMerchant } from '@/providers/merchant.provider';
import { Shield } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChangePinFlow } from './use-change-pin-flow';
import { usePinValidation } from './use-pin-validation';

interface PINActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  hasPin: boolean;
}

export const PINActionSheet: React.FC<PINActionSheetProps> = ({
  isOpen,
  onClose,
  hasPin,
}) => {
  const { t } = useTranslation();
  const { setPin, isSettingPin, revokePin, isRevokingPin } = usePinOperations();
  const { success, error: showError } = useToast();
  const { refetchMerchant } = useMerchant();
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const insets = useSafeAreaInsets();
  const otpInputRef = useRef<any>(null);
  const bottomInset = useKeyboardBottomInset();

  // PIN validation for revoke flow
  const revokePinValidation = usePinValidation({
    title: t('pin.revoke.title'),
    confirmationMessage: t('pin.revoke.confirmationMessage'),
    validationTitle: t('pin.revoke.enterPin'),
    variant: 'danger',
    successMessage: t('pin.revoke.success'),
    onSuccess: async (pin: string) => {
      // Execute revoke PIN API with validated PIN
      await revokePin({ pin_code: pin });
      // Refresh merchant profile to update has_pin status
      await refetchMerchant();
    },
  });

  // Change PIN flow
  const changePinFlow = useChangePinFlow({
    onSuccess: () => {
      // Optional: any additional actions after successful PIN change
    },
  });

  // Auto-focus OTP input when sheet opens for PIN setup
  useEffect(() => {
    if (isOpen && !hasPin && otpInputRef.current) {
      // Small delay to ensure ActionSheet is fully rendered
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, hasPin]);

  const handleSetPin = async () => {
    if (newPin.length !== 6) {
      setPinError(t('pin.setup.invalidLength'));
      return;
    }

    try {
      setPinError('');
      await setPin({ pin_code: newPin });
      // Refresh merchant profile to update has_pin status
      await refetchMerchant();
      success(t('pin.setup.success'));
      handleClose();
    } catch (err: any) {
      console.error('PIN setup error:', err);
      showError(t('pin.setup.error'));
    }
  };

  const handleClose = () => {
    setNewPin('');
    setPinError('');
    Keyboard.dismiss(); // Dismiss keyboard when closing
    onClose();
  };

  const handlePinChange = (value: string) => {
    setNewPin(value);
  };

  const handleChangePin = () => {
    // Close the management sheet first
    handleClose();
    // Open the change PIN flow
    setTimeout(() => {
      changePinFlow.openConfirmation();
    }, 150);
  };

  const handleRevokePin = () => {
    // Close the management sheet first
    handleClose();
    // Open the revoke PIN validation flow
    setTimeout(() => {
      revokePinValidation.openConfirmation();
    }, 150);
  };

  return (
    <>
      <Actionsheet
        isOpen={isOpen}
        onClose={handleClose}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent
              style={{ paddingBottom: insets.bottom + bottomInset + 8 }}
            >
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack space="lg" className="w-full">
            <View className="items-center">
              <Heading size="lg" className="text-typography-950">
                {hasPin ? t('pin.management.title') : t('pin.setup.title')}
              </Heading>
            </View>
          
          {hasPin ? (
            // PIN Management Content
            <>
              <View className="relative w-full items-center space-y-4">
                <Alert action="info" variant="solid">
                  <AlertIcon as={Shield} />
                  <AlertText>
                    {t('pin.management.status')}
                  </AlertText>
                </Alert>
              </View>
              <View className="relative mt-4 flex-col gap-2">
                <Button
                  size="lg"
                  onPress={handleChangePin}
                  isDisabled={isRevokingPin}
                  className="w-full rounded-xl"
                >
                  <ButtonText>{t("pin.management.change")}</ButtonText>
                </Button>
                <Button
                  size="lg"
                  onPress={handleRevokePin}
                  isDisabled={isRevokingPin}
                  className="w-full rounded-xl"
                  variant="link"
                  action="negative"
                >
                  <ButtonText>{t("pin.management.revoke")}</ButtonText>
                </Button>
                
                {/* Loading overlay when revoking PIN */}
                {isRevokingPin && (
                  <View className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/50 rounded-xl">
                    <VStack space="sm" className="items-center">
                      <Spinner size="large" />
                      <Text className="text-sm text-gray-600 dark:text-gray-400">
                        {t('pin.revoke.processing')}
                      </Text>
                    </VStack>
                  </View>
                )}
              </View>
            </>
          ) : (
            // PIN Setup Content
            <>
                <View className="w-full items-center space-y-4">
                  <Text className="text-sm text-gray-600 text-center">
                    {t('pin.setup.description')}
                  </Text>
                  
                  <OtpInput
                    ref={otpInputRef}
                    numberOfDigits={6}
                    onTextChange={handlePinChange}
                    onFilled={(text: string) => setNewPin(text)}
                    focusColor="#3B82F6"
                    focusStickBlinkingDuration={500}
                    textInputProps={{
                      accessibilityLabel: "One-Time Password",
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
                        borderColor: '#D1D5DB',
                        backgroundColor: '#FFFFFF',
                      },
                      pinCodeTextStyle: {
                        fontSize: 18,
                        fontWeight: '600',
                        color: '#1F2937',
                      },
                      focusStickStyle: {
                        width: 2,
                        height: 30,
                        backgroundColor: '#3B82F6',
                      },
                      focusedPinCodeContainerStyle: {
                        borderColor: '#3B82F6',
                        backgroundColor: '#F3F4F6',
                      },
                    }}
                  />
                  
                  {pinError && (
                    <Text className="text-sm text-red-500 text-center">
                      {pinError}
                    </Text>
                  )}
                </View>
                <View className="mt-4 flex-col gap-2">
                <Button
                  size="lg"
                  onPress={handleSetPin}
                  isDisabled={newPin.length !== 6 || isSettingPin}
                  className="w-full rounded-xl"
                >
                  <ButtonText>{t("general.confirm")}</ButtonText>
                </Button>
                <Button
                  size="lg"
                  onPress={handleClose}
                  className="w-full rounded-xl"
                  variant="link"
                >
                  <ButtonText>{t("general.cancel")}</ButtonText>
                </Button>
                
              </View>
            </>
          )}
        </VStack>
      </ActionsheetContent>
    </Actionsheet>

    {/* Revoke PIN Validation Flow */}
    {revokePinValidation.renderConfirmationModal()}
    {revokePinValidation.renderValidationInput()}

    {/* Change PIN Flow */}
    {changePinFlow.renderConfirmationModal()}
    {changePinFlow.renderCurrentPinInput()}
    {changePinFlow.renderNewPinInput()}
  </>
  );
};
