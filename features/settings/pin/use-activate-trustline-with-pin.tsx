import { useToast } from "@/hooks/use-toast";
import {
  useWalletEnableUSDC,
  WalletEnableUSDCResponse,
} from "@/modules/api/api/merchant/wallets";
import { useWallet } from "@/providers";
import { useCallback, useState } from "react";
import { PINValidationInput, ValidationState } from "./pin-validation-input";

interface UseActivateTrustlineWithPinConfig {
  onSuccess?: () => void;
}

interface UseActivateTrustlineWithPinReturn {
  isPinInputOpen: boolean;
  validationState: ValidationState;
  errorMessage: string | null;
  attemptsRemaining: number;
  isBlocked: boolean;
  isProcessing: boolean;

  // Actions
  initiateActivate: () => void;
  resetState: () => void;

  // Render props
  renderPinValidationInput: () => React.ReactElement;
}

export const useActivateTrustlineWithPin = (
  config: UseActivateTrustlineWithPinConfig = {}
): UseActivateTrustlineWithPinReturn => {
  const { onSuccess } = config;
  const { success, error: showError } = useToast();
  const { primaryWallet } = useWallet();
  const { mutateAsync: enableUsdc } = useWalletEnableUSDC();

  const [isPinInputOpen, setIsPinInputOpen] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>(
    ValidationState.IDLE
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetState = useCallback(() => {
    setIsPinInputOpen(false);
    setValidationState(ValidationState.IDLE);
    setErrorMessage(null);
    setAttemptsRemaining(3);
    setIsBlocked(false);
    setIsProcessing(false);
  }, []);

  // Handle the actual activation with PIN code
  const executeEnableUsdc = useCallback(
    async (pinCode: string) => {
      try {
        setIsProcessing(true);

        if (!primaryWallet?.id) {
          throw new Error("No wallet found");
        }

        const response: WalletEnableUSDCResponse = await enableUsdc({
          walletId: primaryWallet.id,
          pinCode,
        });

        if (response?.success) {
          success("Trustline activated successfully");
          resetState();
          onSuccess?.();
        } else {
          throw response.error ?? new Error("Failed to activate trustline");
        }
      } catch (error: any) {
        const responseData = error.response?.data;
        const statusCode = error.response?.status;

        // Handle PIN validation errors
        if (statusCode === 401 && responseData) {
          setValidationState(ValidationState.ERROR);
          setErrorMessage(responseData.error || "Invalid PIN");
          if (responseData.attempts_remaining !== undefined) {
            setAttemptsRemaining(responseData.attempts_remaining);
          }
          if (responseData.is_blocked) {
            setIsBlocked(true);
            setValidationState(ValidationState.BLOCKED);
          }
        }
        // Handle PIN blocked
        else if (statusCode === 403 && responseData?.code === "PIN_BLOCKED") {
          setIsBlocked(true);
          setValidationState(ValidationState.BLOCKED);
          setErrorMessage(responseData.error || "Account blocked");
        }
        // Generic error
        else {
          const errorMsg =
            error instanceof Error ? error.message : "Activation failed";
          showError(errorMsg);
          resetState();
        }

        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [primaryWallet?.id, enableUsdc, success, showError, resetState, onSuccess]
  );

  // Handle PIN input and activate trustline
  const handlePinValidation = useCallback(
    async (pin: string) => {
      try {
        setValidationState(ValidationState.VALIDATING);
        setErrorMessage(null);

        // Directly call enableUsdc with pin, so also handles PIN error states
        await executeEnableUsdc(pin);
      } catch (err: any) {
        // Additional error handling is inside executeEnableUsdc
      }
    },
    [executeEnableUsdc]
  );

  // Public method to start trustline activation with PIN modal
  const initiateActivate = useCallback(() => {
    setIsPinInputOpen(true);
    setValidationState(ValidationState.IDLE);
    setErrorMessage(null);
    setAttemptsRemaining(3);
    setIsBlocked(false);
  }, []);

  const renderPinValidationInput = useCallback(
    () => (
      <PINValidationInput
        isOpen={isPinInputOpen}
        onClose={resetState}
        title="Activate USDC Trustline"
        description="Please enter your 6-digit PIN to activate your USDC trustline."
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
      handlePinValidation,
      validationState,
      errorMessage,
      attemptsRemaining,
      isBlocked,
    ]
  );

  return {
    isPinInputOpen,
    validationState,
    errorMessage,
    attemptsRemaining,
    isBlocked,
    isProcessing,
    initiateActivate,
    resetState,
    renderPinValidationInput,
  };
};
