/**
 * Notification Helper Utilities
 * Common utility functions for notification handling
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import {
  NotificationData,
  NotificationType,
  ReceivedNotification,
  RemoteMessage,
  PlatformType,
} from '../types';

/**
 * Generate unique notification ID
 */
export const generateNotificationId = (): string => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get current platform
 */
export const getCurrentPlatform = (): PlatformType => {
  return Platform.OS === 'ios' ? 'ios' : 'android';
};

/**
 * Check if device is physical (not simulator/emulator)
 */
export const isPhysicalDevice = (): boolean => {
  return Device.isDevice;
};

/**
 * Get device name
 */
export const getDeviceName = async (): Promise<string> => {
  const deviceName = Device.deviceName || 'Unknown Device';
  return deviceName;
};

/**
 * Get device ID
 */
export const getDeviceId = (): string => {
  // Use a combination of device properties for unique ID
  const osName = Device.osName || 'unknown';
  const osVersion = Device.osVersion || 'unknown';
  const modelName = Device.modelName || 'unknown';

  return `${osName}_${osVersion}_${modelName}_${Date.now()}`.replace(/\s+/g, '_');
};

/**
 * Parse notification data from Firebase remote message
 */
export const parseNotificationData = (
  remoteMessage: RemoteMessage
): NotificationData | null => {
  try {
    const { data } = remoteMessage;

    // If no data or empty data, create a default notification data object
    if (!data || Object.keys(data).length === 0) {
      console.log('No custom data, using default notification type');
      return {
        type: 'SYSTEM_ALERT' as NotificationType,
        timestamp: new Date().toISOString(),
      };
    }

    // If data exists but no type, default to SYSTEM_ALERT
    const notificationType = data.type || 'SYSTEM_ALERT';

    // Helper to safely convert to string
    const toString = (val: any): string | undefined => {
      return typeof val === 'string' ? val : undefined;
    };

    return {
      type: notificationType as NotificationType,
      orderId: toString(data.orderId),
      transactionId: toString(data.transactionId),
      depositId: toString(data.depositId),
      withdrawalId: toString(data.withdrawalId),
      amount: toString(data.amount),
      currency: toString(data.currency),
      status: toString(data.status),
      deepLink: toString(data.deepLink),
      action: toString(data.action) as any,
      timestamp: toString(data.timestamp) || new Date().toISOString(),
      ...data, // Include any additional fields
    };
  } catch (error) {
    console.error('Error parsing notification data:', error);
    return null;
  }
};

/**
 * Convert Firebase remote message to ReceivedNotification
 */
export const remoteMessageToNotification = (
  remoteMessage: RemoteMessage
): ReceivedNotification | null => {
  const data = parseNotificationData(remoteMessage);

  if (!data) {
    return null;
  }

  return {
    id: remoteMessage.messageId || generateNotificationId(),
    title: remoteMessage.notification?.title,
    body: remoteMessage.notification?.body,
    data,
    timestamp: Date.now(),
    isRead: false,
  };
};

/**
 * Get notification title based on type
 */
export const getNotificationTitle = (type: NotificationType): string => {
  const titles: Record<NotificationType, string> = {
    ORDER_UPDATE: 'Order Update',
    PAYMENT_RECEIVED: 'Payment Received',
    WITHDRAWAL_COMPLETE: 'Withdrawal Complete',
    PAYMENT_REMINDER: 'Payment Reminder',
    MERCHANT_MESSAGE: 'New Message',
    SYSTEM_ALERT: 'System Alert',
  };

  return titles[type] || 'Notification';
};

/**
 * Format notification body text
 */
export const formatNotificationBody = (
  type: NotificationType,
  data: NotificationData
): string => {
  switch (type) {
    case 'ORDER_UPDATE':
      return `Order #${data.orderId?.slice(-6)} has been ${data.status}`;
    case 'PAYMENT_RECEIVED':
      return `Payment of ${data.amount} ${data.currency} received`;
    case 'WITHDRAWAL_COMPLETE':
      return `Your withdrawal of ${data.amount} ${data.currency} has been processed`;
    case 'PAYMENT_REMINDER':
      return `Payment for order #${data.orderId?.slice(-6)} is pending`;
    case 'MERCHANT_MESSAGE':
      return 'You have a new message';
    case 'SYSTEM_ALERT':
      return 'System notification';
    default:
      return 'You have a new notification';
  }
};

/**
 * Check if notification should show badge
 */
export const shouldShowBadge = (type: NotificationType): boolean => {
  // All notification types show badge except system alerts
  return type !== 'SYSTEM_ALERT';
};

/**
 * Check if notification should play sound
 */
export const shouldPlaySound = (type: NotificationType): boolean => {
  // Critical notifications play sound
  const soundNotifications: NotificationType[] = [
    'ORDER_UPDATE',
    'PAYMENT_REMINDER',
    'PAYMENT_RECEIVED',
    'WITHDRAWAL_COMPLETE',
  ];

  return soundNotifications.includes(type);
};

/**
 * Get notification priority
 */
export const getNotificationPriority = (
  type: NotificationType
): 'default' | 'low' | 'high' => {
  const highPriorityTypes: NotificationType[] = [
    'PAYMENT_REMINDER',
    'ORDER_UPDATE',
  ];

  return highPriorityTypes.includes(type) ? 'high' : 'default';
};

/**
 * Validate notification data structure
 */
export const isValidNotificationData = (data: any): data is NotificationData => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.type === 'string' &&
    typeof data.timestamp === 'string'
  );
};

/**
 * Truncate notification body for display
 */
export const truncateBody = (body: string, maxLength: number = 100): string => {
  if (body.length <= maxLength) {
    return body;
  }

  return `${body.substring(0, maxLength - 3)}...`;
};

/**
 * Get time ago string for notification
 */
export const getTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) {
    return 'Just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(timestamp).toLocaleDateString();
};

/**
 * Group notifications by type
 */
export const groupNotificationsByType = (
  notifications: ReceivedNotification[]
): Record<NotificationType, ReceivedNotification[]> => {
  const grouped = {} as Record<NotificationType, ReceivedNotification[]>;

  notifications.forEach((notification) => {
    const { type } = notification.data;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(notification);
  });

  return grouped;
};

/**
 * Sort notifications by timestamp (newest first)
 */
export const sortNotificationsByTimestamp = (
  notifications: ReceivedNotification[]
): ReceivedNotification[] => {
  return [...notifications].sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Filter unread notifications
 */
export const getUnreadNotifications = (
  notifications: ReceivedNotification[]
): ReceivedNotification[] => {
  return notifications.filter((n) => !n.isRead);
};

/**
 * Count unread notifications
 */
export const countUnreadNotifications = (
  notifications: ReceivedNotification[]
): number => {
  return notifications.filter((n) => !n.isRead).length;
};
