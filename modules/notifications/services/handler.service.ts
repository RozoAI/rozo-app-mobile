/**
 * Handler Service
 * Manages notification event handlers and routing
 */

import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Linking } from "react-native";
import {
  NotificationAction,
  NotificationHandler,
  NotificationTapHandler,
  ReceivedNotification,
  RemoteMessage,
} from "../types";
import { remoteMessageToNotification } from "../utils/notification-helpers";

/**
 * Handler registry for notification events
 */
class NotificationHandlerRegistry {
  private receivedHandlers: Set<NotificationHandler> = new Set();
  private tappedHandlers: Set<NotificationTapHandler> = new Set();

  /**
   * Register a handler for received notifications
   */
  onReceived(handler: NotificationHandler): () => void {
    this.receivedHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.receivedHandlers.delete(handler);
    };
  }

  /**
   * Register a handler for tapped notifications
   */
  onTapped(handler: NotificationTapHandler): () => void {
    this.tappedHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.tappedHandlers.delete(handler);
    };
  }

  /**
   * Trigger all received handlers
   */
  triggerReceived(notification: ReceivedNotification): void {
    this.receivedHandlers.forEach((handler) => {
      try {
        handler(notification);
      } catch (error) {
        console.error("Error in notification received handler:", error);
      }
    });
  }

  /**
   * Trigger all tapped handlers
   */
  triggerTapped(notification: ReceivedNotification): void {
    this.tappedHandlers.forEach((handler) => {
      try {
        handler(notification);
      } catch (error) {
        console.error("Error in notification tapped handler:", error);
      }
    });
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.receivedHandlers.clear();
    this.tappedHandlers.clear();
  }
}

// Singleton instance
export const handlerRegistry = new NotificationHandlerRegistry();

/**
 * Handle received notification (foreground or background)
 */
export const handleReceivedNotification = (
  remoteMessage: RemoteMessage
): void => {
  try {
    console.log("Handling received notification:", remoteMessage);

    // Convert to app notification format
    const notification = remoteMessageToNotification(remoteMessage);

    if (!notification) {
      console.warn("Failed to parse notification");
      return;
    }

    // Trigger registered handlers
    handlerRegistry.triggerReceived(notification);
  } catch (error) {
    console.error("Error handling received notification:", error);
  }
};

/**
 * Handle notification tap/interaction
 */
export const handleNotificationTap = (
  notification: ReceivedNotification
): void => {
  try {
    console.log("Handling notification tap:", notification);

    // Trigger registered handlers first
    handlerRegistry.triggerTapped(notification);

    // Handle default navigation
    handleNotificationNavigation(notification);
  } catch (error) {
    console.error("Error handling notification tap:", error);
  }
};

/**
 * Handle notification navigation based on action or type
 */
export const handleNotificationNavigation = (
  notification: ReceivedNotification
): void => {
  try {
    const { data } = notification;

    // Handle deep link if provided
    if (data.deepLink) {
      console.log("Opening deep link:", data.deepLink);
      Linking.openURL(data.deepLink);
      return;
    }

    // Handle specific action
    if (data.action) {
      handleNotificationAction(data.action, notification);
      return;
    }

    // Handle by notification type
    handleNotificationByType(notification);
  } catch (error) {
    console.error("Error handling notification navigation:", error);
  }
};

/**
 * Handle notification action
 */
const handleNotificationAction = (
  action: NotificationAction,
  notification: ReceivedNotification
): void => {
  const { data } = notification;

  switch (action) {
    case "OPEN_ORDER":
      if (data.orderId) {
        router.push(`/(main)/orders`);
      }
      break;

    case "OPEN_TRANSACTION":
      if (data.transactionId) {
        router.push(`/(main)/transactions`);
      }
      break;

    case "OPEN_BALANCE":
      router.push(`/(main)/balance`);
      break;

    case "OPEN_POS":
      router.push(`/(main)/pos`);
      break;

    case "OPEN_SETTINGS":
      router.push(`/(main)/settings`);
      break;

    default:
      console.warn("Unknown notification action:", action);
  }
};

/**
 * Handle notification by type
 */
const handleNotificationByType = (notification: ReceivedNotification): void => {
  const { type } = notification.data;

  switch (type) {
    case "ORDER_UPDATE":
    case "PAYMENT_REMINDER":
      router.push(`/(main)/orders`);
      break;

    case "PAYMENT_RECEIVED":
    case "WITHDRAWAL_COMPLETE":
      router.push(`/(main)/balance`);
      break;

    case "MERCHANT_MESSAGE":
      router.push(`/(main)/settings`);
      break;

    case "SYSTEM_ALERT":
      // Don't navigate for system alerts
      break;

    default:
      console.warn("Unknown notification type:", type);
  }
};

/**
 * Present local notification
 * Used to display notifications when app is in foreground
 */
export const presentLocalNotification = async (
  notification: ReceivedNotification
): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title || "Notification",
        body: notification.body || "",
        data: notification.data,
        sound: true,
        badge: 1,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error("Error presenting local notification:", error);
  }
};

// Track if listeners are already setup to prevent duplicates
let listenersSetup = false;
let currentCleanup: (() => void) | null = null;

/**
 * Setup notification listeners
 * Returns cleanup function
 */
export const setupNotificationListeners = (): (() => void) => {
  // Prevent duplicate listener registration
  if (listenersSetup) {
    console.log("⚠️ Notification listeners already setup, skipping...");
    return currentCleanup || (() => {});
  }

  console.log("Setting up notification listeners...");
  listenersSetup = true;

  // Firebase: Handle messages when app is in FOREGROUND
  const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
    console.log("📱 FCM message received (foreground):", remoteMessage);

    // Convert Firebase message to app notification
    const notification = remoteMessageToNotification(remoteMessage);

    if (notification) {
      // Show local notification using Expo
      await presentLocalNotification(notification);

      // Trigger app handlers
      handlerRegistry.triggerReceived(notification);
    }
  });

  // Firebase: Handle notification open when app is in BACKGROUND/QUIT
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log("📱 Notification opened app from background:", remoteMessage);

    const notification = remoteMessageToNotification(remoteMessage);
    if (notification) {
      handleNotificationTap(notification);
    }
  });

  // Firebase: Check if app was opened from QUIT state
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log(
          "📱 App opened from quit state via notification:",
          remoteMessage
        );

        const notification = remoteMessageToNotification(remoteMessage);
        if (notification) {
          handleNotificationTap(notification);
        }
      }
    });

  // Expo: Listener for notification tap (user interaction)
  // NOTE: We don't use addNotificationReceivedListener because Firebase's onMessage
  // already handles foreground notifications. Using both would cause duplicates.
  const responseListener =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("📧 Expo notification tapped:", response);

      const notification: ReceivedNotification = {
        id: response.notification.request.identifier,
        title: response.notification.request.content.title || undefined,
        body: response.notification.request.content.body || undefined,
        data: response.notification.request.content.data as any,
        timestamp: Date.now(),
        isRead: true,
      };

      handleNotificationTap(notification);
    });

  console.log("✅ Notification listeners setup complete");

  // Store cleanup function
  const cleanup = () => {
    console.log("Cleaning up notification listeners");
    listenersSetup = false;
    currentCleanup = null;
    unsubscribeOnMessage();
    responseListener.remove();
  };

  currentCleanup = cleanup;
  return cleanup;
};

/**
 * Clear all notification handlers
 */
export const clearAllHandlers = (): void => {
  handlerRegistry.clear();
};

/**
 * Dismiss all delivered notifications
 */
export const dismissAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.dismissAllNotificationsAsync();
    console.log("All notifications dismissed");
  } catch (error) {
    console.error("Error dismissing notifications:", error);
  }
};

/**
 * Dismiss specific notification
 */
export const dismissNotification = async (
  notificationId: string
): Promise<void> => {
  try {
    await Notifications.dismissNotificationAsync(notificationId);
    console.log("Notification dismissed:", notificationId);
  } catch (error) {
    console.error("Error dismissing notification:", error);
  }
};

/**
 * Get all delivered notifications
 */
export const getDeliveredNotifications = async (): Promise<
  Notifications.Notification[]
> => {
  try {
    return await Notifications.getPresentedNotificationsAsync();
  } catch (error) {
    console.error("Error getting delivered notifications:", error);
    return [];
  }
};
