# Push Notifications Documentation

Complete documentation for Firebase push notifications in your React Native + Expo app.

---

## 📚 Documentation Guide

Choose the right guide for your needs:

### 🚀 [QUICKSTART.md](./QUICKSTART.md)
**Start here!** Complete setup guide in 5 simple steps.
- Firebase project setup
- iOS APNs configuration
- Backend deployment
- Testing notifications
- Basic usage examples

**Perfect for:** First-time setup, getting notifications working quickly

---

### 🔧 [BACKEND.md](./BACKEND.md)
Complete backend implementation using Supabase Edge Functions.
- Database schema (`merchant_devices` table)
- Edge functions (`devices/register`, `devices/unregister`)
- Multi-device support
- Deployment instructions
- Security & monitoring

**Perfect for:** Backend developers, deploying to production

---

### 📱 [EAS.md](./EAS.md)
EAS (Expo Application Services) build setup with Firebase.
- Firebase config file management
- EAS credentials setup
- APNs key configuration for EAS
- Building with EAS
- Environment variables
- Production checklist

**Perfect for:** Building with EAS, CI/CD pipelines, production deployments

---

### 📦 [PAYLOAD.md](./PAYLOAD.md)
Complete notification payload specification.
- Base FCM payload structure
- 6 notification types with examples
- 5 notification actions
- Backend implementation guide
- Testing payloads

**Perfect for:** Backend developers, integrating with notification system

---

### 🤖 [ANDROID_PERMISSIONS.md](./ANDROID_PERMISSIONS.md)
Android notification permissions setup and troubleshooting.
- Required permissions explained
- POST_NOTIFICATIONS (Android 13+)
- Permission flow and handling
- Testing and verification
- Troubleshooting guide

**Perfect for:** Understanding Android permissions, debugging permission issues

---

### 🍎 [IOS_SETUP.md](./IOS_SETUP.md)
iOS notification configuration and setup.
- Info.plist configuration via app.config.js
- Podfile setup (use_modular_headers)
- APNs authentication key setup
- Capabilities and permissions
- Testing and troubleshooting

**Perfect for:** iOS-specific setup, understanding Info.plist, fixing iOS issues

---

### 📝 [GIT_SETUP.md](./GIT_SETUP.md)
Managing native files in git for Expo projects.
- What files to commit (Podfile, AndroidManifest)
- .gitignore configuration explained
- Initial setup with git add -f
- Team collaboration workflow
- Troubleshooting git issues

**Perfect for:** Understanding git setup, onboarding new developers, fixing "file not tracked" issues

---

### ❓ [FAQ.md](./FAQ.md)
Frequently asked questions and troubleshooting.
- Setup & configuration questions
- Permission handling
- Token management
- Notification behavior
- Deep linking
- Platform-specific issues
- Multi-device support

**Perfect for:** Troubleshooting issues, understanding how things work

---

## Quick Links

**Just getting started?**
→ Read [QUICKSTART.md](./QUICKSTART.md)

**Building with EAS?**
→ Read [EAS.md](./EAS.md) after completing quick start

**Setting up backend?**
→ Read [BACKEND.md](./BACKEND.md)

**Integrating notification payloads?**
→ Read [PAYLOAD.md](./PAYLOAD.md)

**Having issues?**
→ Check [FAQ.md](./FAQ.md)

---

## What's Implemented

The notification system is **fully implemented** in the mobile app:

✅ **Auto-initialization** - Starts on app launch
✅ **Permission handling** - Requests and manages permissions
✅ **FCM token management** - Gets, stores, and refreshes tokens
✅ **Auto registration** - Registers token on login automatically
✅ **Auto unregistration** - Removes token on logout automatically
✅ **Multi-device support** - One merchant, multiple devices
✅ **Foreground notifications** - Shows notifications when app is open
✅ **Background notifications** - Delivers when app is minimized
✅ **Notification taps** - Handles deep linking and navigation
✅ **Local storage** - Persists notifications and state
✅ **Badge count** - Updates app badge (iOS)

**No additional mobile code needed!** Everything works automatically.

---

## Architecture Overview

```
┌─────────────────────┐
│   Mobile App        │
│  (React Native)     │
│                     │
│  NotificationProvider ──► Automatic token management
│       │                   Handles all notification logic
│       │
│       ▼
│  useNotifications() ──► Hook for accessing notification state
│                         Use in your components
└─────────────────────┘
         │
         │ Auto registers/unregisters on login/logout
         │
         ▼
┌─────────────────────┐
│  Supabase Backend   │
│                     │
│  Edge Functions:    │
│  • devices/register │
│  • devices/unregister│
│                     │
│  Database:          │
│  • merchant_devices │
└─────────────────────┘
         │
         │ Sends notifications via Firebase Admin SDK
         │
         ▼
┌─────────────────────┐
│  Firebase           │
│  Cloud Messaging    │
│                     │
│  Delivers to:       │
│  • iOS (APNs)       │
│  • Android (FCM)    │
└─────────────────────┘
```

---

## File Structure

```
modules/notifications/
├── docs/
│   ├── README.md           ← You are here
│   ├── QUICKSTART.md       ← Start here for setup
│   ├── BACKEND.md          ← Backend implementation
│   ├── EAS.md              ← EAS build setup
│   └── FAQ.md              ← Troubleshooting
├── services/
│   ├── firebase.service.ts  ← Firebase SDK wrapper
│   ├── token.service.ts     ← Token management & API calls
│   ├── handler.service.ts   ← Notification handlers
│   └── permission.service.ts← Permission management
├── utils/
│   └── notification-helpers.ts ← Helper utilities
├── types/
│   └── index.ts            ← TypeScript types
├── provider.tsx            ← React context provider
└── index.ts                ← Public exports
```

---

## Usage in Your App

### Basic Usage

```typescript
import { useNotifications } from '@/modules/notifications';

function MyComponent() {
  const {
    notifications,      // Array of notifications
    unreadCount,        // Number unread
    permissionStatus,   // Permission status
    markAsRead,         // Mark notification as read
    markAllAsRead,      // Mark all as read
  } = useNotifications();

  return (
    <View>
      <Text>Unread: {unreadCount}</Text>
      {notifications.map(notif => (
        <NotificationItem
          key={notif.id}
          notification={notif}
          onPress={() => markAsRead(notif.id)}
        />
      ))}
    </View>
  );
}
```

### Listen for Notifications

```typescript
import { useNotifications } from '@/modules/notifications';
import { useEffect } from 'react';

function NotificationListener() {
  const { onNotificationReceived, onNotificationTapped } = useNotifications();

  useEffect(() => {
    // When notification arrives
    const unsubscribe1 = onNotificationReceived((notification) => {
      console.log('📬 New notification:', notification.title);
    });

    // When user taps notification
    const unsubscribe2 = onNotificationTapped((notification) => {
      console.log('👆 Notification tapped');
      // Navigate to relevant screen
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, []);

  return null;
}
```

---

## Requirements

- React Native 0.81.5+
- Expo SDK 54+
- Firebase project with Cloud Messaging enabled
- Physical devices for testing (simulators don't support push notifications)
- Apple Developer account (for iOS APNs)

---

## Dependencies

Already installed in this project:

```json
{
  "@react-native-firebase/app": "^23.5.0",
  "@react-native-firebase/messaging": "^23.5.0",
  "expo-application": "~6.0.4",
  "expo-device": "~7.0.1",
  "expo-notifications": "~0.30.3",
  "react-native-mmkv": "^3.1.0"
}
```

---

## Getting Help

1. **Setup issues?** → [QUICKSTART.md](./QUICKSTART.md)
2. **EAS build problems?** → [EAS.md](./EAS.md)
3. **Backend questions?** → [BACKEND.md](./BACKEND.md)
4. **Troubleshooting?** → [FAQ.md](./FAQ.md)
5. **Still stuck?** → Open an issue on GitHub

---

## Next Steps

1. ✅ Read [QUICKSTART.md](./QUICKSTART.md) to set up notifications
2. 📱 Test on physical devices
3. 🔧 Deploy backend (see [BACKEND.md](./BACKEND.md))
4. 🚀 Build with EAS (see [EAS.md](./EAS.md))
5. 🎉 Launch to production!

---

**The notification system is production-ready and fully automatic.** 🎉

Everything works out of the box - just follow the quick start guide!
