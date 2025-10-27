import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { type OrderResponse } from '@/modules/api/schema/order';
import React, { useState } from 'react';
import PaymentMethodCard from './payment-method-card';
import { PAYMENT_METHODS, type PaymentMethodId } from './payment-method-config';

interface PaymentMethodSelectorProps {
  existingPayment?: OrderResponse; // For Rozo payment
  onPaymentMethodSelected: (methodId: PaymentMethodId, preferredToken?: string) => void;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  existingPayment,
  onPaymentMethodSelected,
  className = '',
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>('rozo');
  const [loadingMethod, setLoadingMethod] = useState<PaymentMethodId | null>(null);

  const handleMethodSelect = async (methodId: PaymentMethodId) => {
    if (loadingMethod) return; // Prevent multiple calls
    
    setLoadingMethod(methodId);
    setSelectedMethod(methodId);
    
    try {
      // Simple if condition by id for Rozo payment
      if (methodId === 'rozo') {
        if (existingPayment) {
          // Use existing payment data for Rozo - call callback immediately
          onPaymentMethodSelected(methodId);
        } else {
          throw new Error('No existing payment found for Rozo');
        }
      } else {
        // For other payment methods, pass the method info to parent
        const method = PAYMENT_METHODS.find(m => m.id === methodId);
        onPaymentMethodSelected(methodId, method?.preferredToken);
      }
    } catch (error: any) {
      console.error('Payment method selection error:', error);
      setSelectedMethod('rozo'); // Reset to default on error
    } finally {
      setLoadingMethod(null);
    }
  };

  return (
    <View className={`w-full ${className}`}>
      <Text className="text-lg font-semibold mb-4 text-center text-gray-900 dark:text-gray-100">
        Select Payment Method
      </Text>
      
      <View className="grid grid-cols-2 gap-3">
        {PAYMENT_METHODS.map((method) => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            isSelected={selectedMethod === method.id}
            isLoading={loadingMethod === method.id}
            onPress={() => handleMethodSelect(method.id)}
          />
        ))}
      </View>
    </View>
  );
};

export default PaymentMethodSelector;
