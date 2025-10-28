import { useToast } from '@/hooks/use-toast';
import { useTokenTransfer } from '@/hooks/use-token-transfer';
import type { TokenBalanceResult } from '@/libs/tokens';
import { usePinOperations } from '@/modules/api/api/merchant/pin';
import { useMerchant } from '@/providers/merchant.provider';
import { useCallback, useState } from 'react';
import type { Address } from 'viem';
import { PINValidationInput, ValidationState } from './pin-validation-input';

interface UseWithdrawWithPinConfig {
  onSuccess?: () => void;
  balance?: TokenBalanceResult;
}

interface WithdrawData {
  withdrawAddress: Address;
  amount: string;
}

interface UseWithdrawWithPinReturn {
  // State
  isPinInputOpen: boolean;
  validationState: ValidationState;
  errorMessage: string | null;
  attemptsRemaining: number;
  isBlocked: boolean;
  isProcessing: boolean;

  // Actions
  initiateWithdraw: (data: WithdrawData) => Promise<void>;
  resetState: () => void;

  // Render props
  renderPinValidationInput: () => React.ReactElement;
}

export const useWithdrawWithPinValidation = (
  config: UseWithdrawWithPinConfig = {}
): UseWithdrawWithPinReturn => {
  const { onSuccess } = config;
  
  const { merchant } = useMerchant();
  const { validatePin } = usePinOperations();
  const { transfer, isAbleToTransfer } = useTokenTransfer();
  const { success, error: showError } = useToast();

  const [isPinInputOpen, setIsPinInputOpen] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>(
    ValidationState.IDLE
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Store withdraw data temporarily
  const [withdrawData, setWithdrawData] = useState<WithdrawData | null>(null);

  const resetState = useCallback(() => {
    setIsPinInputOpen(false);
    setValidationState(ValidationState.IDLE);
    setErrorMessage(null);
    setAttemptsRemaining(3);
    setIsBlocked(false);
    setIsProcessing(false);
    setWithdrawData(null);
  }, []);

  // Execute the actual transfer with PIN
  const executeTransfer = useCallback(
    async (data: WithdrawData, pinCode: string | null) => {
      try {
        console.log('[useWithdrawWithPin] Executing transfer with PIN:', !!pinCode);
        setIsProcessing(true);

        if (!isAbleToTransfer) {
          throw new Error('Unable to transfer tokens');
        }

        // Call transfer with PIN if provided
        const result = await transfer({
          toAddress: data.withdrawAddress,
          amount: data.amount,
          useGasless: true,
          pinCode: pinCode || undefined,
        });

        if (!result) {
          throw new Error('Failed to transfer tokens');
        }

        if (result.success) {
          console.log('[useWithdrawWithPin] Transfer successful');
          success('Withdrawal successful');
          resetState();
          onSuccess?.();
        } else {
          throw result.error;
        }
      } catch (error: any) {
        console.error('[useWithdrawWithPin] Transfer error:', error);
        
        // Check for PIN-specific errors from wallet API
        const responseData = error.response?.data;
        const statusCode = error.response?.status;
        
        // Handle PIN validation errors from wallet transfer (401)
        if (statusCode === 401 && responseData) {
          setValidationState(ValidationState.ERROR);
          setErrorMessage(responseData.error || 'Invalid PIN');
          
          if (responseData.attempts_remaining !== undefined) {
            setAttemptsRemaining(responseData.attempts_remaining);
          }
          
          if (responseData.is_blocked) {
            setIsBlocked(true);
            setValidationState(ValidationState.BLOCKED);
          }
          
          // Don't close the PIN modal, allow retry
        } 
        // Handle PIN blocked errors (403)
        else if (statusCode === 403 && responseData?.code === 'PIN_BLOCKED') {
          setIsBlocked(true);
          setValidationState(ValidationState.BLOCKED);
          setErrorMessage(responseData.error || 'Account blocked');
        }
        // Generic transfer errors
        else {
          const errorMsg = error instanceof Error ? error.message : 'Withdrawal failed';
          showError(errorMsg);
          resetState();
        }
        
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [isAbleToTransfer, transfer, success, showError, resetState, onSuccess]
  );

  // Validate PIN before transfer
  const handlePinValidation = useCallback(
    async (pin: string) => {
      try {
        console.log('[useWithdrawWithPin] Validating PIN');
        setValidationState(ValidationState.VALIDATING);
        setErrorMessage(null);

        // Call validate PIN API
        const result = await validatePin({ pin_code: pin });

        if (result.success) {
          console.log('[useWithdrawWithPin] PIN validated successfully');
          setValidationState(ValidationState.SUCCESS);

          // Close PIN modal immediately for better UX
          setIsPinInputOpen(false);
          
          // Small delay to let the modal close animation complete
          await new Promise(resolve => setTimeout(resolve, 200));

          // Execute transfer with validated PIN (will show loading on withdraw sheet)
          if (withdrawData) {
            await executeTransfer(withdrawData, pin);
          }
        } else {
          // Validation failed
          console.log('[useWithdrawWithPin] PIN validation failed:', result);
          setValidationState(ValidationState.ERROR);
          setErrorMessage(result.message || result.error || 'Invalid PIN');

          if (result.attempts_remaining !== undefined) {
            setAttemptsRemaining(result.attempts_remaining);
          }

          if (result.is_blocked) {
            setIsBlocked(true);
            setValidationState(ValidationState.BLOCKED);
          }
        }
      } catch (err: any) {
        console.error('[useWithdrawWithPin] PIN validation error:', err);

        // Handle axios errors with response data
        const responseData = err.response?.data;
        const statusCode = err.response?.status;

        // Check if error object itself contains validation data
        const validationData = err.attempts_remaining !== undefined ? err : responseData;

        // Handle PIN validation errors (401 or direct error object with attempts_remaining)
        if ((statusCode === 401 && responseData) || err.attempts_remaining !== undefined) {
          const data = validationData || responseData;
          setValidationState(ValidationState.ERROR);
          setErrorMessage(data.error || data.message || err.message || 'Invalid PIN');

          if (data.attempts_remaining !== undefined) {
            setAttemptsRemaining(data.attempts_remaining);
          }

          if (data.is_blocked) {
            setIsBlocked(true);
            setValidationState(ValidationState.BLOCKED);
          }
        }
        // Check for specific error codes (403 - PIN_BLOCKED)
        else if (responseData?.code === 'PIN_BLOCKED' || statusCode === 403) {
          setIsBlocked(true);
          setValidationState(ValidationState.BLOCKED);
          setErrorMessage(
            responseData?.error || err.message || 'Account blocked due to security violations'
          );
        }
        // Generic error handling
        else {
          setValidationState(ValidationState.ERROR);
          setErrorMessage(err.message || err.error || 'Failed to validate PIN');
          showError(err.message || 'Failed to validate PIN');
        }
      }
    },
    [validatePin, withdrawData, executeTransfer, showError]
  );

  // Initiate withdrawal process
  const initiateWithdraw = useCallback(
    async (data: WithdrawData) => {
      console.log('[useWithdrawWithPin] Initiating withdraw, has_pin:', merchant?.has_pin);
      setWithdrawData(data);

      // Check if PIN is required
      if (merchant?.has_pin) {
        // Open PIN validation modal
        console.log('[useWithdrawWithPin] Opening PIN validation modal');
        setIsPinInputOpen(true);
        setValidationState(ValidationState.IDLE);
        setErrorMessage(null);
      } else {
        // Direct transfer without PIN
        console.log('[useWithdrawWithPin] No PIN required, executing direct transfer');
        await executeTransfer(data, null);
      }
    },
    [merchant?.has_pin, executeTransfer]
  );

  const renderPinValidationInput = useCallback(
    () => (
      <PINValidationInput
        isOpen={isPinInputOpen}
        onClose={resetState}
        title="Confirm Withdrawal"
        description={`Please enter your 6-digit PIN to authorize withdrawal of ${withdrawData?.amount || '0'} USDC to ${withdrawData?.withdrawAddress ? `${withdrawData.withdrawAddress.slice(0, 6)}...${withdrawData.withdrawAddress.slice(-4)}` : 'recipient'}`}
        onValidate={handlePinValidation}
        validationState={validationState}
        errorMessage={errorMessage || undefined}
        attemptsRemaining={attemptsRemaining}
        isBlocked={isBlocked}
      />
    ),
    [
      isPinInputOpen,
      resetState,
      withdrawData,
      handlePinValidation,
      validationState,
      errorMessage,
      attemptsRemaining,
      isBlocked,
    ]
  );

  return {
    // State
    isPinInputOpen,
    validationState,
    errorMessage,
    attemptsRemaining,
    isBlocked,
    isProcessing,

    // Actions
    initiateWithdraw,
    resetState,

    // Render props
    renderPinValidationInput,
  };
};

