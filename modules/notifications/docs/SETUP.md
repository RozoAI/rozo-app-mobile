# Push Notifications - Setup Guide

Complete guide for setting up Firebase push notifications in your React Native app.

---

## Prerequisites

- ✅ React Native + Expo project
- ✅ Firebase account
- ✅ Apple Developer account (for iOS)
- ✅ Physical devices for testing (simulators don't support push notifications)

---

## Step 1: Firebase Project Setup

### 1.1 Create/Select Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select existing project: **rozo-dev** (or create new)

### 1.2 Add Android App

1. Click **"Add app"** → Select **Android**
2. **Android package name**: `com.rozoapp`
3. Click **"Register app"**
4. **Download** `google-services.json`
5. Place file in **project root**:
   ```
   /Users/yahya/Works/muggle/rozo-app-mobile/google-services.json
   ```

### 1.3 Add iOS App

1. Click **"Add app"** → Select **iOS**
2. **iOS bundle ID**: `com.rozoapp`
3. Click **"Register app"**
4. **Download** `GoogleService-Info.plist`
5. Place file in **project root**:
   ```
   /Users/yahya/Works/muggle/rozo-app-mobile/GoogleService-Info.plist
   ```

### 1.4 Enable Cloud Messaging

1. Firebase Console → **Project Settings** (gear icon)
2. Select **Cloud Messaging** tab
3. Click **"Enable"** on Cloud Messaging API (v1)

---

## Step 2: iOS APNs Setup

Required for iOS push notifications.

### 2.1 Generate APNs Key (Apple Developer)

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles** → **Keys**
3. Click **"+"** to create new key
4. **Name**: "Firebase Push Notifications"
5. **Enable**: ☑️ Apple Push Notifications service (APNs)
6. Click **"Continue"** → **"Register"**
7. **Download** `.p8` file (save securely - can't re-download!)
8. **Note**: Key ID (e.g., `ABC123XYZ`)
9. **Note**: Team ID (in top right of developer portal)

### 2.2 Upload APNs Key to Firebase

1. Firebase Console → **Project Settings** → **Cloud Messaging** tab
2. Scroll to **"Apple app configuration"**
3. Click **"Upload"** under APNs Authentication Key
4. Upload the `.p8` file downloaded above
5. Enter **Key ID** and **Team ID**
6. Click **"Upload"**

---

## Step 3: Backend Setup (Supabase)

### 3.1 Database Tables

Run this SQL migration in Supabase SQL Editor:

```sql
-- Create merchant_devices table
CREATE TABLE merchant_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
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

-- Create notification_settings table
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  payment_alerts BOOLEAN DEFAULT true,
  deposit_withdrawals BOOLEAN DEFAULT true,
  merchant_messages BOOLEAN DEFAULT true,
  system_alerts BOOLEAN DEFAULT true,
  sound BOOLEAN DEFAULT true,
  vibration BOOLEAN DEFAULT true,
  badge BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id)
);

-- Enable Row Level Security
ALTER TABLE merchant_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for merchant_devices
CREATE POLICY "Users can manage their own devices"
  ON merchant_devices FOR ALL
  USING (auth.uid() = merchant_id);

-- RLS Policies for notification_settings
CREATE POLICY "Users can manage their own settings"
  ON notification_settings FOR ALL
  USING (auth.uid() = merchant_id);
```

### 3.2 Deploy Edge Functions

See **[BACKEND.md](BACKEND.md)** for complete Supabase Edge Functions implementation.

Quick steps:
```bash
# Create functions
supabase functions new register-device
supabase functions new unregister-device
supabase functions new notification-settings
supabase functions new send-notification

# Deploy
supabase functions deploy register-device
supabase functions deploy unregister-device
supabase functions deploy notification-settings
supabase functions deploy send-notification
```

### 3.3 Add Firebase Service Account

1. Firebase Console → **Project Settings** → **Service Accounts**
2. Click **"Generate new private key"**
3. Download JSON file
4. Extract values:
   - `project_id`
   - `client_email`
   - `private_key`

5. Add to Supabase secrets:
```bash
supabase secrets set FIREBASE_PROJECT_ID=your-project-id
supabase secrets set FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

---

## Step 4: Build the App

### 4.1 Verify Configuration Files

Ensure these files exist in project root:
```
rozo-app-mobile/
├── google-services.json          ✅
├── GoogleService-Info.plist      ✅
```

### 4.2 Build Development Builds

```bash
# iOS
bun build:dev:ios

# Android
bun build:dev:android
```

**Note**: Push notifications require development builds. Expo Go doesn't support them.

### 4.3 Install on Physical Devices

- **iOS**: Install via TestFlight or direct device installation
- **Android**: Install APK directly on device

**Important**: Simulators/emulators don't support push notifications!

---

## Step 5: Test Notifications

### 5.1 Get FCM Token

Open the app and add this temporarily to any screen:

```typescript
import { useNotifications } from '@/modules/notifications';

function DebugScreen() {
  const { fcmToken, permissionStatus } = useNotifications();

  return (
    <View>
      <Text>Permission: {permissionStatus}</Text>
      <Text>Token: {fcmToken}</Text>
    </View>
  );
}
```

Copy the FCM token displayed.

### 5.2 Send Test Notification (Firebase Console)

1. Firebase Console → **Cloud Messaging**
2. Click **"Send your first message"**
3. **Notification title**: "Test Notification"
4. **Notification text**: "This is a test from Firebase"
5. Click **"Send test message"**
6. Paste your **FCM token**
7. Click **"Test"**

### 5.3 Verify Different States

Test in all three app states:

**Foreground** (app open):
- Should see notification banner in-app
- Check app logs for received notification

**Background** (app minimized):
- Minimize app (home button)
- Send notification
- Should appear in notification tray
- Tap notification → app opens

**Killed** (app closed):
- Close app completely (swipe up)
- Send notification
- Should appear in notification tray
- Tap notification → app opens to correct screen

---

## Step 6: Verify Integration

### 6.1 Check Token Registration

In your app, verify token is registered with backend:

```typescript
const { fcmToken, isTokenRegistered } = useNotifications();

console.log('Token:', fcmToken);
console.log('Registered:', isTokenRegistered); // Should be true after login
```

### 6.2 Test Settings UI

1. Open app → Settings
2. Find notification settings
3. Toggle preferences
4. Verify saved to backend

### 6.3 Test Deep Linking

Send notification with deep link:

```json
{
  "notification": {
    "title": "Order Update",
    "body": "Your order is ready"
  },
  "data": {
    "type": "ORDER_UPDATE",
    "orderId": "12345",
    "deepLink": "rozo://orders/12345"
  }
}
```

Tap notification → should navigate to orders screen.

---

## Troubleshooting

### Issue: "No FCM token"

**Solutions**:
- Verify you're on a physical device (not simulator)
- Check `google-services.json` and `GoogleService-Info.plist` are in root
- Rebuild the app
- Check notification permission is granted

### Issue: "Permission denied"

**Solutions**:
- Go to device Settings → Rozo → Notifications → Enable
- Request permission again in app

### Issue: "Notifications not received in background"

**iOS**:
- Verify APNs key uploaded to Firebase
- Check `UIBackgroundModes` includes `remote-notification` in `app.config.js`

**Android**:
- Verify notification channel is created (check logs)
- Check battery optimization isn't blocking app

### Issue: "Deep links not working"

**Solutions**:
- Verify `scheme: "rozo"` in `app.config.js`
- Check intent filters configured (Android)
- Ensure handler calls `router.push()` with correct path

---

## Production Checklist

Before releasing to production:

- [ ] Firebase project configured for production
- [ ] APNs production certificate uploaded (iOS)
- [ ] Backend endpoints deployed to production
- [ ] Tested on physical iOS device
- [ ] Tested on physical Android device
- [ ] Notification settings accessible to users
- [ ] Deep links tested and working
- [ ] Privacy policy updated with notification disclosure
- [ ] App Store/Play Store descriptions mention notifications

---

## Environment Variables

**Good News**: You DON'T need `.env` Firebase variables for mobile!

`@react-native-firebase/app` automatically reads from:
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)

**Only add `.env` variables if you want web support.**

See **[FAQ.md](FAQ.md)** for details.

---

## Next Steps

1. ✅ Complete this setup
2. 📱 Test on physical devices
3. 🔧 Implement backend (see [BACKEND.md](BACKEND.md))
4. 📚 Read usage guide (see [USAGE.md](USAGE.md))
5. 🚀 Deploy to production!

---

**Need Help?**
- Common issues: [FAQ.md](FAQ.md)
- Usage examples: [USAGE.md](USAGE.md)
- Backend setup: [BACKEND.md](BACKEND.md)
- API reference: [API.md](API.md)
