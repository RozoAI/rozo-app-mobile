/**
 * useNotificationPermissions Hook
 * Manages notification permission state and requests
 */

import { useState, useEffect, useCallback } from 'react';
import { NotificationPermissionStatus } from '../types';
import {
  checkPermissionStatus,
  requestPermission,
  requestPermissionWithGuidance,
  openSettings,
} from '../services/permission.service';

export interface UseNotificationPermissionsReturn {
  permissionStatus: NotificationPermissionStatus;
  isLoading: boolean;
  isGranted: boolean;
  isDenied: boolean;
  isUndetermined: boolean;
  requestPermission: () => Promise<boolean>;
  requestWithGuidance: () => Promise<{
    granted: boolean;
    shouldOpenSettings: boolean;
  }>;
  openSettings: () => Promise<void>;
  checkStatus: () => Promise<void>;
}

/**
 * Hook for managing notification permissions
 */
export const useNotificationPermissions = (): UseNotificationPermissionsReturn => {
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Check permission status
   */
  const checkStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const status = await checkPermissionStatus();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking permission status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Request permission
   */
  const handleRequestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const granted = await requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      return granted;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Request permission with guidance
   */
  const handleRequestWithGuidance = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await requestPermissionWithGuidance();
      setPermissionStatus(result.granted ? 'granted' : 'denied');
      return result;
    } catch (error) {
      console.error('Error requesting permission with guidance:', error);
      return { granted: false, shouldOpenSettings: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Open device settings
   */
  const handleOpenSettings = useCallback(async (): Promise<void> => {
    await openSettings();
  }, []);

  /**
   * Check status on mount
   */
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    permissionStatus,
    isLoading,
    isGranted: permissionStatus === 'granted',
    isDenied: permissionStatus === 'denied',
    isUndetermined: permissionStatus === 'undetermined',
    requestPermission: handleRequestPermission,
    requestWithGuidance: handleRequestWithGuidance,
    openSettings: handleOpenSettings,
    checkStatus,
  };
};
