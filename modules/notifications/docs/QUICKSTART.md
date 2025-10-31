# Push Notifications - Quick Start Guide

Get push notifications running in your React Native + Expo app in 5 simple steps.

---

## Prerequisites

- ✅ Physical iOS/Android device (simulators don't support push notifications)
- ✅ Firebase account
- ✅ Apple Developer account (for iOS APNs)

---

## Step 1: Firebase Setup

### 1.1 Download Config Files

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Add/select Android app → Download **`google-services.json`**
4. Add/select iOS app → Download **`GoogleService-Info.plist`**

### 1.2 Place Config Files

Place both files in **project root**:

```
rozo-app-mobile/
├── google-services.json          ← Android
├── GoogleService-Info.plist      ← iOS
```

**Important:** Must be in root directory, not in subdirectories!

### 1.3 Enable Cloud Messaging

1. Firebase Console → **Project Settings** → **Cloud Messaging**
2. Enable **Cloud Messaging API (v1)**

---

## Step 2: iOS APNs Setup

### 2.1 Generate APNs Key

1. [Apple Developer Portal](https://developer.apple.com/account) → **Keys**
2. Create new key → Enable **Apple Push Notifications service (APNs)**
3. Download `.p8` file (save it - can't re-download!)
4. Note your **Key ID** and **Team ID**

### 2.2 Upload to Firebase

1. Firebase Console → **Project Settings** → **Cloud Messaging**
2. Under **Apple app configuration** → Upload APNs key
3. Enter **Key ID** and **Team ID**

---

## Step 3: Build the App

### 3.1 Build Development Builds

```bash
# iOS
bun build:dev:ios

# Android
bun build:dev:android
```

**Note:** Push notifications require development builds (Expo Go doesn't support them).

### 3.2 Install on Physical Device

Install the built app on a physical device (not simulator/emulator).

---

## Step 4: Backend Setup

### 4.1 Set API URL

In `.env`:

```bash
EXPO_PUBLIC_API_URL=https://your-project.supabase.co
```

### 4.2 Run Database Migration

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE merchant_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(merchant_id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  fcm_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_name TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, merchant_id)
);

CREATE INDEX idx_merchant_devices_merchant_id ON merchant_devices(merchant_id);

ALTER TABLE merchant_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own devices"
ON merchant_devices FOR ALL
USING (merchant_id = auth.uid());
```

### 4.3 Deploy Edge Functions

See **[BACKEND.md](./BACKEND.md)** for complete Supabase Edge Function implementation.

Quick deploy:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy devices/register
supabase functions deploy devices/unregister
```

---

## Step 5: Test Notifications

### 5.1 Get FCM Token

Open your app and check the console logs after login:

```
✅ Notification system initialized successfully
📱 FCM Token: dXJfZmNtX3Rva2VuX2hlcmU...
Device token registered successfully
```

Copy the FCM token from logs.

### 5.2 Send Test Notification

1. Firebase Console → **Cloud Messaging** → **Send your first message**
2. Enter title and body
3. Click **"Send test message"**
4. Paste your FCM token
5. Click **"Test"**

### 5.3 Verify in All States

Test notifications in three app states:

- **Foreground** (app open): Should see banner in-app
- **Background** (app minimized): Should appear in notification tray
- **Killed** (app closed): Should appear in notification tray, open app when tapped

---

## How It Works

### Auto Registration Flow

The notification system is **fully automatic**:

```
1. App starts → NotificationProvider initializes
2. Requests notification permission
3. Gets FCM token from Firebase
4. User logs in → Auto registers token with backend
5. User logs out → Auto unregisters token
```

**No manual API calls needed!**

### Multi-Device Support

One merchant can use multiple devices:

- Login on iPhone → Token registered
- Login on Android tablet → Token registered
- Both devices receive notifications
- Logout from iPhone → Only that token removed

### What Gets Stored

**Local (MMKV encrypted storage):**
- FCM token
- Received notifications
- Unread count

**Backend (Supabase):**
- `merchant_devices` table with FCM tokens
- One row per device
- Automatic cleanup on logout

---

## Usage in Your App

### Get Notification State

```typescript
import { useNotifications } from '@/modules/notifications';

function MyComponent() {
  const {
    notifications,      // Array of notifications
    unreadCount,        // Number unread
    permissionStatus,   // 'granted' | 'denied' | 'undetermined'
    fcmToken,          // FCM token
  } = useNotifications();

  return <Text>Unread: {unreadCount}</Text>;
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
      console.log('📬 New:', notification.title);
    });

    // When user taps notification
    const unsubscribe2 = onNotificationTapped((notification) => {
      console.log('👆 Tapped:', notification.id);
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

### Mark as Read

```typescript
const { markAsRead, markAllAsRead } = useNotifications();

// Mark single notification
markAsRead('notification-id');

// Mark all as read
markAllAsRead();
```

---

## Troubleshooting

### "No FCM token" error

✅ Use physical device (not simulator)
✅ Verify `google-services.json` in project root
✅ Rebuild app after adding config files
✅ Check notification permission granted

### Notifications not received in background (iOS)

✅ Verify APNs key uploaded to Firebase
✅ Check `app.config.js` has `UIBackgroundModes: ['remote-notification']`

### Notifications not received in background (Android)

✅ Check battery optimization disabled for app
✅ Verify Google Play Services installed and updated

### Permission denied

Once denied, user must enable in device settings:
- **iOS**: Settings → Rozo → Notifications → Enable
- **Android**: Settings → Apps → Rozo → Notifications → Enable

---

## Production Checklist

Before releasing:

- [ ] Firebase project configured for production
- [ ] APNs production certificate uploaded (iOS)
- [ ] Backend edge functions deployed to production
- [ ] Tested on physical iOS device
- [ ] Tested on physical Android device
- [ ] Privacy policy mentions notifications
- [ ] App Store/Play Store descriptions mention notifications

---

## Next Steps

- **EAS Builds**: See [EAS.md](./EAS.md) for EAS build setup with Firebase
- **Backend Details**: See [BACKEND.md](./BACKEND.md) for complete backend implementation
- **Common Questions**: See [FAQ.md](./FAQ.md) for troubleshooting

---

**That's it! Your push notifications are now ready.** 🎉

The system handles everything automatically - token registration, notification delivery, and multi-device support.
