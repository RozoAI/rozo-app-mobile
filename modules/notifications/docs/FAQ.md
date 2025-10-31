# Push Notifications - FAQ

Frequently asked questions about implementing and using push notifications.

---

## Setup & Configuration

### Q: Do I need `.env` Firebase variables?

**A: NO, not for mobile apps!**

You're using `@react-native-firebase/app` which automatically reads from:
- ✅ `google-services.json` (Android)
- ✅ `GoogleService-Info.plist` (iOS)

**Only add `.env` variables if you want web support.**

The native config files contain everything Firebase needs.

---

### Q: Where do I place the Firebase config files?

**A: In your project root:**

```
/Users/yahya/Works/muggle/rozo-app-mobile/
├── google-services.json          ← Android
├── GoogleService-Info.plist      ← iOS
```

**Not in any subdirectory!** Must be at the root level.

---

### Q: Can I test notifications on simulator/emulator?

**A: NO**

Push notifications **do not work** on:
- ❌ iOS Simulator
- ❌ Android Emulator (unreliable at best)

**You must use physical devices:**
- ✅ iPhone (any model)
- ✅ Android phone (any model)

Build development build and install on physical device.

---

### Q: Do I need to rebuild after adding Firebase config files?

**A: YES**

After adding `google-services.json` or `GoogleService-Info.plist`:

```bash
bun build:dev:ios
bun build:dev:android
```

Native config files are included during build process, not at runtime.

---

## Permissions

### Q: Why is permission denied?

**Common causes:**

1. **User denied in app**: User clicked "Don't Allow"
   - **Solution**: Guide user to device Settings → Rozo → Notifications → Enable

2. **Device notifications disabled**: System-wide notifications off
   - **Solution**: Check device Settings → Notifications

3. **App notification settings**: App-specific notifications off
   - **Solution**: Device Settings → Rozo → Notifications

---

### Q: How do I request permission again after denial?

**A: You can't programmatically - must guide to Settings**

```typescript
import { Linking } from 'react-native';

// Open app settings
Linking.openSettings();
```

Once denied, only way to enable is through device settings.

---

### Q: When should I request notification permission?

**Best practices:**

✅ **DO**:
- After user completes onboarding
- When user creates first order
- After explaining value ("Get notified when orders are ready")
- Give option to skip

❌ **DON'T**:
- Immediately on app launch
- Before user understands the app
- Repeatedly after denial
- Without context

---

## Token Management

### Q: When is the FCM token registered with backend?

**A: Automatically on login**

Token registration happens automatically when:
1. User logs in
2. Permission is granted
3. FCM token is available

**No manual registration needed!** The `NotificationProvider` handles everything.

---

### Q: Does the FCM token change?

**A: Yes, occasionally**

Token can change when:
- App is reinstalled
- App data is cleared
- Token expires (rare)
- Device is reset

The module handles token refresh automatically and re-registers with backend.

---

### Q: How do I get my FCM token for testing?

**A: Check console logs after login**

```typescript
import { useNotifications } from '@/modules/notifications';

function MyComponent() {
  const { fcmToken } = useNotifications();
  console.log('FCM Token:', fcmToken);
  return null;
}
```

Copy the token from logs for testing in Firebase Console.

---

## Notification Behavior

### Q: Notifications work in foreground but not background?

**iOS Solutions:**
- ✅ Verify APNs key uploaded to Firebase
- ✅ Check `UIBackgroundModes` includes `remote-notification` in `app.config.js`
- ✅ Ensure using production APNs certificate for production builds

**Android Solutions:**
- ✅ Verify notification channel created (check logs)
- ✅ Check battery optimization isn't killing app
- ✅ Ensure Google Play Services installed and updated

---

### Q: Can I show notifications when app is in foreground?

**A: Yes, it's already implemented!**

The module automatically shows notifications in foreground using Expo's local notification system.

Firebase delivers the notification → Handler creates local notification → User sees banner.

---

### Q: Badge count not updating (iOS)

**Solutions:**

1. ✅ Verify badge permission granted
2. ✅ Check `setBadgeCount()` is called
3. ✅ Ensure app is authorized for badges (Settings → Rozo → Allow Badges)

The `NotificationProvider` automatically updates badge count when notifications are marked as read.

---

## Deep Linking

### Q: What deep link format should I use?

**A: Use `rozo://` scheme**

Examples:
- `rozo://orders` → Navigate to orders screen
- `rozo://orders/12345` → Open specific order
- `rozo://transactions` → Open transactions
- `rozo://settings` → Open settings

Send deep link in notification data:

```json
{
  "notification": {
    "title": "Order Ready",
    "body": "Your order #12345 is ready"
  },
  "data": {
    "type": "ORDER_UPDATE",
    "orderId": "12345",
    "deepLink": "rozo://orders/12345"
  }
}
```

The handler service automatically opens deep links when user taps notification.

---

### Q: Deep links not working?

**Check these:**

1. **Scheme configured**:
   ```javascript
   // app.config.js
   scheme: "rozo"
   ```

2. **Intent filters (Android)**:
   ```javascript
   // app.config.js
   android: {
     intentFilters: [{
       action: "VIEW",
       data: [{ scheme: "rozo" }]
     }]
   }
   ```

3. **Navigation handler** in `handler.service.ts` processes deep links correctly

---

## Backend

### Q: Do I need a backend?

**A: YES, for production**

Backend is required for:
- Storing device FCM tokens
- Sending notifications to users
- Managing multi-device support

See **[BACKEND.md](./BACKEND.md)** for Supabase implementation.

For testing only, you can use Firebase Console to send manual notifications.

---

### Q: Can I use a different backend (not Supabase)?

**A: Yes!**

The mobile app just needs two API endpoints:

**Register device:**
```
POST /your-api/devices/register
{
  "device_id": "unique-id",
  "fcm_token": "firebase-token",
  "platform": "ios" | "android",
  "device_name": "iPhone 14",
  "app_version": "1.0.0"
}
```

**Unregister device:**
```
DELETE /your-api/devices/unregister
{
  "device_id": "unique-id"
}
```

Update the endpoints in `token.service.ts`:

```typescript
await apiClient.post('/your-api/devices/register', payload);
await apiClient.delete('/your-api/devices/unregister', { data: payload });
```

---

## Troubleshooting

### Q: "No FCM token" error

**Solutions:**

1. ✅ Use physical device (not simulator)
2. ✅ Verify `google-services.json` in project root
3. ✅ Rebuild app after adding config files
4. ✅ Check notification permission granted
5. ✅ Check Firebase Cloud Messaging API enabled

---

### Q: "Firebase initialization failed" error

**Solutions:**

1. ✅ Verify `google-services.json` format is valid JSON
2. ✅ Ensure file is in project root
3. ✅ Check `app.config.js` includes `@react-native-firebase/app` plugin
4. ✅ Rebuild app completely
5. ✅ Clear cache: `bun start:clear`

---

### Q: Notifications received but not appearing

**iOS:**
- Check Do Not Disturb is off
- Verify app notification settings: Settings → Rozo → Notifications
- Check notification preview settings (Show Previews: Always/When Unlocked)

**Android:**
- Check notification channel settings
- Verify app notification settings: Settings → Apps → Rozo → Notifications
- Check Do Not Disturb is off
- Disable battery optimization for app

---

### Q: Getting duplicate notifications (multiple logs)

**A: This was a bug - should be fixed**

If you're still seeing duplicates:
1. Check `handler.service.ts` has singleton pattern (prevents duplicate listeners)
2. Verify `NotificationProvider` only mounts once
3. Check for React Fast Refresh issues in development

The system now has built-in duplicate prevention.

---

## Multi-Device Support

### Q: Can one merchant use multiple devices?

**A: Yes! This is supported by default.**

- Login on iPhone → Token registered
- Login on iPad → Token registered (separate entry)
- Login on Android → Token registered (separate entry)
- All devices receive notifications
- Logout from iPhone → Only iPhone token removed
- Other devices continue receiving notifications

The `merchant_devices` table stores one row per device using `UNIQUE(device_id, merchant_id)`.

---

### Q: What happens if I reinstall the app?

**A:**

1. New FCM token is generated
2. On login, new token is registered with backend
3. Old token (if exists for same device) is replaced via upsert
4. New token starts receiving notifications

The system automatically handles reinstalls.

---

## Platform-Specific

### Q: iOS notifications not working?

**Checklist:**

- [ ] Physical device (not simulator)
- [ ] APNs key uploaded to Firebase
- [ ] Production APNs for production builds
- [ ] `UIBackgroundModes: ["remote-notification"]` in `app.config.js`
- [ ] Notification permission granted
- [ ] `GoogleService-Info.plist` in root

---

### Q: Android notifications not working?

**Checklist:**

- [ ] Physical device (emulator unreliable)
- [ ] `google-services.json` in root
- [ ] Google Play Services installed
- [ ] Notification channel created (check logs)
- [ ] Battery optimization disabled for app
- [ ] Notification permission granted

---

## Architecture

### Q: Does this replace Pusher?

**A: NO, they complement each other!**

**Pusher**: Real-time updates when app is **open** (foreground)
**Firebase Notifications**: Alerts when app is **background/killed**

Both work together:
- App open → Pusher updates UI instantly
- App closed → Firebase notification alerts user

---

### Q: Can I use this module in other projects?

**A: YES! That's the goal.**

The module is self-contained:
- No hard dependencies on project-specific code
- Uses generic types and interfaces
- Documented API
- Platform-agnostic core

To reuse:
1. Copy `modules/notifications/` folder
2. Install dependencies
3. Follow [QUICKSTART.md](./QUICKSTART.md)
4. Adjust types if needed

---

## Additional Questions?

1. Check **[QUICKSTART.md](./QUICKSTART.md)** for setup instructions
2. Review **[BACKEND.md](./BACKEND.md)** for backend implementation
3. See **[EAS.md](./EAS.md)** for EAS build setup
4. Open an issue on GitHub
5. Contact support

---

**Last Updated**: 2025-01-31
