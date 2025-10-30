# Push Notifications Module

Complete, modular push notification system for React Native + Expo using Firebase Cloud Messaging.

---

## Features

✅ Firebase Cloud Messaging (FCM) for iOS & Android
✅ Foreground, background, and killed app state support
✅ Automatic token management with backend sync
✅ Permission handling with user-friendly flows
✅ Deep linking support (`rozo://` scheme)
✅ Badge count management (iOS)
✅ Notification channels (Android)
✅ Local encrypted storage (MMKV)
✅ Full TypeScript support
✅ Modular and reusable architecture
✅ Settings UI component included
✅ Complements Pusher real-time updates

---

## Quick Start

### 1. Firebase Setup

```bash
# 1. Download config files from Firebase Console
# 2. Place in project root:
#    - google-services.json (Android)
#    - GoogleService-Info.plist (iOS)

# 3. Rebuild app
bun build:dev:ios
bun build:dev:android
```

**That's it!** No `.env` Firebase variables needed for mobile.

**Detailed instructions**: [docs/SETUP.md](docs/SETUP.md)

---

### 2. Basic Usage

```typescript
import { useNotifications } from '@/modules/notifications';

function MyScreen() {
  const {
    notifications,
    unreadCount,
    permissionStatus,
    requestPermission,
    onNotificationReceived,
    onNotificationTapped,
  } = useNotifications();

  // Request permission
  const handleEnable = async () => {
    const granted = await requestPermission();
    console.log('Permission granted:', granted);
  };

  // Listen for notifications
  useEffect(() => {
    const unsubscribe = onNotificationReceived((notification) => {
      console.log('New notification:', notification);
    });
    return unsubscribe;
  }, []);

  return (
    <View>
      <Text>Unread: {unreadCount}</Text>
      <Button onPress={handleEnable}>Enable Notifications</Button>
    </View>
  );
}
```

**More examples**: [docs/USAGE.md](docs/USAGE.md)

---

## Documentation

| Document | Description |
|----------|-------------|
| **[SETUP.md](docs/SETUP.md)** | Complete setup guide from scratch |
| **[USAGE.md](docs/USAGE.md)** | Usage examples and patterns |
| **[BACKEND.md](docs/BACKEND.md)** | Backend implementation (Supabase) |
| **[FAQ.md](docs/FAQ.md)** | Frequently asked questions |
| **[API.md](docs/API.md)** | Complete API reference |

---

## Architecture

### Module Structure

```
modules/notifications/
├── index.ts                    # Public API exports
├── provider.tsx                # NotificationProvider
├── hooks/                      # React hooks
│   ├── use-notifications.ts
│   ├── use-fcm-token.ts
│   └── use-notification-permissions.ts
├── services/                   # Business logic
│   ├── firebase.service.ts
│   ├── token.service.ts
│   ├── permission.service.ts
│   └── handler.service.ts
├── types/                      # TypeScript definitions
├── utils/                      # Helper functions
├── config/                     # Configuration
└── docs/                       # Documentation
```

### Integration

```
App
└── NotificationProvider
    ├── Automatic FCM token management
    ├── Permission state management
    ├── Notification storage (MMKV)
    ├── Event handlers
    └── Badge count updates
```

### Complements Pusher

- **Pusher**: Real-time updates when app is **open**
- **Firebase**: Notifications when app is **background/killed**

Both work together seamlessly!

---

## What You Need

### Required

✅ **Firebase project** with Cloud Messaging enabled
✅ **`google-services.json`** (Android) in project root
✅ **`GoogleService-Info.plist`** (iOS) in project root
✅ **APNs key** uploaded to Firebase (iOS)
✅ **Backend** to store tokens and send notifications

### NOT Required

❌ **`.env` Firebase variables** (only for web support)
❌ **Manual Firebase initialization** (native module handles it)

---

## Installation

Already installed! Dependencies:

```json
{
  "@react-native-firebase/app": "^23.5.0",
  "@react-native-firebase/messaging": "^23.5.0",
  "expo-notifications": "^0.32.12",
  "expo-device": "^8.0.9"
}
```

---

## Configuration

### 1. App Config

Already configured in `app.config.js`:

```javascript
{
  plugins: [
    "@react-native-firebase/app",
    "expo-notifications"
  ],
  ios: {
    infoPlist: {
      UIBackgroundModes: ["remote-notification"]
    },
    googleServicesFile: "./GoogleService-Info.plist"
  },
  android: {
    googleServicesFile: "./google-services.json"
  },
  scheme: "rozo"
}
```

### 2. Provider Integration

Already integrated in `app/_layout.tsx`:

```typescript
<AppProvider>
  <NotificationProvider>
    {children}
  </NotificationProvider>
</AppProvider>
```

---

## Testing

### Test from Firebase Console

1. Firebase Console → Cloud Messaging
2. Send test message
3. Enter your FCM token (from app logs)
4. Send notification

### Test on Device

**Must use physical device** (simulators don't support push):

```bash
# Build development build
bun build:dev:ios
bun build:dev:android

# Install on physical device
```

Test all three states:
- ✅ Foreground (app open)
- ✅ Background (app minimized)
- ✅ Killed (app closed)

---

## Backend Implementation

Use Supabase Edge Functions + Firebase Admin SDK.

**See**: [docs/BACKEND.md](docs/BACKEND.md) for complete implementation.

Quick overview:
- **4 Edge Functions**: register-device, unregister-device, notification-settings, send-notification
- **3 Database Tables**: merchant_devices, notification_settings, notification_logs
- **Auto-notifications**: Database triggers for order/deposit status changes

---

## API Overview

### Main Hook

```typescript
const {
  // State
  notifications: ReceivedNotification[];
  unreadCount: number;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  fcmToken: string | null;
  isTokenRegistered: boolean;

  // Methods
  requestPermission: () => Promise<boolean>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;

  // Handlers
  onNotificationReceived: (handler) => unsubscribe;
  onNotificationTapped: (handler) => unsubscribe;
} = useNotifications();
```

**Complete API**: [docs/API.md](docs/API.md)

---

## Notification Payload

Backend should send notifications in this format:

```json
{
  "notification": {
    "title": "Order Update",
    "body": "Your order #12345 is ready",
    "imageUrl": "https://..."
  },
  "data": {
    "type": "ORDER_UPDATE",
    "orderId": "12345",
    "status": "ready",
    "deepLink": "rozo://orders/12345",
    "action": "OPEN_ORDER",
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
```

---

## Settings UI

Pre-built settings component included:

```typescript
import { NotificationSettingsSheet } from '@/features/settings/notification-settings-sheet';

<Actionsheet>
  <NotificationSettingsSheet />
</Actionsheet>
```

Features:
- Permission management
- Notification type toggles
- Sound/vibration settings
- Direct link to system settings

---

## Best Practices

### Permission Timing
✅ Request at appropriate time (after user sees value)
❌ Don't request immediately on app launch

### Handler Cleanup
✅ Always return unsubscribe function
❌ Don't forget to cleanup listeners

### User Experience
✅ Show unread badge count
✅ Clear notifications when viewed
✅ Deep link to relevant content
❌ Don't spam notifications

---

## Troubleshooting

### Common Issues

**No FCM token**:
- Use physical device (not simulator)
- Verify config files in root
- Rebuild app

**Permission denied**:
- Guide user to device Settings
- Use `openSettings()` method

**Notifications not received**:
- Check APNs key uploaded (iOS)
- Verify Cloud Messaging enabled
- Check battery optimization (Android)

**See**: [docs/FAQ.md](docs/FAQ.md) for complete troubleshooting guide

---

## Reusability

This module is designed to be portable:

**To reuse in another project**:
1. Copy `modules/notifications/` folder
2. Follow [docs/SETUP.md](docs/SETUP.md)
3. Adjust types if needed
4. Done!

**For web support**:
- See migration guide in [docs/FAQ.md](docs/FAQ.md)
- Replace native modules with Firebase JS SDK
- Add service worker
- Use VAPID keys

---

## Support

- **Setup questions**: [docs/SETUP.md](docs/SETUP.md)
- **Usage questions**: [docs/USAGE.md](docs/USAGE.md)
- **Common issues**: [docs/FAQ.md](docs/FAQ.md)
- **Backend help**: [docs/BACKEND.md](docs/BACKEND.md)

---

## Status

✅ **Mobile app**: Complete and ready
✅ **Documentation**: Comprehensive guides
⏳ **Firebase setup**: Need to complete
⏳ **Backend**: Ready for implementation

---

## Quick Links

- 📖 [Setup Guide](docs/SETUP.md)
- 💻 [Usage Examples](docs/USAGE.md)
- 🔧 [Backend Implementation](docs/BACKEND.md)
- ❓ [FAQ](docs/FAQ.md)
- 📚 [API Reference](docs/API.md)

---

**Version**: 1.0.0
**Last Updated**: 2024-01-20
**License**: Part of Rozo App Mobile

---

**Ready to start?** Follow the [Setup Guide](docs/SETUP.md)! 🚀
