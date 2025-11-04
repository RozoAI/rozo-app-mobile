/**
 * useFCMToken Hook
 * Manages FCM token state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/auth.provider';
import { client as apiClient } from '@/modules/axios/client';
import {
  getCurrentToken,
  refreshToken as refreshFCMToken,
  registerDeviceToken,
  unregisterDeviceToken,
  getStoredToken,
  handleTokenRefresh as handleTokenRefreshService,
} from '../services/token.service';
import { onTokenRefresh } from '../services/firebase.service';

export interface UseFCMTokenReturn {
  token: string | null;
  isLoading: boolean;
  error: Error | null;
  isRegistered: boolean;
  refreshToken: () => Promise<string | null>;
  registerToken: (userId?: string) => Promise<void>;
  unregisterToken: () => Promise<void>;
}

/**
 * Hook for managing FCM token
 */
export const useFCMToken = (): UseFCMTokenReturn => {
  const { isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  /**
   * Load token from storage or fetch new one
   */
  const loadToken = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const currentToken = await getCurrentToken();

      if (currentToken) {
        setToken(currentToken);

        // Check if token is registered
        const storedToken = getStoredToken();
        setIsRegistered(storedToken?.isRegistered || false);
      }
    } catch (err) {
      console.error('Error loading FCM token:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh FCM token
   */
  const handleRefreshToken = useCallback(async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const newToken = await refreshFCMToken();

      if (newToken) {
        setToken(newToken);
        setIsRegistered(false); // Need to re-register
      }

      return newToken;
    } catch (err) {
      console.error('Error refreshing FCM token:', err);
      setError(err as Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register token with backend
   */
  const handleRegisterToken = useCallback(
    async (userId?: string): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const success = await registerDeviceToken(apiClient, userId);

        if (success) {
          setIsRegistered(true);
          console.log('FCM token registered successfully');
        }
      } catch (err) {
        console.error('Error registering FCM token:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Unregister token from backend
   */
  const handleUnregisterToken = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await unregisterDeviceToken(apiClient);

      setToken(null);
      setIsRegistered(false);
      console.log('FCM token unregistered successfully');
    } catch (err) {
      console.error('Error unregistering FCM token:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Setup token refresh listener
   */
  useEffect(() => {
    const unsubscribe = onTokenRefresh(async (newToken) => {
      console.log('FCM token refreshed automatically:', newToken);
      setToken(newToken);

      // Handle token refresh with backend
      if (isAuthenticated) {
        await handleTokenRefreshService(newToken, apiClient);
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
      }
    });

    return unsubscribe;
  }, [isAuthenticated]);

  /**
   * Load token on mount
   */
  useEffect(() => {
    loadToken();
  }, [loadToken]);

  /**
   * Auto-register token when authenticated
   */
  useEffect(() => {
    if (isAuthenticated && token && !isRegistered) {
      console.log('Auto-registering FCM token after authentication');
      handleRegisterToken();
    }
  }, [isAuthenticated, token, isRegistered, handleRegisterToken]);

  return {
    token,
    isLoading,
    error,
    isRegistered,
    refreshToken: handleRefreshToken,
    registerToken: handleRegisterToken,
    unregisterToken: handleUnregisterToken,
  };
};
