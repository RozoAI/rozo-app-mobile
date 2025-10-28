import { AppError } from "@/libs/error/error";
import type { MerchantProfile } from "@/modules/api/schema/merchant";
import type { AxiosError } from "axios";

// Merchant status types
export type MerchantStatus = 'ACTIVE' | 'INACTIVE' | 'PIN_BLOCKED';

// Merchant status error types
export type MerchantStatusErrorType = 'PIN_BLOCKED' | 'INACTIVE' | 'GENERIC_403';

// Merchant status error configuration
export interface MerchantStatusErrorConfig {
  type: MerchantStatusErrorType;
  message: string;
  shouldLogout: boolean;
  toastType: 'danger' | 'warning' | 'info';
}

// Custom error class for merchant status errors (extends AppError)
export class MerchantStatusError extends AppError {
  public readonly statusErrorType: MerchantStatusErrorType;
  public readonly profile?: MerchantProfile;
  public readonly config: MerchantStatusErrorConfig;

  constructor(
    statusErrorType: MerchantStatusErrorType,
    profile?: MerchantProfile,
    customMessage?: string
  ) {
    const config = getMerchantStatusErrorConfig(statusErrorType);
    super(customMessage || config.message, 403, { 
      code: statusErrorType,
      profile,
      shouldLogout: config.shouldLogout 
    });
    
    this.name = 'MerchantStatusError';
    this.statusErrorType = statusErrorType;
    this.profile = profile;
    this.config = config;
  }
}

// Merchant status error configurations
const MERCHANT_STATUS_ERROR_CONFIGS: Record<MerchantStatusErrorType, MerchantStatusErrorConfig> = {
  PIN_BLOCKED: {
    type: 'PIN_BLOCKED',
    message: 'Account blocked due to PIN security violations',
    shouldLogout: true,
    toastType: 'danger',
  },
  INACTIVE: {
    type: 'INACTIVE',
    message: 'Account is inactive',
    shouldLogout: true,
    toastType: 'warning',
  },
  GENERIC_403: {
    type: 'GENERIC_403',
    message: 'Access denied',
    shouldLogout: false,
    toastType: 'danger',
  },
};

// Helper function to get error configuration
export const getMerchantStatusErrorConfig = (type: MerchantStatusErrorType): MerchantStatusErrorConfig => {
  return MERCHANT_STATUS_ERROR_CONFIGS[type];
};

// Helper function to detect merchant status error from API response
export const detectMerchantStatusError = (error: AxiosError): MerchantStatusErrorType | null => {
  if (error.response?.status !== 403) {
    return null;
  }

  const response = error.response?.data as any;
  const code = response?.code;

  switch (code) {
    case 'PIN_BLOCKED':
      return 'PIN_BLOCKED';
    case 'INACTIVE':
      return 'INACTIVE';
    default:
      return 'GENERIC_403';
  }
};

// Helper function to check if error should trigger logout
export const shouldTriggerLogout = (errorType: MerchantStatusErrorType): boolean => {
  return getMerchantStatusErrorConfig(errorType).shouldLogout;
};

// Utility function for logging merchant status errors
export const logMerchantStatusError = (
  error: MerchantStatusError,
  context?: string
) => {
  const logData = {
    errorType: error.statusErrorType,
    message: error.message,
    profile: error.profile,
    context: context || 'unknown',
    timestamp: new Date().toISOString(),
  };

  console.error('[MerchantStatusError]', logData);
  
  // TODO: Add analytics/logging service integration here
  // analytics.track('merchant_status_error', logData);
};

// Utility function to check if error is merchant status related
export const isMerchantStatusError = (error: any): error is MerchantStatusError => {
  return error instanceof MerchantStatusError;
};

// Utility function to get error severity
export const getErrorSeverity = (errorType: MerchantStatusErrorType): 'low' | 'medium' | 'high' => {
  switch (errorType) {
    case 'PIN_BLOCKED':
      return 'high';
    case 'INACTIVE':
      return 'medium';
    case 'GENERIC_403':
      return 'low';
    default:
      return 'low';
  }
};
