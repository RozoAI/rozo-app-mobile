/**
 * Notification Module Types
 * Type definitions for the notification system
 */

import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

/**
 * Notification permission status
 */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Platform type
 */
export type PlatformType = 'ios' | 'android';

/**
 * Notification types supported by the app
 */
export type NotificationType =
  | 'ORDER_UPDATE'
  | 'DEPOSIT_COMPLETE'
  | 'WITHDRAWAL_COMPLETE'
  | 'PAYMENT_REMINDER'
  | 'MERCHANT_MESSAGE'
  | 'SYSTEM_ALERT';

/**
 * Notification action types
 */
export type NotificationAction =
  | 'OPEN_ORDER'
  | 'OPEN_TRANSACTION'
  | 'OPEN_SETTINGS'
  | 'OPEN_BALANCE'
  | 'OPEN_POS';

/**
 * Custom notification data payload
 */
export interface NotificationData {
  type: NotificationType;
  orderId?: string;
  transactionId?: string;
  depositId?: string;
  withdrawalId?: string;
  amount?: string;
  currency?: string;
  status?: string;
  deepLink?: string;
  action?: NotificationAction;
  timestamp: string;
  [key: string]: any; // Allow additional custom fields
}

/**
 * Notification payload structure
 */
export interface NotificationPayload {
  notification?: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  data: NotificationData;
}

/**
 * Received notification object
 */
export interface ReceivedNotification {
  id: string;
  title?: string;
  body?: string;
  data: NotificationData;
  timestamp: number;
  isRead: boolean;
}

/**
 * FCM token information
 */
export interface FCMToken {
  token: string;
  timestamp: number;
  isRegistered: boolean;
}

/**
 * Device information for token registration
 */
export interface DeviceInfo {
  token: string;
  deviceId: string;
  platform: PlatformType;
  deviceName?: string;
  appVersion?: string;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  enabled: boolean;
  orderUpdates: boolean;
  paymentAlerts: boolean;
  depositWithdrawals: boolean;
  merchantMessages: boolean;
  systemAlerts: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
}

/**
 * Notification handler function type
 */
export type NotificationHandler = (notification: ReceivedNotification) => void;

/**
 * Notification tap handler function type
 */
export type NotificationTapHandler = (notification: ReceivedNotification) => void;

/**
 * Firebase remote message type (re-export for convenience)
 */
export type RemoteMessage = FirebaseMessagingTypes.RemoteMessage;

/**
 * Notification context state
 */
export interface NotificationContextState {
  // State
  notifications: ReceivedNotification[];
  unreadCount: number;
  permissionStatus: NotificationPermissionStatus;
  fcmToken: string | null;
  isTokenRegistered: boolean;
  isLoading: boolean;
  error: Error | null;

  // Permission methods
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<NotificationPermissionStatus>;

  // Token methods
  getFCMToken: () => Promise<string | null>;
  refreshFCMToken: () => Promise<string | null>;
  registerToken: (userId?: string) => Promise<void>;
  unregisterToken: () => Promise<void>;

  // Notification methods
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAll: () => void;

  // Handler registration
  onNotificationReceived: (handler: NotificationHandler) => () => void;
  onNotificationTapped: (handler: NotificationTapHandler) => () => void;
}

/**
 * Error codes for notification operations
 */
export enum NotificationErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TOKEN_REGISTRATION_FAILED = 'TOKEN_REGISTRATION_FAILED',
  FIREBASE_INIT_FAILED = 'FIREBASE_INIT_FAILED',
  INVALID_NOTIFICATION_PAYLOAD = 'INVALID_NOTIFICATION_PAYLOAD',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Notification error class
 */
export class NotificationError extends Error {
  constructor(
    message: string,
    public code: NotificationErrorCode,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}
