import BaseIcon from '@/components/svg/base-icon';
import PolygonIcon from '@/components/svg/polygon-icon';
import RozoIcon from '@/components/svg/rozo-icon';
import SolanaIcon from '@/components/svg/solana-icon';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import React from 'react';
import { type PaymentMethod } from './payment-method-config';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  isSelected: boolean;
  isLoading: boolean;
  onPress: () => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  isSelected,
  isLoading,
  onPress,
}) => {
  const renderIcon = () => {
    const iconProps = {
      width: 24,
      height: 24,
      className: isSelected ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400',
    };

    switch (method.id) {
      case 'rozo':
        return <RozoIcon {...iconProps} />;
      case 'base':
        return <BaseIcon {...iconProps} />;
      case 'solana':
        return <SolanaIcon {...iconProps} />;
      case 'polygon':
        return <PolygonIcon {...iconProps} />;
      default:
        return <RozoIcon {...iconProps} />;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={`Select ${method.name} payment method`}
      accessibilityHint={`Tap to pay with ${method.name}`}
      accessibilityState={{
        selected: isSelected,
        disabled: isLoading,
      }}
      className={`
        p-4 rounded-xl border-2 min-h-[100px] items-center justify-center
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }
        ${isLoading ? 'opacity-50' : ''}
      `}
    >
      <VStack space="sm" className="items-center">
        {isLoading ? (
          <Spinner size="small" />
        ) : (
          renderIcon()
        )}
        
        <Text 
          className={`
            text-sm font-medium text-center
            ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
          `}
        >
          {method.name}
        </Text>
        
        {isSelected && (
          <Text className="text-xs text-blue-500 dark:text-blue-400">
            Selected
          </Text>
        )}
      </VStack>
    </Pressable>
  );
};

export default PaymentMethodCard;
