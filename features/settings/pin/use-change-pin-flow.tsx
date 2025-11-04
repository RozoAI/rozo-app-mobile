import { useToast } from '@/hooks/use-toast';
import { usePinOperations } from '@/modules/api/api/merchant/pin';
import { useMerchant } from '@/providers/merchant.provider';
import { useCallback, useState } from 'react';
import { PINValidationInput, ValidationState } from './pin-validation-input';
import { PINValidationModal } from './pin-validation-modal';

interface UseChangePinFlowConfig {
  onSuccess?: () => void;
}

interface UseChangePinFlowReturn {
  // State
  isConfirmationOpen: boolean;
  isCurrentPinInputOpen: boolean;
  isNewPinInputOpen: boolean;
  currentPinValidationState: ValidationState;
  newPinValidationState: ValidationState;
  currentPinError: string | null;
  newPinError: string | null;
  attemptsRemaining: number;
  isBlocked: boolean;

  // Actions
  openConfirmation: () => void;
  closeAll: () => void;

  // Components (as render props)
  renderConfirmationModal: () => React.ReactElement;
  renderCurrentPinInput: () => React.ReactElement;
  renderNewPinInput: () => React.ReactElement;
}

export const useChangePinFlow = (
  config: UseChangePinFlowConfig = {}
): UseChangePinFlowReturn => {
  const { onSuccess } = config;

  const { validatePin, updatePin } = usePinOperations();
  const { refetchMerchant } = useMerchant();
  const { success, error: showError } = useToast();

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isCurrentPinInputOpen, setIsCurrentPinInputOpen] = useState(false);
  const [isNewPinInputOpen, setIsNewPinInputOpen] = useState(false);

  const [currentPinValidationState, setCurrentPinValidationState] = useState<ValidationState>(
    ValidationState.IDLE
  );
  const [newPinValidationState, setNewPinValidationState] = useState<ValidationState>(
    ValidationState.IDLE
  );

  const [currentPinError, setCurrentPinError] = useState<string | null>(null);
  const [newPinError, setNewPinError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [isBlocked, setIsBlocked] = useState(false);

  // Store the current PIN temporarily after validation
  const [validatedCurrentPin, setValidatedCurrentPin] = useState<string | null>(null);

  const openConfirmation = useCallback(() => {
    setIsConfirmationOpen(true);
  }, []);

  const closeAll = useCallback(() => {
    setIsConfirmationOpen(false);
    setIsCurrentPinInputOpen(false);
    setIsNewPinInputOpen(false);
    setCurrentPinValidationState(ValidationState.IDLE);
    setNewPinValidationState(ValidationState.IDLE);
    setCurrentPinError(null);
    setNewPinError(null);
    setAttemptsRemaining(3);
    setIsBlocked(false);
    setValidatedCurrentPin(null);
  }, []);

  const handleConfirm = useCallback(() => {
    setIsConfirmationOpen(false);
    setIsCurrentPinInputOpen(true);
    setCurrentPinValidationState(ValidationState.IDLE);
    setCurrentPinError(null);
  }, []);

  // Validate current PIN
  const handleValidateCurrentPin = useCallback(
    async (pin: string) => {
      try {
        setCurrentPinValidationState(ValidationState.VALIDATING);
        setCurrentPinError(null);

        // Call validate PIN API to check current PIN
        const result = await validatePin({ pin_code: pin });

        if (result.success) {
          setCurrentPinValidationState(ValidationState.SUCCESS);

          // Store the validated current PIN
          setValidatedCurrentPin(pin);

          // Close current PIN input and open new PIN input
          setIsCurrentPinInputOpen(false);
          setTimeout(() => {
            setIsNewPinInputOpen(true);
            setNewPinValidationState(ValidationState.IDLE);
          }, 150);
        } else {
          // Validation failed
          setCurrentPinValidationState(ValidationState.ERROR);
          setCurrentPinError(result.message || result.error || 'Invalid PIN');

          if (result.attempts_remaining !== undefined) {
            setAttemptsRemaining(result.attempts_remaining);
          }

          if (result.is_blocked) {
            setIsBlocked(true);
            setCurrentPinValidationState(ValidationState.BLOCKED);
          }
        }
      } catch (err: any) {
        console.error('Current PIN validation error:', err);

        // Handle axios errors with response data
        const responseData = err.response?.data;
        const statusCode = err.response?.status;

        // Check if error object itself contains validation data
        const validationData = err.attempts_remaining !== undefined ? err : responseData;

        // Handle PIN validation errors (401 or direct error object with attempts_remaining)
        if ((statusCode === 401 && responseData) || err.attempts_remaining !== undefined) {
          const data = validationData || responseData;
          setCurrentPinValidationState(ValidationState.ERROR);
          setCurrentPinError(data.error || data.message || err.message || 'Invalid PIN');

          if (data.attempts_remaining !== undefined) {
            setAttemptsRemaining(data.attempts_remaining);
          }

          if (data.is_blocked) {
            setIsBlocked(true);
            setCurrentPinValidationState(ValidationState.BLOCKED);
          }
        }
        // Check for specific error codes (403 - PIN_BLOCKED)
        else if (responseData?.code === 'PIN_BLOCKED' || statusCode === 403) {
          setIsBlocked(true);
          setCurrentPinValidationState(ValidationState.BLOCKED);
          setCurrentPinError(responseData?.error || err.message || 'Account blocked due to security violations');
        }
        // Generic error handling
        else {
          setCurrentPinValidationState(ValidationState.ERROR);
          setCurrentPinError(err.message || err.error || 'Failed to validate PIN');
          showError(err.message || 'Failed to validate PIN');
        }
      }
    },
    [validatePin, showError]
  );

  // Handle new PIN submission
  const handleSubmitNewPin = useCallback(
    async (newPin: string) => {
      if (!validatedCurrentPin) {
        showError('Current PIN not validated');
        closeAll();
        return;
      }

      try {
        setNewPinValidationState(ValidationState.VALIDATING);
        setNewPinError(null);

        // Call update PIN API with current and new PIN
        await updatePin({
          current_pin: validatedCurrentPin,
          new_pin: newPin,
        });

        setNewPinValidationState(ValidationState.SUCCESS);

        // Refresh merchant profile
        await refetchMerchant({ force: true, showToast: false });

        // Show success message
        success('PIN has been changed successfully');

        // Close all modals
        closeAll();

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } catch (err: any) {
        console.error('Update PIN error:', err);

        setNewPinValidationState(ValidationState.ERROR);

        // Handle specific error messages
        const errorMessage = err.response?.data?.error || err.message || 'Failed to change PIN';
        setNewPinError(errorMessage);
        showError(errorMessage);
      }
    },
    [validatedCurrentPin, updatePin, refetchMerchant, success, showError, closeAll, onSuccess]
  );

  const renderConfirmationModal = useCallback(
    () => (
      <PINValidationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        title="Change PIN"
        message="You will need to enter your current PIN and set a new one."
        onConfirm={handleConfirm}
        variant="warning"
        confirmText="Continue"
      />
    ),
    [isConfirmationOpen, handleConfirm]
  );

  const renderCurrentPinInput = useCallback(
    () => (
      <PINValidationInput
        isOpen={isCurrentPinInputOpen}
        onClose={closeAll}
        title="Enter Current PIN"
        description="Please enter your current 6-digit PIN to continue"
        onValidate={handleValidateCurrentPin}
        validationState={currentPinValidationState}
        errorMessage={currentPinError || undefined}
        attemptsRemaining={attemptsRemaining}
        isBlocked={isBlocked}
      />
    ),
    [
      isCurrentPinInputOpen,
      closeAll,
      handleValidateCurrentPin,
      currentPinValidationState,
      currentPinError,
      attemptsRemaining,
      isBlocked,
    ]
  );

  const renderNewPinInput = useCallback(
    () => (
      <PINValidationInput
        isOpen={isNewPinInputOpen}
        onClose={closeAll}
        title="Enter New PIN"
        description="Please enter your new 6-digit PIN"
        onValidate={handleSubmitNewPin}
        validationState={newPinValidationState}
        errorMessage={newPinError || undefined}
        attemptsRemaining={3} // New PIN doesn't have attempt limits
        isBlocked={false}
      />
    ),
    [
      isNewPinInputOpen,
      closeAll,
      handleSubmitNewPin,
      newPinValidationState,
      newPinError,
    ]
  );

  return {
    // State
    isConfirmationOpen,
    isCurrentPinInputOpen,
    isNewPinInputOpen,
    currentPinValidationState,
    newPinValidationState,
    currentPinError,
    newPinError,
    attemptsRemaining,
    isBlocked,

    // Actions
    openConfirmation,
    closeAll,

    // Render props
    renderConfirmationModal,
    renderCurrentPinInput,
    renderNewPinInput,
  };
};

