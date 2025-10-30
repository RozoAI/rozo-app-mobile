/**
 * Notifications Module
 * Public API exports for the notification system
 */

// Provider
export { NotificationProvider, NotificationContext } from './provider';

// Hooks
export { useNotifications } from './hooks/use-notifications';
export { useFCMToken } from './hooks/use-fcm-token';
export { useNotificationPermissions } from './hooks/use-notification-permissions';

// Types
export type {
  NotificationPermissionStatus,
  PlatformType,
  NotificationType,
  NotificationAction,
  NotificationData,
  NotificationPayload,
  ReceivedNotification,
  FCMToken,
  DeviceInfo,
  NotificationSettings,
  NotificationHandler,
  NotificationTapHandler,
  RemoteMessage,
  NotificationContextState,
} from './types';

export { NotificationErrorCode, NotificationError } from './types';

// Services (optional, for advanced usage)
export * as FirebaseService from './services/firebase.service';
export * as PermissionService from './services/permission.service';
export * as TokenService from './services/token.service';
export * as HandlerService from './services/handler.service';

// Utils (optional, for advanced usage)
export * as NotificationHelpers from './utils/notification-helpers';

// Config
export { firebaseConfig, notificationConfig } from './config/firebase.config';
