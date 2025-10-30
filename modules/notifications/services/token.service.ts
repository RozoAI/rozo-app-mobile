/**
 * Token Service
 * Handles FCM token registration and management with backend
 */

import { storage } from '@/libs/storage';
import { FCMToken, DeviceInfo, NotificationError, NotificationErrorCode } from '../types';
import { getFCMToken, deleteFCMToken } from './firebase.service';
import { getDeviceId, getDeviceName, getCurrentPlatform } from '../utils/notification-helpers';
import Constants from 'expo-constants';

/**
 * Storage keys for token management
 */
const STORAGE_KEYS = {
  FCM_TOKEN: 'notification.fcmToken',
  TOKEN_TIMESTAMP: 'notification.tokenTimestamp',
  TOKEN_REGISTERED: 'notification.tokenRegistered',
  DEVICE_ID: 'notification.deviceId',
} as const;

/**
 * Get stored FCM token from local storage
 */
export const getStoredToken = (): FCMToken | null => {
  try {
    const token = storage.getString(STORAGE_KEYS.FCM_TOKEN);
    const timestamp = storage.getNumber(STORAGE_KEYS.TOKEN_TIMESTAMP);
    const isRegistered = storage.getBoolean(STORAGE_KEYS.TOKEN_REGISTERED) || false;

    if (!token || !timestamp) {
      return null;
    }

    return {
      token,
      timestamp,
      isRegistered,
    };
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
};

/**
 * Store FCM token in local storage
 */
export const storeToken = (token: string, isRegistered: boolean = false): void => {
  try {
    storage.set(STORAGE_KEYS.FCM_TOKEN, token);
    storage.set(STORAGE_KEYS.TOKEN_TIMESTAMP, Date.now());
    storage.set(STORAGE_KEYS.TOKEN_REGISTERED, isRegistered);
    console.log('Token stored successfully');
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

/**
 * Clear stored FCM token from local storage
 */
export const clearStoredToken = (): void => {
  try {
    storage.delete(STORAGE_KEYS.FCM_TOKEN);
    storage.delete(STORAGE_KEYS.TOKEN_TIMESTAMP);
    storage.delete(STORAGE_KEYS.TOKEN_REGISTERED);
    console.log('Stored token cleared');
  } catch (error) {
    console.error('Error clearing stored token:', error);
  }
};

/**
 * Get or generate device ID
 */
export const getOrCreateDeviceId = (): string => {
  try {
    let deviceId = storage.getString(STORAGE_KEYS.DEVICE_ID);

    if (!deviceId) {
      deviceId = getDeviceId();
      storage.set(STORAGE_KEYS.DEVICE_ID, deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return getDeviceId();
  }
};

/**
 * Get device information for token registration
 */
export const getDeviceInfo = async (token: string): Promise<DeviceInfo> => {
  const deviceId = getOrCreateDeviceId();
  const platform = getCurrentPlatform();
  const deviceName = await getDeviceName();
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return {
    token,
    deviceId,
    platform,
    deviceName,
    appVersion,
  };
};

/**
 * Refresh FCM token
 * Gets new token from Firebase and stores it
 */
export const refreshToken = async (): Promise<string | null> => {
  try {
    console.log('Refreshing FCM token...');

    // Get new token from Firebase
    const token = await getFCMToken();

    if (!token) {
      console.warn('Failed to refresh token: token is empty');
      return null;
    }

    // Store new token (mark as not registered yet)
    storeToken(token, false);

    console.log('Token refreshed successfully');
    console.log('🔑 FCM TOKEN:', token);
    console.log('📋 Copy this token to send test notifications from Firebase Console');
    return token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new NotificationError(
      'Failed to refresh FCM token',
      NotificationErrorCode.TOKEN_REGISTRATION_FAILED,
      error as Error
    );
  }
};

/**
 * Get current FCM token (from storage or fetch new)
 */
export const getCurrentToken = async (): Promise<string | null> => {
  try {
    // Try to get stored token first
    const storedToken = getStoredToken();

    if (storedToken) {
      console.log('Using stored FCM token');
      console.log('🔑 FCM TOKEN:', storedToken.token);
      console.log('📋 Copy this token to send test notifications from Firebase Console');
      return storedToken.token;
    }

    // If no stored token, fetch new one
    console.log('No stored token, fetching new one...');
    return await refreshToken();
  } catch (error) {
    console.error('Error getting current token:', error);
    return null;
  }
};

/**
 * Register device token with backend
 * This should be called after successful authentication
 */
export const registerDeviceToken = async (
  apiClient: any,
  userId?: string
): Promise<boolean> => {
  try {
    // Get current token
    const token = await getCurrentToken();

    if (!token) {
      console.warn('Cannot register token: token is empty');
      return false;
    }

    // Get device information
    const deviceInfo = await getDeviceInfo(token);

    console.log('Registering device token with backend...', {
      deviceId: deviceInfo.deviceId,
      platform: deviceInfo.platform,
    });

    // Make API call to register token
    // This should match your backend API endpoint
    await apiClient.post('/merchant/devices', deviceInfo);

    // Mark token as registered
    storeToken(token, true);

    console.log('Device token registered successfully');
    return true;
  } catch (error) {
    console.error('Error registering device token:', error);
    throw new NotificationError(
      'Failed to register device token with backend',
      NotificationErrorCode.TOKEN_REGISTRATION_FAILED,
      error as Error
    );
  }
};

/**
 * Unregister device token from backend
 * This should be called on logout
 */
export const unregisterDeviceToken = async (apiClient: any): Promise<boolean> => {
  try {
    const storedToken = getStoredToken();

    if (!storedToken || !storedToken.isRegistered) {
      console.log('No registered token to unregister');
      return true;
    }

    const deviceId = getOrCreateDeviceId();

    console.log('Unregistering device token from backend...');

    // Make API call to unregister token
    await apiClient.delete('/merchant/devices', {
      data: {
        deviceId,
        token: storedToken.token,
      },
    });

    // Delete token from Firebase
    await deleteFCMToken();

    // Clear local storage
    clearStoredToken();

    console.log('Device token unregistered successfully');
    return true;
  } catch (error) {
    console.error('Error unregistering device token:', error);

    // Still clear local token even if API call fails
    clearStoredToken();

    return false;
  }
};

/**
 * Handle token refresh event
 * Updates stored token and re-registers with backend if needed
 */
export const handleTokenRefresh = async (
  newToken: string,
  apiClient: any
): Promise<void> => {
  try {
    console.log('Handling token refresh...');

    // Store new token
    storeToken(newToken, false);

    // Check if we need to re-register with backend
    const storedToken = getStoredToken();

    if (storedToken && storedToken.isRegistered) {
      // Re-register with backend
      await registerDeviceToken(apiClient);
    }

    console.log('Token refresh handled successfully');
  } catch (error) {
    console.error('Error handling token refresh:', error);
  }
};

/**
 * Check if token is valid and not expired
 * Tokens should be refreshed periodically (e.g., every 30 days)
 */
export const isTokenValid = (): boolean => {
  try {
    const storedToken = getStoredToken();

    if (!storedToken) {
      return false;
    }

    // Check if token is older than 30 days
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const tokenAge = Date.now() - storedToken.timestamp;

    if (tokenAge > thirtyDaysInMs) {
      console.log('Token is expired (older than 30 days)');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

/**
 * Ensure token is fresh and registered
 * Refreshes if needed
 */
export const ensureFreshToken = async (apiClient: any): Promise<string | null> => {
  try {
    // Check if current token is valid
    if (!isTokenValid()) {
      console.log('Token is invalid or expired, refreshing...');
      const newToken = await refreshToken();

      if (newToken) {
        // Re-register with backend
        await registerDeviceToken(apiClient);
        return newToken;
      }
    }

    return await getCurrentToken();
  } catch (error) {
    console.error('Error ensuring fresh token:', error);
    return null;
  }
};
