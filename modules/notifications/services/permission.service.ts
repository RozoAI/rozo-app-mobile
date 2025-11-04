/**
 * Permission Service
 * Handles notification permission requests and checks
 */

import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { Platform, Linking } from 'react-native';
import { NotificationPermissionStatus, NotificationError, NotificationErrorCode } from '../types';
import { isPhysicalDevice } from '../utils/notification-helpers';

/**
 * Check current notification permission status
 */
export const checkPermissionStatus = async (): Promise<NotificationPermissionStatus> => {
  try {
    // Check if device supports notifications
    if (!isPhysicalDevice()) {
      console.warn('Push notifications are not supported on simulator/emulator');
      return 'denied';
    }

    // Check Expo notifications permission
    const { status } = await Notifications.getPermissionsAsync();

    switch (status) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      default:
        return 'undetermined';
    }
  } catch (error) {
    console.error('Error checking permission status:', error);
    throw new NotificationError(
      'Failed to check notification permission',
      NotificationErrorCode.PERMISSION_DENIED,
      error as Error
    );
  }
};

/**
 * Request notification permissions from user
 */
export const requestPermission = async (): Promise<boolean> => {
  try {
    // Check if device supports notifications
    if (!isPhysicalDevice()) {
      console.warn('Push notifications are not supported on simulator/emulator');
      return false;
    }

    // For iOS, request Firebase messaging permission first
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission({
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      });

      const iosEnabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!iosEnabled) {
        console.warn('iOS notification permission denied');
        return false;
      }
    }

    // Request Expo notifications permission
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
      },
      android: {},
    });

    const granted = status === 'granted';

    if (granted) {
      console.log('Notification permission granted');
    } else {
      console.warn('Notification permission denied');
    }

    return granted;
  } catch (error) {
    console.error('Error requesting permission:', error);
    throw new NotificationError(
      'Failed to request notification permission',
      NotificationErrorCode.PERMISSION_DENIED,
      error as Error
    );
  }
};

/**
 * Check if user has granted notification permission
 */
export const hasPermission = async (): Promise<boolean> => {
  try {
    const status = await checkPermissionStatus();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Open device settings for notification permissions
 * (Used when user denies permission and needs to enable manually)
 */
export const openSettings = async (): Promise<void> => {
  try {
    // Open app settings using React Native Linking
    await Linking.openSettings();
  } catch (error) {
    console.error('Error opening settings:', error);
  }
};

/**
 * Request permission with user-friendly flow
 * Includes retry logic and guidance
 */
export const requestPermissionWithGuidance = async (): Promise<{
  granted: boolean;
  shouldOpenSettings: boolean;
}> => {
  try {
    // First check if already granted
    const currentStatus = await checkPermissionStatus();

    if (currentStatus === 'granted') {
      return { granted: true, shouldOpenSettings: false };
    }

    // If denied, suggest opening settings
    if (currentStatus === 'denied') {
      return { granted: false, shouldOpenSettings: true };
    }

    // If undetermined, request permission
    const granted = await requestPermission();

    return { granted, shouldOpenSettings: false };
  } catch (error) {
    console.error('Error in permission flow:', error);
    return { granted: false, shouldOpenSettings: false };
  }
};
