/**
 * Firebase Service
 * Core Firebase Cloud Messaging operations
 */

import firebase from '@react-native-firebase/app';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationError, NotificationErrorCode, RemoteMessage } from '../types';
import { notificationConfig } from '../config/firebase.config';
import { isPhysicalDevice } from '../utils/notification-helpers';

/**
 * Initialize Firebase Messaging
 */
export const initializeFirebase = async (): Promise<boolean> => {
  try {
    // Check if device supports notifications
    if (!isPhysicalDevice()) {
      console.warn('Firebase messaging not initialized: simulator/emulator detected');
      return false;
    }

    // Check if Firebase is initialized
    // @react-native-firebase/app should auto-initialize from google-services.json
    let app;

    try {
      if (!firebase.apps.length) {
        console.error('⚠️  Firebase not auto-initialized!');
        console.error('📝 This means google-services.json was not processed during build.');
        console.error('🔧 Solution: Rebuild the app with: bun android');

        throw new Error(
          'Firebase not initialized. Please rebuild the app after adding google-services.json'
        );
      }

      app = firebase.app();
      console.log('✅ Firebase initialized:', app.name);
      console.log('📦 Project ID:', app.options.projectId);
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw new NotificationError(
        'Firebase not initialized. Please ensure:\n' +
        '1. google-services.json is in project root\n' +
        '2. Rebuild app with: bun android',
        NotificationErrorCode.FIREBASE_INIT_FAILED,
        error as Error
      );
    }

    // Set notification handler for foreground notifications
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data;
        const priority = (data?.priority as string) || 'default';

        return {
          shouldShowAlert: true,
          shouldPlaySound: priority === 'high',
          shouldSetBadge: true,
          priority: priority as any,
        };
      },
    });

    // Android: Create notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(
        notificationConfig.android.channelId,
        {
          name: notificationConfig.android.channelName,
          description: notificationConfig.android.channelDescription,
          importance: notificationConfig.android.importance,
          sound: notificationConfig.android.sound,
          vibrationPattern: notificationConfig.android.vibrationPattern,
          lightColor: notificationConfig.android.lightColor,
          enableLights: true,
          enableVibrate: true,
          showBadge: notificationConfig.android.badge,
        }
      );
    }

    // iOS: Set notification categories
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync(
        'ORDER_UPDATE',
        [
          {
            identifier: 'VIEW_ORDER',
            buttonTitle: 'View Order',
            options: {
              opensAppToForeground: true,
            },
          },
        ]
      );

      await Notifications.setNotificationCategoryAsync(
        'PAYMENT_REMINDER',
        [
          {
            identifier: 'PAY_NOW',
            buttonTitle: 'Pay Now',
            options: {
              opensAppToForeground: true,
            },
          },
          {
            identifier: 'DISMISS',
            buttonTitle: 'Dismiss',
            options: {
              opensAppToForeground: false,
            },
          },
        ]
      );
    }

    console.log('Firebase messaging initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw new NotificationError(
      'Failed to initialize Firebase messaging',
      NotificationErrorCode.FIREBASE_INIT_FAILED,
      error as Error
    );
  }
};

/**
 * Get FCM token
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // Check if device supports notifications
    if (!isPhysicalDevice()) {
      console.warn('FCM token not available on simulator/emulator');
      return null;
    }

    // Ensure Firebase is initialized
    if (!firebase.apps.length) {
      console.error('Firebase app not initialized');
      return null;
    }

    // Get FCM token from Firebase Messaging
    const messagingInstance = messaging();
    const token = await messagingInstance.getToken();

    if (!token) {
      console.warn('FCM token is empty');
      return null;
    }

    console.log('FCM token retrieved successfully');
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    throw new NotificationError(
      'Failed to get FCM token',
      NotificationErrorCode.TOKEN_REGISTRATION_FAILED,
      error as Error
    );
  }
};

/**
 * Delete FCM token (for logout)
 */
export const deleteFCMToken = async (): Promise<void> => {
  try {
    if (!isPhysicalDevice()) {
      return;
    }

    const messagingInstance = messaging();
    await messagingInstance.deleteToken();
    console.log('FCM token deleted successfully');
  } catch (error) {
    console.error('Error deleting FCM token:', error);
    // Don't throw error for token deletion failures
  }
};

/**
 * Subscribe to FCM topic
 */
export const subscribeToTopic = async (topic: string): Promise<void> => {
  try {
    if (!isPhysicalDevice()) {
      return;
    }

    const messagingInstance = messaging();
    await messagingInstance.subscribeToTopic(topic);
    console.log(`Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error(`Error subscribing to topic ${topic}:`, error);
  }
};

/**
 * Unsubscribe from FCM topic
 */
export const unsubscribeFromTopic = async (topic: string): Promise<void> => {
  try {
    if (!isPhysicalDevice()) {
      return;
    }

    const messagingInstance = messaging();
    await messagingInstance.unsubscribeFromTopic(topic);
    console.log(`Unsubscribed from topic: ${topic}`);
  } catch (error) {
    console.error(`Error unsubscribing from topic ${topic}:`, error);
  }
};

/**
 * Set background message handler
 * This runs when app is in background or killed state
 */
export const setBackgroundMessageHandler = (
  handler: (message: RemoteMessage) => Promise<void>
): void => {
  const messagingInstance = messaging();
  messagingInstance.setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message received:', remoteMessage);
    await handler(remoteMessage);
  });
};

/**
 * Subscribe to foreground messages
 */
export const onForegroundMessage = (
  handler: (message: RemoteMessage) => void
): (() => void) => {
  const messagingInstance = messaging();
  const unsubscribe = messagingInstance.onMessage(async (remoteMessage) => {
    console.log('Foreground message received:', remoteMessage);
    handler(remoteMessage);
  });

  return unsubscribe;
};

/**
 * Subscribe to token refresh events
 */
export const onTokenRefresh = (handler: (token: string) => void): (() => void) => {
  const messagingInstance = messaging();
  const unsubscribe = messagingInstance.onTokenRefresh((token) => {
    console.log('FCM token refreshed:', token);
    handler(token);
  });

  return unsubscribe;
};

/**
 * Get initial notification (when app opened from killed state via notification tap)
 */
export const getInitialNotification =
  async (): Promise<FirebaseMessagingTypes.RemoteMessage | null> => {
    try {
      const messagingInstance = messaging();
      const message = await messagingInstance.getInitialNotification();

      if (message) {
        console.log('App opened from notification:', message);
      }

      return message;
    } catch (error) {
      console.error('Error getting initial notification:', error);
      return null;
    }
  };

/**
 * Subscribe to notification opened events (app in background)
 */
export const onNotificationOpenedApp = (
  handler: (message: RemoteMessage) => void
): (() => void) => {
  const messagingInstance = messaging();
  const unsubscribe = messagingInstance.onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened app from background:', remoteMessage);
    handler(remoteMessage);
  });

  return unsubscribe;
};

/**
 * Check if Firebase messaging is supported
 */
export const isMessagingSupported = async (): Promise<boolean> => {
  try {
    const messagingInstance = messaging();
    return messagingInstance.isDeviceRegisteredForRemoteMessages;
  } catch (error) {
    console.error('Error checking messaging support:', error);
    return false;
  }
};

/**
 * Request iOS notification permissions (alternative method)
 */
export const requestIOSPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS !== 'ios') {
      return true;
    }

    const messagingInstance = messaging();
    const authStatus = await messagingInstance.requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
  } catch (error) {
    console.error('Error requesting iOS permissions:', error);
    return false;
  }
};

/**
 * Get iOS authorization status
 */
export const getIOSAuthorizationStatus = async (): Promise<number> => {
  try {
    if (Platform.OS !== 'ios') {
      return messaging.AuthorizationStatus.AUTHORIZED;
    }

    const messagingInstance = messaging();
    return await messagingInstance.hasPermission();
  } catch (error) {
    console.error('Error getting iOS authorization status:', error);
    return messaging.AuthorizationStatus.NOT_DETERMINED;
  }
};

/**
 * Set badge count (iOS)
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
    // Android badge count is handled by notification channels
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
};

/**
 * Clear badge count
 */
export const clearBadgeCount = async (): Promise<void> => {
  await setBadgeCount(0);
};
