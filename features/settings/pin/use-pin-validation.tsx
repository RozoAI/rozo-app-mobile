import { useToast } from '@/hooks/use-toast';
import { usePinOperations } from '@/modules/api/api/merchant/pin';
import { useCallback, useState } from 'react';
import {
  PINValidationInput,
  ValidationState,
} from './pin-validation-input';
import {
  PINValidationModal,
  type ValidationVariant,
} from './pin-validation-modal';

interface UsePinValidationConfig {
  title: string;
  confirmationMessage: string;
  validationTitle: string;
  validationDescription?: string;
  onSuccess: (pin: string) => Promise<void>;
  variant?: ValidationVariant;
  confirmText?: string;
  cancelText?: string;
  successMessage?: string;
}

interface UsePinValidationReturn {
  // State
  isConfirmationOpen: boolean;
  isPinInputOpen: boolean;
  validationState: ValidationState;
  errorMessage: string | null;
  attemptsRemaining: number;
  isBlocked: boolean;

  // Actions
  openConfirmation: () => void;
  closeAll: () => void;

  // Components (as render props)
  renderConfirmationModal: () => React.ReactElement;
  renderValidationInput: () => React.ReactElement;
}

export const usePinValidation = (
  config: UsePinValidationConfig
): UsePinValidationReturn => {
  const {
    title,
    confirmationMessage,
    validationTitle,
    validationDescription,
    onSuccess,
    variant = 'warning',
    confirmText,
    cancelText,
    successMessage,
  } = config;

  const { validatePin } = usePinOperations();
  const { success, error: showError } = useToast();

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isPinInputOpen, setIsPinInputOpen] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>(
    ValidationState.IDLE
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [isBlocked, setIsBlocked] = useState(false);

  const openConfirmation = useCallback(() => {
    setIsConfirmationOpen(true);
  }, []);

  const closeAll = useCallback(() => {
    setIsConfirmationOpen(false);
    setIsPinInputOpen(false);
    setValidationState(ValidationState.IDLE);
    setErrorMessage(null);
    setAttemptsRemaining(3);
    setIsBlocked(false);
  }, []);

  const handleConfirm = useCallback(() => {
    setIsConfirmationOpen(false);
    setIsPinInputOpen(true);
    setValidationState(ValidationState.IDLE);
    setErrorMessage(null);
  }, []);

  const handleValidate = useCallback(
    async (pin: string) => {
      try {
        setValidationState(ValidationState.VALIDATING);
        setErrorMessage(null);

        // Call validate PIN API
        const result = await validatePin({ pin_code: pin });

        if (result.success) {
          setValidationState(ValidationState.SUCCESS);

          // Close PIN modal immediately for better UX
          setIsPinInputOpen(false);
          
          // Small delay to let the modal close animation complete
          await new Promise(resolve => setTimeout(resolve, 200));

          // Execute the protected action (will show loading on parent component)
          await onSuccess(pin);

          // Show success message
          if (successMessage) {
            success(successMessage);
          }

          // Close confirmation modal if open
          setIsConfirmationOpen(false);
          
          // Reset all state
          setValidationState(ValidationState.IDLE);
          setErrorMessage(null);
          setAttemptsRemaining(3);
          setIsBlocked(false);
        } else {
          // Validation failed
          setValidationState(ValidationState.ERROR);
          setErrorMessage(result.message || result.error || 'Invalid PIN');

          if (result.attempts_remaining !== undefined) {
            setAttemptsRemaining(result.attempts_remaining);
          }

          if (result.is_blocked) {
            setIsBlocked(true);
            setValidationState(ValidationState.BLOCKED);
            // Note: Merchant status error will be handled by the API interceptor
          }
        }
      } catch (err: any) {
        console.error('PIN validation error:', err);
        
        // Handle axios errors with response data
        const responseData = err.response?.data;
        const statusCode = err.response?.status;
        
        // Check if error object itself contains validation data (from preserved axios error)
        const validationData = err.attempts_remaining !== undefined ? err : responseData;
        
        // Handle PIN validation errors (401 or direct error object with attempts_remaining)
        if ((statusCode === 401 && responseData) || err.attempts_remaining !== undefined) {
          const data = validationData || responseData;
          console.log('[PIN Validation] Validation Error Response:', data);
          setValidationState(ValidationState.ERROR);
          setErrorMessage(data.error || data.message || err.message || 'Invalid PIN');
          
          if (data.attempts_remaining !== undefined) {
            console.log('[PIN Validation] Setting attempts remaining to:', data.attempts_remaining);
            setAttemptsRemaining(data.attempts_remaining);
          }
          
          if (data.is_blocked) {
            setIsBlocked(true);
            setValidationState(ValidationState.BLOCKED);
          }
        } 
        // Check for specific error codes (403 - PIN_BLOCKED, INACTIVE)
        else if (responseData?.code === 'PIN_BLOCKED' || statusCode === 403) {
          setIsBlocked(true);
          setValidationState(ValidationState.BLOCKED);
          setErrorMessage(responseData?.error || err.message || 'Account blocked due to security violations');
        } 
        // Handle AppError (wrapped errors)
        else if (err.statusCode && err.data) {
          setValidationState(ValidationState.ERROR);
          setErrorMessage(err.message || 'Failed to validate PIN');
          showError(err.message || 'Failed to validate PIN');
        }
        // Generic error handling
        else {
          setValidationState(ValidationState.ERROR);
          setErrorMessage(err.message || err.error || 'Failed to validate PIN');
          showError(err.message || 'Failed to validate PIN');
        }
      }
    },
    [validatePin, onSuccess, successMessage, success, showError, closeAll]
  );

  const renderConfirmationModal = useCallback(
    () => (
      <PINValidationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        title={title}
        message={confirmationMessage}
        onConfirm={handleConfirm}
        variant={variant}
        confirmText={confirmText}
        cancelText={cancelText}
      />
    ),
    [
      isConfirmationOpen,
      title,
      confirmationMessage,
      handleConfirm,
      variant,
      confirmText,
      cancelText,
    ]
  );

  const renderValidationInput = useCallback(
    () => (
      <PINValidationInput
        isOpen={isPinInputOpen}
        onClose={closeAll}
        title={validationTitle}
        description={validationDescription}
        onValidate={handleValidate}
        validationState={validationState}
        errorMessage={errorMessage || undefined}
        attemptsRemaining={attemptsRemaining}
        isBlocked={isBlocked}
      />
    ),
    [
      isPinInputOpen,
      closeAll,
      validationTitle,
      validationDescription,
      handleValidate,
      validationState,
      errorMessage,
      attemptsRemaining,
      isBlocked,
    ]
  );

  return {
    // State
    isConfirmationOpen,
    isPinInputOpen,
    validationState,
    errorMessage,
    attemptsRemaining,
    isBlocked,

    // Actions
    openConfirmation,
    closeAll,

    // Render props
    renderConfirmationModal,
    renderValidationInput,
  };
};

