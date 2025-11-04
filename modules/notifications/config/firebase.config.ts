/**
 * Firebase Configuration
 * Centralizes Firebase configuration for notifications
 *
 * IMPORTANT:
 * @react-native-firebase/app automatically reads from:
 * - google-services.json (Android)
 * - GoogleService-Info.plist (iOS)
 *
 * You don't need .env variables for Firebase!
 * They're only needed if:
 * 1. You want to support web (React Native Web)
 * 2. You're using Firebase JS SDK directly (not the native module)
 */

/**
 * Firebase configuration object (OPTIONAL - only for web support)
 * For mobile (iOS/Android), this is NOT used - native config files are used instead
 */
import * as Notifications from "expo-notifications";

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "rozo-dev", // Fallback from google-services.json
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Notification configuration
 */
export const notificationConfig = {
  // Android notification channel configuration
  android: {
    channelId: "rozo-notifications",
    channelName: "Rozo Notifications",
    channelDescription: "Notifications for orders, payments, and transactions",
    importance: Notifications.AndroidImportance.DEFAULT, // IMPORTANCE_HIGH
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF6C44",
    badge: true,
  },

  // iOS notification configuration
  ios: {
    sound: "default",
    badge: true,
    critical: false,
    allowAnnouncements: true,
  },

  // General notification settings
  icon: "./assets/images/notification-icon.png",
  color: "#FF6C44",
  priority: "high" as const,

  // Notification categories for iOS
  categories: [
    {
      identifier: "ORDER_UPDATE",
      actions: [
        {
          identifier: "VIEW_ORDER",
          title: "View Order",
          options: {
            foreground: true,
          },
        },
      ],
    },
    {
      identifier: "PAYMENT_REMINDER",
      actions: [
        {
          identifier: "PAY_NOW",
          title: "Pay Now",
          options: {
            foreground: true,
          },
        },
        {
          identifier: "DISMISS",
          title: "Dismiss",
          options: {
            foreground: false,
          },
        },
      ],
    },
  ],
};

/**
 * Validate Firebase configuration (OPTIONAL - only needed for web)
 * For mobile, this validation is not necessary as native config files are used
 */
export const validateFirebaseConfig = (): boolean => {
  // For mobile (iOS/Android), always return true since native config files are used
  // For web, you'd want to validate the firebaseConfig object
  return true;

  // Uncomment below if you need web support:
  /*
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  for (const field of requiredFields) {
    if (!firebaseConfig[field as keyof typeof firebaseConfig]) {
      console.warn(`Firebase config missing: ${field}`);
      return false;
    }
  }

  return true;
  */
};
