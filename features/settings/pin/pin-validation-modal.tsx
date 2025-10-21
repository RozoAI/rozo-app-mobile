import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { AlertTriangle, Shield } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type ValidationVariant = 'danger' | 'warning' | 'info';

interface PINValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: ValidationVariant;
}

export const PINValidationModal: React.FC<PINValidationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  variant = 'warning',
}) => {
  const { t } = useTranslation();

  const getIconColor = () => {
    switch (variant) {
      case 'danger':
        return '#EF4444'; // red-500
      case 'warning':
        return '#F59E0B'; // amber-500
      case 'info':
        return '#3B82F6'; // blue-500
      default:
        return '#F59E0B';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return AlertTriangle;
      case 'warning':
        return AlertTriangle;
      case 'info':
        return Shield;
      default:
        return AlertTriangle;
    }
  };

  const handleConfirm = () => {
    onClose();
    // Small delay to allow modal to close before opening PIN input
    setTimeout(() => {
      onConfirm();
    }, 150);
  };

  return (
    <AlertDialog isOpen={isOpen} onClose={onClose} size="md">
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader className="flex-col items-center">
          <Icon
            as={getIcon()}
            size="xl"
            className="mb-3"
            style={{ color: getIconColor() }}
          />
          <Heading size="lg" className="text-center">
            {title}
          </Heading>
        </AlertDialogHeader>
        <AlertDialogBody>
          <Text className="text-center text-typography-700">
            {message}
          </Text>
        </AlertDialogBody>
        <AlertDialogFooter className="flex-col gap-2 mt-4">
          <Button
            size="lg"
            onPress={handleConfirm}
            className="w-full rounded-xl"
            action={variant === 'danger' ? 'negative' : 'primary'}
          >
            <ButtonText>
              {confirmText || t('general.confirmAndProceed')}
            </ButtonText>
          </Button>
          <Button
            size="lg"
            onPress={onClose}
            className="w-full rounded-xl"
            variant="outline"
          >
            <ButtonText>{cancelText || t('general.cancel')}</ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

