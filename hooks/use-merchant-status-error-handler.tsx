import { useCallback } from 'react';

import { useToast } from '@/hooks/use-toast';
import {
  MerchantStatusError,
  type MerchantStatusErrorType
} from '@/libs/error/merchant-status-error';

// Merchant status error handler hook
export const useMerchantStatusErrorHandler = () => {
  const { success, error, warning } = useToast();

  // Handle merchant status error with toast and optional logout
  const handleMerchantStatusError = useCallback(async (
    merchantError: MerchantStatusError,
    onLogout?: () => Promise<void>
  ) => {
    const { config } = merchantError;
    
    // Show appropriate toast message
    if (config.toastType === 'danger') {
      error(config.message, { duration: config.shouldLogout ? 5000 : 3000 });
    } else if (config.toastType === 'warning') {
      warning(config.message, { duration: config.shouldLogout ? 5000 : 3000 });
    } else {
      success(config.message, { duration: config.shouldLogout ? 5000 : 3000 });
    }

    // Trigger logout if required
    if (config.shouldLogout && onLogout) {
      // Add a small delay to ensure toast is visible
      setTimeout(async () => {
        try {
          await onLogout();
        } catch (logoutError) {
          console.error('Error during logout:', logoutError);
          // Show additional error toast if logout fails
          error('Failed to logout. Please try again.');
        }
      }, 1000);
    }
  }, [success, error, warning]);

  // Create merchant status error from API error
  const createMerchantStatusError = useCallback((
    errorType: MerchantStatusErrorType,
    profile?: any
  ): MerchantStatusError => {
    return new MerchantStatusError(errorType, profile);
  }, []);

  return {
    handleMerchantStatusError,
    createMerchantStatusError,
  };
};
