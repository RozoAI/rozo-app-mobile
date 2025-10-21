import type { AxiosError } from "axios";
import { createMutation, createQuery } from "react-query-kit";

import type {
    PinApiError,
    PinStatus,
    PinSuccessResponse,
    PinValidationResponse,
    SetPinPayload,
    UpdatePinPayload,
    ValidatePinPayload,
} from "@/modules/api/schema/pin";
import { client } from "@/modules/axios/client";

// PIN API Base URL
const PIN_BASE_URL = "functions/v1/merchants/pin";

// Helper function to create PIN headers
const createPinHeaders = (pinCode?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (pinCode) {
    headers["X-PIN-Code"] = pinCode;
  }
  
  return headers;
};

// Helper function to handle PIN API errors
const handlePinError = (error: AxiosError): PinApiError => {
  const response = error.response?.data as any;
  
  if (response?.code === 'PIN_BLOCKED') {
    return {
      success: false,
      error: "Account blocked due to PIN security violations",
      code: "PIN_BLOCKED",
    };
  }
  
  if (response?.code === 'INACTIVE') {
    return {
      success: false,
      error: "Account is inactive",
      code: "INACTIVE",
    };
  }
  
  if (response?.code === 'PIN_REQUIRED') {
    return {
      success: false,
      error: response.error || "PIN code is required for this operation",
      code: "PIN_REQUIRED",
    };
  }
  
  if (response?.attempts_remaining !== undefined) {
    return {
      success: false,
      error: response.error || "Invalid PIN",
      attempts_remaining: response.attempts_remaining,
      is_blocked: response.is_blocked || false,
    };
  }
  
  return {
    success: false,
    error: response?.error || error.message || "An error occurred",
  };
};

// Set PIN (POST /merchants/pin)
export const useSetPin = createMutation<
  PinSuccessResponse,
  SetPinPayload,
  PinApiError
>({
  mutationFn: async (payload: SetPinPayload) => {
    try {
      const response = await client({
        url: PIN_BASE_URL,
        method: "POST",
        data: payload,
        headers: createPinHeaders(),
      });
      
      return response.data;
    } catch (error) {
      throw handlePinError(error as AxiosError);
    }
  },
});

// Update PIN (PUT /merchants/pin)
export const useUpdatePin = createMutation<
  PinSuccessResponse,
  UpdatePinPayload,
  PinApiError
>({
  mutationFn: async (payload: UpdatePinPayload) => {
    try {
      const response = await client({
        url: PIN_BASE_URL,
        method: "PUT",
        data: payload,
        headers: createPinHeaders(payload.current_pin),
      });
      
      return response.data;
    } catch (error) {
      throw handlePinError(error as AxiosError);
    }
  },
});

// Revoke PIN (DELETE /merchants/pin)
export const useRevokePin = createMutation<
  PinSuccessResponse,
  { pin_code: string },
  PinApiError
>({
  mutationFn: async (payload: { pin_code: string }) => {
    try {
      const response = await client({
        url: PIN_BASE_URL,
        method: "DELETE",
        headers: createPinHeaders(payload.pin_code),
      });
      
      return response.data;
    } catch (error) {
      throw handlePinError(error as AxiosError);
    }
  },
});

// Validate PIN (POST /merchants/pin/validate)
export const useValidatePin = createMutation<
  PinValidationResponse,
  ValidatePinPayload,
  PinApiError
>({
  mutationFn: async (payload: ValidatePinPayload) => {
    try {
      const response = await client({
        url: `${PIN_BASE_URL}/validate`,
        method: "POST",
        headers: createPinHeaders(payload.pin_code),
      });
      
      return response.data;
    } catch (error) {
      throw handlePinError(error as AxiosError);
    }
  },
});

// Get PIN Status (derived from merchant profile)
export const useGetPinStatus = createQuery<
  PinStatus,
  { force?: boolean },
  PinApiError
>({
  queryKey: ["pin-status"],
  fetcher: async (variables = {}) => {
    try {
      const response = await client.get("functions/v1/merchants");
      const profile = response.data.profile;
      
      return {
        has_pin: profile.has_pin || false,
        status: profile.status || 'ACTIVE',
        attempts_remaining: profile.attempts_remaining,
        is_blocked: profile.status === 'PIN_BLOCKED',
      };
    } catch (error) {
      throw handlePinError(error as AxiosError);
    }
  },
  enabled: false,
  retry: false,
});

// PIN Operations Helper Hook
export const usePinOperations = () => {
  const setPin = useSetPin();
  const updatePin = useUpdatePin();
  const revokePin = useRevokePin();
  const validatePin = useValidatePin();
  const pinStatus = useGetPinStatus();

  return {
    // Operations
    setPin: setPin.mutateAsync,
    updatePin: updatePin.mutateAsync,
    revokePin: revokePin.mutateAsync,
    validatePin: validatePin.mutateAsync,
    
    // Status
    getPinStatus: pinStatus.refetch,
    
    // Loading states
    isSettingPin: setPin.isPending,
    isUpdatingPin: updatePin.isPending,
    isRevokingPin: revokePin.isPending,
    isValidatingPin: validatePin.isPending,
    isLoadingPinStatus: pinStatus.isLoading,
    
    // Error states
    setPinError: setPin.error,
    updatePinError: updatePin.error,
    revokePinError: revokePin.error,
    validatePinError: validatePin.error,
    pinStatusError: pinStatus.error,
  };
};
