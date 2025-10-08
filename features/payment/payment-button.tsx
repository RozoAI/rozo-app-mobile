import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';

import { type DynamicStyles } from './types';

type PaymentButtonProps = {
  isLoading?: boolean;
  isDisabled: boolean;
  dynamicStyles: DynamicStyles;
  onPress: () => void;
};

export function PaymentButton({ isLoading, isDisabled, dynamicStyles, onPress }: PaymentButtonProps) {
  const { t } = useTranslation();

  return (
    <View className="mt-4 px-3 pb-2">
      <Button
        onPress={onPress}
        size={dynamicStyles.size.buttonSize as 'sm' | 'md' | 'lg'}
        isDisabled={isDisabled}
        className="rounded-xl"
      >
        {isLoading ? <ButtonSpinner /> : <ButtonText className="text-white">{t('payment.continueToPayment')}</ButtonText>}
      </Button>
    </View>
  );
}
