/**
 * Notification Provider
 * Main context provider for notification system
 */

import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  NotificationContextState,
  ReceivedNotification,
  NotificationPermissionStatus,
  NotificationHandler,
  NotificationTapHandler,
} from './types';
import { storage } from '@/libs/storage';
import { useAuth } from '@/providers/auth.provider';
import { client as apiClient } from '@/modules/axios/client';

// Services
import { initializeFirebase, setBadgeCount } from './services/firebase.service';
import {
  checkPermissionStatus,
  requestPermission,
} from './services/permission.service';
import {
  getCurrentToken,
  refreshToken as refreshFCMToken,
  registerDeviceToken,
  unregisterDeviceToken,
} from './services/token.service';
import {
  setupNotificationListeners,
  handleReceivedNotification,
  handlerRegistry,
  dismissAllNotifications,
  dismissNotification,
} from './services/handler.service';

// Helpers
import {
  countUnreadNotifications,
  sortNotificationsByTimestamp,
} from './utils/notification-helpers';

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  NOTIFICATIONS: 'notification.notifications',
  UNREAD_COUNT: 'notification.unreadCount',
} as const;

/**
 * Create notification context
 */
export const NotificationContext = createContext<NotificationContextState | null>(
  null
);

/**
 * Notification Provider Props
 */
interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * Notification Provider Component
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<ReceivedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>('undetermined');
  const [fcmToken, setFCMToken] = useState<string | null>(null);
  const [isTokenRegistered, setIsTokenRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const isInitialized = useRef(false);
  const cleanupListeners = useRef<(() => void) | null>(null);

  /**
   * Load notifications from storage
   */
  const loadNotificationsFromStorage = useCallback(() => {
    try {
      const stored = storage.getString(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) {
        const parsed = JSON.parse(stored) as ReceivedNotification[];
        setNotifications(sortNotificationsByTimestamp(parsed));
        setUnreadCount(countUnreadNotifications(parsed));
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  }, []);

  /**
   * Save notifications to storage
   */
  const saveNotificationsToStorage = useCallback(
    (notifs: ReceivedNotification[]) => {
      try {
        storage.set(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
        storage.set(STORAGE_KEYS.UNREAD_COUNT, countUnreadNotifications(notifs));
      } catch (error) {
        console.error('Error saving notifications to storage:', error);
      }
    },
    []
  );

  /**
   * Add new notification to list
   */
  const addNotification = useCallback(
    (notification: ReceivedNotification) => {
      setNotifications((prev) => {
        const updated = [notification, ...prev];
        const sorted = sortNotificationsByTimestamp(updated);
        saveNotificationsToStorage(sorted);
        return sorted;
      });
      setUnreadCount((prev) => prev + 1);

      // Update badge count
      setBadgeCount(unreadCount + 1);
    },
    [unreadCount, saveNotificationsToStorage]
  );

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(
    (notificationId: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        );
        saveNotificationsToStorage(updated);
        return updated;
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Update badge count
      setBadgeCount(Math.max(0, unreadCount - 1));
    },
    [unreadCount, saveNotificationsToStorage]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      saveNotificationsToStorage(updated);
      return updated;
    });
    setUnreadCount(0);

    // Clear badge count
    setBadgeCount(0);
  }, [saveNotificationsToStorage]);

  /**
   * Clear single notification
   */
  const clearNotification = useCallback(
    (notificationId: string) => {
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === notificationId);
        const updated = prev.filter((n) => n.id !== notificationId);
        saveNotificationsToStorage(updated);

        // Update unread count if notification was unread
        if (notification && !notification.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }

        return updated;
      });

      // Dismiss from notification tray
      dismissNotification(notificationId);
    },
    [saveNotificationsToStorage]
  );

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    saveNotificationsToStorage([]);

    // Clear badge count
    setBadgeCount(0);

    // Dismiss all from notification tray
    dismissAllNotifications();
  }, [saveNotificationsToStorage]);

  /**
   * Check permission status
   */
  const checkPermission = useCallback(async (): Promise<
    NotificationPermissionStatus
  > => {
    try {
      const status = await checkPermissionStatus();
      setPermissionStatus(status);
      return status;
    } catch (err) {
      console.error('Error checking permission:', err);
      return 'denied';
    }
  }, []);

  /**
   * Request notification permission
   */
  const handleRequestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');
      return granted;
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError(err as Error);
      return false;
    }
  }, []);

  /**
   * Get FCM token
   */
  const getFCMToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getCurrentToken();
      setFCMToken(token);
      return token;
    } catch (err) {
      console.error('Error getting FCM token:', err);
      setError(err as Error);
      return null;
    }
  }, []);

  /**
   * Refresh FCM token
   */
  const refreshFCMToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await refreshFCMToken();
      setFCMToken(token);
      setIsTokenRegistered(false);
      return token;
    } catch (err) {
      console.error('Error refreshing FCM token:', err);
      setError(err as Error);
      return null;
    }
  }, []);

  /**
   * Register token with backend
   */
  const registerToken = useCallback(
    async (userId?: string): Promise<void> => {
      try {
        const success = await registerDeviceToken(apiClient, userId);
        setIsTokenRegistered(success);
      } catch (err) {
        console.error('Error registering token:', err);
        setError(err as Error);
      }
    },
    []
  );

  /**
   * Unregister token from backend
   */
  const unregisterToken = useCallback(async (): Promise<void> => {
    try {
      await unregisterDeviceToken(apiClient);
      setFCMToken(null);
      setIsTokenRegistered(false);
    } catch (err) {
      console.error('Error unregistering token:', err);
      setError(err as Error);
    }
  }, []);

  /**
   * Register notification received handler
   */
  const onNotificationReceived = useCallback(
    (handler: NotificationHandler): (() => void) => {
      return handlerRegistry.onReceived((notification) => {
        // Add to local state
        addNotification(notification);

        // Call custom handler
        handler(notification);
      });
    },
    [addNotification]
  );

  /**
   * Register notification tapped handler
   */
  const onNotificationTapped = useCallback(
    (handler: NotificationTapHandler): (() => void) => {
      return handlerRegistry.onTapped((notification) => {
        // Mark as read
        markAsRead(notification.id);

        // Call custom handler
        handler(notification);
      });
    },
    [markAsRead]
  );

  /**
   * Initialize notification system
   */
  const initializeNotifications = useCallback(async () => {
    if (isInitialized.current) {
      console.log('⚠️ Notification system already initialized, skipping...');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🚀 Initializing notification system...');

      // Load notifications from storage
      loadNotificationsFromStorage();

      // Initialize Firebase
      await initializeFirebase();

      // Check permissions
      const currentStatus = await checkPermission();

      // Request permission if not granted
      if (currentStatus !== 'granted') {
        console.log('Requesting notification permission...');
        await handleRequestPermission();
      }

      // Get FCM token
      const token = await getFCMToken();

      // Setup notification listeners (has built-in duplicate prevention)
      const cleanup = setupNotificationListeners();
      cleanupListeners.current = cleanup;

      // Register token if authenticated
      if (isAuthenticated && token) {
        await registerToken(user?.id);
      }

      isInitialized.current = true;
      console.log('✅ Notification system initialized successfully');
    } catch (err) {
      console.error('❌ Error initializing notifications:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [
    isAuthenticated,
    user,
    loadNotificationsFromStorage,
    checkPermission,
    handleRequestPermission,
    getFCMToken,
    registerToken,
  ]);

  /**
   * Handle app state changes
   */
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground
        console.log('App active: checking notifications');
        await checkPermission();
        await getFCMToken();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [checkPermission, getFCMToken]);

  /**
   * Initialize on mount (only once)
   */
  useEffect(() => {
    initializeNotifications();

    return () => {
      if (cleanupListeners.current) {
        console.log('🧹 NotificationProvider unmounting, cleaning up...');
        cleanupListeners.current();
        isInitialized.current = false;
      }
    };
    // Empty deps array - only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle authentication changes
   */
  useEffect(() => {
    if (isAuthenticated && fcmToken && !isTokenRegistered) {
      // Register token when user logs in
      registerToken(user?.id);
    } else if (!isAuthenticated && isTokenRegistered) {
      // Unregister token when user logs out
      unregisterToken();
      clearAll();
    }
  }, [
    isAuthenticated,
    fcmToken,
    isTokenRegistered,
    user,
    registerToken,
    unregisterToken,
    clearAll,
  ]);

  /**
   * Context value
   */
  const contextValue: NotificationContextState = {
    // State
    notifications,
    unreadCount,
    permissionStatus,
    fcmToken,
    isTokenRegistered,
    isLoading,
    error,

    // Permission methods
    requestPermission: handleRequestPermission,
    checkPermission,

    // Token methods
    getFCMToken,
    refreshFCMToken,
    registerToken,
    unregisterToken,

    // Notification methods
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,

    // Handler registration
    onNotificationReceived,
    onNotificationTapped,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
