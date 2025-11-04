# Android Notification Permissions

Complete guide for Android notification permissions in the Rozo app.

---

## Overview

Android requires specific permissions in the `AndroidManifest.xml` for push notifications to work properly. These permissions are configured in `app.config.js` and automatically added to the manifest during the build process.

---

## Required Permissions

### 1. POST_NOTIFICATIONS (Android 13+)

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

**Purpose:** Required for apps targeting Android 13 (API level 33) or higher to display notifications.

**Why needed:** Starting with Android 13, apps must explicitly request this permission to show notifications to users.

**Runtime permission:** YES - App must request this at runtime (handled by our `NotificationProvider`)

---

### 2. RECEIVE_BOOT_COMPLETED

```xml
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
```

**Purpose:** Allows the app to restart notification listeners after device reboot.

**Why needed:** Ensures FCM can deliver notifications even after the device restarts.

**Runtime permission:** NO - Automatically granted at install time

---

### 3. VIBRATE

```xml
<uses-permission android:name="android.permission.VIBRATE"/>
```

**Purpose:** Allows notifications to vibrate the device.

**Why needed:** Provides haptic feedback when notifications arrive.

**Runtime permission:** NO - Automatically granted at install time

---

### 4. WAKE_LOCK

```xml
<uses-permission android:name="android.permission.WAKE_LOCK"/>
```

**Purpose:** Allows FCM to wake the device to process notifications.

**Why needed:** Ensures notifications are processed even when the device is in deep sleep.

**Runtime permission:** NO - Automatically granted at install time

---

## Firebase Messaging Permissions (Auto-added)

The `@react-native-firebase/messaging` library automatically adds these permissions:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE"/>
```

You don't need to manually add these - they're included by the Firebase SDK.

---

## Configuration in app.config.js

```javascript
// app.config.js
export default {
  expo: {
    android: {
      permissions: [
        "POST_NOTIFICATIONS",        // Android 13+ notifications
        "RECEIVE_BOOT_COMPLETED",    // Restart after reboot
        "VIBRATE",                   // Notification vibrations
        "WAKE_LOCK",                 // Wake device for FCM
      ],
    },
  },
};
```

---

## Permission Flow

### Android 12 and Below (API < 33)

```
1. App installed
   ↓
2. Permissions automatically granted
   ↓
3. Notifications work immediately
```

No runtime permission request needed!

### Android 13+ (API >= 33)

```
1. App installed
   ↓
2. POST_NOTIFICATIONS permission NOT granted
   ↓
3. App requests permission via NotificationProvider
   ↓
4. User sees system dialog: "Allow Rozo to send you notifications?"
   ↓
5. User grants → Notifications work
   User denies → Must enable in Settings
```

---

## Runtime Permission Request

Our `NotificationProvider` automatically handles the runtime permission request:

```typescript
// modules/notifications/provider.tsx
const initializeNotifications = async () => {
  // Check current permission status
  const currentStatus = await checkPermission();

  if (currentStatus !== 'granted') {
    // Request permission (shows system dialog on Android 13+)
    await handleRequestPermission();
  }

  // Rest of initialization...
};
```

**User experience:**
- Android 13+: System dialog appears
- Android 12-: No dialog, already granted

---

## Checking Permission Status

```typescript
import { useNotifications } from '@/modules/notifications';

function MyComponent() {
  const { permissionStatus } = useNotifications();

  // permissionStatus values:
  // - 'granted': User allowed notifications
  // - 'denied': User denied notifications
  // - 'undetermined': Not yet asked

  return <Text>Status: {permissionStatus}</Text>;
}
```

---

## Handling Permission Denial

If user denies the permission, they must enable it manually in Settings:

```typescript
import { Linking } from 'react-native';

// Open app settings
const openSettings = () => {
  Linking.openSettings();
};
```

**Settings path for user:**
```
Settings → Apps → Rozo → Notifications → Allow notifications
```

---

## Testing Permissions

### Test on Android 13+ (API 33+)

1. Build and install app
2. Open app
3. System dialog appears: "Allow Rozo to send you notifications?"
4. Test both flows:
   - **Allow**: Notifications should work
   - **Don't allow**: Check that app handles denial gracefully

### Test on Android 12 and below

1. Build and install app
2. Open app
3. No dialog appears (permission auto-granted)
4. Notifications should work immediately

---

## Verifying Permissions in Built APK

After building your app, verify permissions were added:

```bash
# Extract APK
unzip app-release.apk -d extracted

# View AndroidManifest.xml
cat extracted/AndroidManifest.xml | grep permission
```

You should see:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE"/>
```

---

## Troubleshooting

### Issue: POST_NOTIFICATIONS permission not in manifest

**Solution:**
1. Check `app.config.js` has `permissions` array in `android` section
2. Run `npx expo prebuild --clean --platform android`
3. Rebuild the app

### Issue: Permission dialog not showing on Android 13+

**Possible causes:**
1. Permission already granted/denied previously
2. App targeting API level < 33
3. Permission check not implemented

**Solution:**
1. Uninstall app completely
2. Check `android.compileSdkVersion` is 33+
3. Verify `NotificationProvider` is mounted

### Issue: Notifications not working after device reboot

**Solution:**
1. Verify `RECEIVE_BOOT_COMPLETED` permission is in manifest
2. Check FCM token is still valid after reboot
3. Re-register token if needed

---

## Best Practices

### 1. Request Permission at the Right Time

✅ **DO:**
- Request after user completes onboarding
- Explain the value before requesting
- Allow users to skip and ask later

❌ **DON'T:**
- Request immediately on app open
- Request without context
- Spam the user with multiple requests

### 2. Handle Denial Gracefully

```typescript
const { permissionStatus, requestPermission } = useNotifications();

if (permissionStatus === 'denied') {
  // Show helpful message
  return (
    <View>
      <Text>Enable notifications in Settings to receive order updates</Text>
      <Button onPress={openSettings}>Open Settings</Button>
    </View>
  );
}
```

### 3. Check Permission Before Sending

Always verify permission is granted before attempting to send notifications from your backend.

---

## Android Version Compatibility

| Android Version | API Level | POST_NOTIFICATIONS | Behavior |
|----------------|-----------|-------------------|----------|
| Android 12L and below | ≤ 32 | Not required | Permissions auto-granted |
| Android 13 (Tiramisu) | 33 | Required | Must request at runtime |
| Android 14 (Upside Down Cake) | 34 | Required | Must request at runtime |
| Android 15+ | 35+ | Required | Must request at runtime |

---

## EAS Build Considerations

When building with EAS, permissions are automatically included:

```json
// eas.json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

The `app.config.js` permissions array is processed during the EAS build, so no additional configuration needed.

---

## Reference

- **Android Docs**: [Runtime Permissions](https://developer.android.com/training/permissions/requesting)
- **Android 13 Changes**: [Notification Permission](https://developer.android.com/develop/ui/views/notifications/notification-permission)
- **Firebase**: [FCM Android Setup](https://firebase.google.com/docs/cloud-messaging/android/client)
- **Expo Docs**: [Android Permissions](https://docs.expo.dev/guides/permissions/)

---

**Last Updated**: 2025-01-31
