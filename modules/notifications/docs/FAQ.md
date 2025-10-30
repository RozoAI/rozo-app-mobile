# Push Notifications - FAQ

Frequently asked questions about implementing and using push notifications.

---

## Setup Questions

### Q: Do I need `.env` Firebase variables?

**A: NO, not for mobile apps!**

You're using `@react-native-firebase/app` which automatically reads from:
- ✅ `google-services.json` (Android)
- ✅ `GoogleService-Info.plist` (iOS)

**Only add `.env` variables if you want web support.**

The native config files contain everything Firebase needs. See detailed explanation below.

---

### Q: Why both `google-services.json` AND `.env`?

**A: You don't need both for mobile!**

**Two different worlds**:

1. **Native Code** (what you use):
   - `google-services.json` (Android)
   - `GoogleService-Info.plist` (iOS)
   - Used by native build tools and Firebase native SDKs
   - ✅ Automatically read by `@react-native-firebase/app`

2. **JavaScript Code** (for web):
   - `.env` Firebase variables
   - Used by Firebase JavaScript SDK
   - Only needed for React Native Web support

**For mobile**: Just place the config files in project root and rebuild. Done!

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

**You must use physical devices**:
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

## Permission Questions

### Q: Why is permission denied?

**Common causes**:

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
import { useNotificationPermissions } from '@/modules/notifications';

const { permissionStatus, openSettings } = useNotificationPermissions();

if (permissionStatus === 'denied') {
  // Show message
  alert('Please enable notifications in Settings');

  // Open device settings
  openSettings();
}
```

Once denied, only way to enable is through device settings.

---

### Q: When should I request notification permission?

**Best practices**:

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

## Token Questions

### Q: How do I get my FCM token?

**A: Use the `useNotifications` hook**

```typescript
import { useNotifications } from '@/modules/notifications';

function MyComponent() {
  const { fcmToken } = useNotifications();

  console.log('FCM Token:', fcmToken);

  return <Text>{fcmToken}</Text>;
}
```

Copy the token for testing in Firebase Console.

---

### Q: When is the FCM token registered with backend?

**A: Automatically on login**

Token registration happens automatically when:
1. User logs in
2. Permission is granted
3. FCM token is available

No manual registration needed!

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

## Notification Questions

### Q: Notifications work in foreground but not background?

**iOS Solutions**:
- ✅ Verify APNs key uploaded to Firebase
- ✅ Check `UIBackgroundModes` includes `remote-notification` in `app.config.js`
- ✅ Ensure using production APNs certificate for production builds

**Android Solutions**:
- ✅ Verify notification channel created (check logs)
- ✅ Check battery optimization isn't killing app
- ✅ Ensure Google Play Services installed and updated

---

### Q: How do I customize notification appearance?

**Android**:
```typescript
// In modules/notifications/config/firebase.config.ts
export const notificationConfig = {
  android: {
    channelName: 'My Custom Channel',
    importance: 4, // IMPORTANCE_HIGH
    sound: 'custom_sound',
    lightColor: '#FF0000',
  },
};
```

**iOS**:
Controlled by iOS system. Can customize:
- Sound
- Badge
- Alert style (Settings app)

---

### Q: Can I show notifications when app is in foreground?

**A: Yes, it's already implemented!**

The module automatically shows notifications in foreground. Customize in `firebase.service.ts`:

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,  // Show banner
    shouldPlaySound: true,  // Play sound
    shouldSetBadge: true,   // Update badge
  }),
});
```

---

## Deep Linking Questions

### Q: Deep links not working?

**Check these**:

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

3. **Handler implemented**:
   ```typescript
   onNotificationTapped((notification) => {
     if (notification.data.deepLink) {
       router.push(notification.data.deepLink);
     }
   });
   ```

---

### Q: What deep link format should I use?

**A: Use `rozo://` scheme**

Examples:
- `rozo://orders` → Navigate to orders screen
- `rozo://orders/12345` → Open specific order
- `rozo://transactions` → Open transactions
- `rozo://settings` → Open settings

Map these in your notification tap handler to actual routes.

---

## Backend Questions

### Q: Do I need a backend?

**A: YES, for production**

Backend is required for:
- Storing device FCM tokens
- Sending notifications to users
- Managing notification preferences
- Tracking notification delivery

See **[BACKEND.md](BACKEND.md)** for Supabase implementation.

---

### Q: Can I send notifications without a backend?

**A: Only for testing**

For testing, use Firebase Console to send manually.

For production, you need a backend to:
- Store user tokens
- Send notifications automatically (e.g., on order status change)
- Respect user notification preferences

---

### Q: How do I send notifications from my backend?

**A: Use Firebase Admin SDK**

```javascript
// Backend code (Node.js example)
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const message = {
  notification: {
    title: 'Order Update',
    body: 'Your order is ready'
  },
  data: {
    type: 'ORDER_UPDATE',
    orderId: '12345'
  },
  token: userFCMToken
};

await admin.messaging().send(message);
```

See **[BACKEND.md](BACKEND.md)** for complete Supabase implementation with Edge Functions.

---

## Troubleshooting

### Q: "No FCM token" error

**Solutions**:
1. ✅ Use physical device (not simulator)
2. ✅ Verify `google-services.json` in project root
3. ✅ Rebuild app after adding config files
4. ✅ Check notification permission granted
5. ✅ Check Firebase Cloud Messaging API enabled

---

### Q: "Firebase initialization failed" error

**Solutions**:
1. ✅ Verify `google-services.json` format is valid JSON
2. ✅ Ensure file is in project root
3. ✅ Check `app.config.js` includes Firebase plugin
4. ✅ Rebuild app completely
5. ✅ Clear cache: `bun start:clear`

---

### Q: Notifications received but not appearing

**iOS**:
- Check Do Not Disturb is off
- Verify app notification settings: Settings → Rozo → Notifications
- Check notification preview settings

**Android**:
- Check notification channel settings
- Verify app notification settings: Settings → Apps → Rozo → Notifications
- Check Do Not Disturb is off

---

### Q: Badge count not updating (iOS)

**Solutions**:
1. ✅ Verify badge permission granted
2. ✅ Check `setBadgeCount()` is called
3. ✅ Ensure app is authorized for badges (Settings → Rozo → Allow Badges)

```typescript
import { setBadgeCount } from '@/modules/notifications/services/firebase.service';

// Update badge
setBadgeCount(unreadCount);

// Clear badge
setBadgeCount(0);
```

---

## Architecture Questions

### Q: Does this replace Pusher?

**A: NO, they complement each other!**

**Pusher**: Real-time updates when app is **open** (foreground)
**Firebase Notifications**: Alerts when app is **background/killed**

Both work together:
- App open → Pusher updates UI instantly
- App closed → Firebase notification alerts user

---

### Q: Can I use this on web?

**A: Yes, with modifications**

Current implementation is for mobile (iOS/Android).

For web support:
1. Add `.env` Firebase variables
2. Use Firebase JS SDK instead of native module
3. Add service worker for background notifications
4. Use `firebase/messaging` package

The module is designed with reusability in mind. See `modules/notifications/docs/` for architecture.

---

### Q: Is this module reusable in other projects?

**A: YES! That's the goal.**

The module is self-contained:
- No hard dependencies on project-specific code
- Uses generic types and interfaces
- Documented API
- Platform-agnostic core

To reuse:
1. Copy `modules/notifications/` folder
2. Adjust types if needed
3. Follow setup guide
4. Done!

---

## Performance Questions

### Q: Do notifications impact battery life?

**A: Minimal impact**

Firebase Cloud Messaging is optimized:
- Uses device's system-level connection
- Batches messages efficiently
- Minimal battery impact

Users won't notice any battery drain from notifications.

---

### Q: How many notifications can I send?

**A: No hard limit**

Firebase allows unlimited notification sends. However:

**Best practices**:
- Don't spam users
- Respect user preferences
- Send only important notifications
- Allow users to customize frequency

---

### Q: Are notifications secure?

**A: YES**

- FCM tokens stored encrypted in MMKV
- Backend authentication required
- HTTPS-only communication
- Token cleanup on logout

---

## Platform-Specific Questions

### Q: iOS notifications not working?

**Checklist**:
- [ ] Physical device (not simulator)
- [ ] APNs key uploaded to Firebase
- [ ] Production APNs for production builds
- [ ] `UIBackgroundModes` in `app.config.js`
- [ ] Notification permission granted
- [ ] `GoogleService-Info.plist` in root

---

### Q: Android notifications not working?

**Checklist**:
- [ ] Physical device (emulator unreliable)
- [ ] `google-services.json` in root
- [ ] Google Play Services installed
- [ ] Notification channel created
- [ ] Battery optimization disabled
- [ ] Notification permission granted

---

## Still Have Questions?

1. Check **[SETUP.md](SETUP.md)** for setup instructions
2. Review **[USAGE.md](USAGE.md)** for code examples
3. See **[BACKEND.md](BACKEND.md)** for backend implementation
4. Open an issue on GitHub
5. Contact support

---

**Last Updated**: 2024-01-20
