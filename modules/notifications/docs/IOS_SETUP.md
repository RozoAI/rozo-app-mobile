# iOS Push Notifications Setup

Complete guide for iOS push notifications configuration in the Rozo app.

---

## Overview

iOS push notifications require specific configurations in:
1. **Info.plist** (via `app.config.js`)
2. **Podfile** (for Firebase dependencies)
3. **Apple Developer Portal** (APNs certificates)

---

## Info.plist Configuration

All iOS notification settings are configured in `app.config.js` and automatically added to Info.plist during build.

### Current Configuration

```javascript
// app.config.js
export default {
  expo: {
    ios: {
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["remote-notification"],
        FirebaseAppDelegateProxyEnabled: false,
        UIUserNotificationSettings: {
          UNAuthorizationOptionAlert: true,
          UNAuthorizationOptionBadge: true,
          UNAuthorizationOptionSound: true,
        },
      },
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? "./GoogleService-Info.plist",
    },
  },
};
```

### What Each Setting Does

#### 1. UIBackgroundModes

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

**Purpose:** Allows the app to receive notifications when in background or killed state.

**Required:** YES - Without this, background notifications won't work.

**What it enables:**
- Receive notifications when app is backgrounded
- Receive notifications when app is killed
- Execute code when notification arrives (background fetch)

---

#### 2. FirebaseAppDelegateProxyEnabled

```xml
<key>FirebaseAppDelegateProxyEnabled</key>
<false/>
```

**Purpose:** Disables Firebase's automatic swizzling of AppDelegate methods.

**Why set to false:**
- Gives you full control over notification handling
- Prevents conflicts with Expo's notification handling
- Required for `@react-native-firebase/messaging` to work correctly with Expo

**Default:** true (we override to false)

---

#### 3. UIUserNotificationSettings

```xml
<key>UIUserNotificationSettings</key>
<dict>
  <key>UNAuthorizationOptionAlert</key>
  <true/>
  <key>UNAuthorizationOptionBadge</key>
  <true/>
  <key>UNAuthorizationOptionSound</key>
  <true/>
</dict>
```

**Purpose:** Declares the notification capabilities the app will request.

**Options:**
- **UNAuthorizationOptionAlert**: Show notification banners/alerts
- **UNAuthorizationOptionBadge**: Show badge count on app icon
- **UNAuthorizationOptionSound**: Play notification sounds

**All set to true** - Gives users full notification experience.

---

#### 4. ITSAppUsesNonExemptEncryption

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

**Purpose:** Declares whether app uses encryption (for App Store submission).

**Why false:**
- Standard HTTPS doesn't count as "non-exempt encryption"
- Simplifies App Store review process
- No export compliance documentation needed

---

## Podfile Configuration

### Required: use_modular_headers!

```ruby
# ios/Podfile
platform :ios, '15.1'

prepare_react_native_project!

# Enable modular headers for Firebase dependencies
use_modular_headers!

target 'Rozo' do
  use_expo_modules!
  # ... rest of configuration
end
```

### Why use_modular_headers! is Required

**Problem:**
- Firebase SDK uses Swift internally
- `FirebaseCoreInternal` depends on `GoogleUtilities`
- `GoogleUtilities` doesn't define modules by default
- Without modular headers, Swift can't import these dependencies

**Solution:**
- `use_modular_headers!` tells CocoaPods to generate module maps
- Allows Swift code to properly import Firebase dependencies
- Prevents build errors with Firebase

### Expo and use_modular_headers

**Does Expo handle this automatically?** NO

- Expo generates the basic Podfile from `app.config.js`
- But it doesn't add `use_modular_headers!` automatically
- You must manually add this line and commit the Podfile

**This is why we keep Podfile in git** (see `.gitignore`):
```gitignore
# Keep Podfile for use_modular_headers customization
!/ios/Podfile
```

---

## APNs Setup (Apple Developer Portal)

### Step 1: Generate APNs Authentication Key

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles** → **Keys**
3. Click **"+"** to create new key
4. Enter name: "Firebase Push Notifications" or "Rozo APNs Key"
5. Enable: ☑️ **Apple Push Notifications service (APNs)**
6. Click **"Continue"** → **"Register"**
7. Download `.p8` file (SAVE IT - you can't re-download!)
8. Note your **Key ID** (e.g., `ABC123XYZ`)
9. Note your **Team ID** (in top right corner)

### Step 2: Upload to Firebase

1. Firebase Console → **Project Settings** → **Cloud Messaging**
2. Scroll to **"Apple app configuration"**
3. Click **"Upload"** under **APNs Authentication Key**
4. Upload the `.p8` file downloaded in Step 1
5. Enter **Key ID** and **Team ID**
6. Click **"Upload"**

### Development vs Production APNs

**Important:** Firebase uses the SAME APNs key for both development and production.

The `.p8` authentication key works for both:
- ✅ Development builds (Xcode, EAS development)
- ✅ Production builds (App Store, TestFlight)

**No need for separate certificates!**

---

## Capabilities Configuration

### Required Capabilities

These are automatically configured by Expo + Firebase:

1. **Push Notifications**
   - Automatically enabled by `@react-native-firebase/messaging`
   - Allows app to receive remote notifications

2. **Background Modes**
   - Enabled via `UIBackgroundModes: ["remote-notification"]`
   - Allows app to process notifications in background

### Verify in Xcode

After running `npx expo prebuild -p ios`, verify in Xcode:

1. Open `ios/Rozo.xcworkspace`
2. Select **Rozo** target
3. Go to **Signing & Capabilities** tab
4. Check these capabilities are enabled:
   - ✅ Push Notifications
   - ✅ Background Modes → Remote notifications

---

## Permission Flow

### iOS Permission Request

Unlike Android 13+, iOS **always** requires runtime permission for notifications:

```
App opens → NotificationProvider initializes
           ↓
    requestPermission() called
           ↓
    System shows dialog: "Rozo Would Like to Send You Notifications"
           ↓
    User taps "Allow" or "Don't Allow"
           ↓
    If Allow → Notifications enabled ✅
    If Don't Allow → Must enable in Settings
```

### Permission Dialog

The system dialog shows three options:
1. **Allow** - Grant full notification permissions
2. **Don't Allow** - Deny notifications
3. **Options...** - Customize notification settings

### After Denial

If user denies permission, they must enable manually:

**Settings Path:**
```
Settings → Rozo → Notifications → Allow Notifications
```

**Open Settings programmatically:**
```typescript
import { Linking } from 'react-native';

Linking.openSettings();
```

---

## Testing on iOS

### Test on Physical Device

**Important:** Push notifications don't work on iOS Simulator!

1. **Build development build:**
   ```bash
   npx expo prebuild -p ios
   bun build:dev:ios
   ```

2. **Install on physical iPhone:**
   - Connect iPhone via USB
   - Run from Xcode, or
   - Use `eas build --platform ios --profile development`

3. **Grant permission:**
   - Open app
   - System dialog appears
   - Tap "Allow"

4. **Get FCM token:**
   - Check console logs
   - Copy the FCM token

5. **Send test notification:**
   - Firebase Console → Cloud Messaging → Send test message
   - Paste token
   - Send

### Test All App States

**Foreground (app open):**
- Notification appears as banner at top
- App's `onNotificationReceived` handler triggers

**Background (app minimized):**
- Notification appears in notification center
- Tap notification → App opens to foreground

**Killed (app closed):**
- Notification appears in notification center
- Tap notification → App launches and opens to correct screen

---

## Troubleshooting

### Issue: "Remote notifications not working"

**Check:**
1. ✅ Using physical device (not simulator)
2. ✅ APNs key uploaded to Firebase
3. ✅ `UIBackgroundModes` includes `remote-notification`
4. ✅ Permission granted in app
5. ✅ `GoogleService-Info.plist` in project root

**Verify in Xcode:**
- Open project → Signing & Capabilities
- Check "Push Notifications" capability is enabled
- Check "Background Modes" → "Remote notifications" is checked

### Issue: "Build fails with Firebase module error"

**Error message:**
```
The Swift pod 'FirebaseCoreInternal' depends upon 'GoogleUtilities',
which does not define modules.
```

**Solution:**
Add `use_modular_headers!` to `ios/Podfile`:
```ruby
prepare_react_native_project!

# Enable modular headers for Firebase dependencies
use_modular_headers!
```

Then:
```bash
cd ios
pod install
cd ..
```

### Issue: "Notifications work in development but not production"

**Possible causes:**
1. Using development APNs certificate instead of production
2. APNs key not uploaded to Firebase
3. Wrong bundle identifier in production build

**Solution:**
- Use APNs **authentication key** (.p8) - works for both dev and prod
- Verify bundle ID matches Firebase project
- Check Firebase logs for delivery failures

### Issue: "Background notifications not received"

**Check:**
1. ✅ `UIBackgroundModes` includes `"remote-notification"`
2. ✅ App has notification permission granted
3. ✅ Device not in Low Power Mode
4. ✅ Do Not Disturb is off

### Issue: "Badge count not updating"

**Solution:**
1. Verify `UNAuthorizationOptionBadge` is enabled
2. Check permission includes badge access
3. Manually update badge:
   ```typescript
   import { setBadgeCount } from '@/modules/notifications/services/firebase.service';

   setBadgeCount(5); // Set to 5
   setBadgeCount(0); // Clear badge
   ```

---

## Build Commands

### Local Development Build

```bash
# Prebuild (generate native iOS files)
npx expo prebuild --platform ios --clean

# Install pods
cd ios && pod install && cd ..

# Build
bun build:dev:ios
```

### EAS Build

```bash
# Development
eas build --platform ios --profile development

# Production
eas build --platform ios --profile production
```

---

## Info.plist Reference

After prebuild, the generated `ios/Rozo/Info.plist` should contain:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- App metadata -->
  <key>CFBundleDisplayName</key>
  <string>Rozo</string>

  <!-- Notification settings -->
  <key>UIBackgroundModes</key>
  <array>
    <string>remote-notification</string>
  </array>

  <key>FirebaseAppDelegateProxyEnabled</key>
  <false/>

  <key>UIUserNotificationSettings</key>
  <dict>
    <key>UNAuthorizationOptionAlert</key>
    <true/>
    <key>UNAuthorizationOptionBadge</key>
    <true/>
    <key>UNAuthorizationOptionSound</key>
    <true/>
  </dict>

  <key>ITSAppUsesNonExemptEncryption</key>
  <false/>

  <!-- Other app settings... -->
</dict>
</plist>
```

---

## Best Practices

### 1. Use APNs Authentication Key (.p8)

✅ **DO:** Use APNs authentication key
- Works for both development and production
- Never expires
- Can be revoked and regenerated

❌ **DON'T:** Use push certificates (.cer)
- Expire after 1 year
- Separate for development/production
- More complex setup

### 2. Request Permission at Right Time

✅ **DO:**
- Request after explaining value to user
- Request during onboarding flow
- Give option to skip

❌ **DON'T:**
- Request immediately on first launch
- Request without context
- Request repeatedly after denial

### 3. Handle Permission States

```typescript
const { permissionStatus } = useNotifications();

switch (permissionStatus) {
  case 'granted':
    // Show notifications enabled UI
    break;
  case 'denied':
    // Show "Enable in Settings" UI
    break;
  case 'undetermined':
    // Show "Enable Notifications" button
    break;
}
```

---

## Git Configuration

### Files to Commit

```gitignore
# Keep these iOS files
!/ios/Podfile                    # Contains use_modular_headers
!/ios/Podfile.properties.json    # Podfile configuration
!/ios/Rozo/Info.plist            # Generated but good to track
```

### Why Commit Podfile?

1. ✅ Preserves `use_modular_headers!` customization
2. ✅ Other developers get correct Firebase setup
3. ✅ EAS builds use your exact configuration
4. ✅ No manual edits needed after prebuild

---

## Reference

- **Apple Docs**: [User Notifications Framework](https://developer.apple.com/documentation/usernotifications)
- **APNs Guide**: [Setting Up APNs](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/establishing_a_token-based_connection_to_apns)
- **Firebase iOS Setup**: [FCM on iOS](https://firebase.google.com/docs/cloud-messaging/ios/client)
- **Expo Notifications**: [Expo Notifications Guide](https://docs.expo.dev/push-notifications/overview/)

---

**Last Updated**: 2025-01-31
