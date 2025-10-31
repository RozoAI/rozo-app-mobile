# Push Notifications - EAS Build Setup

Complete guide for setting up Firebase push notifications with EAS (Expo Application Services) builds.

---

## Overview

This guide covers:
- ✅ Configuring Firebase for EAS builds
- ✅ Managing `google-services.json` and `GoogleService-Info.plist`
- ✅ Setting up EAS credentials and secrets
- ✅ Building and testing with EAS

---

## Prerequisites

- ✅ EAS CLI installed: `npm install -g eas-cli`
- ✅ EAS account: `eas login`
- ✅ Project linked: `eas init`
- ✅ Firebase project created with config files downloaded

---

## Step 1: Prepare Firebase Config Files

### 1.1 Download Config Files

From [Firebase Console](https://console.firebase.google.com/):

**Android:**
1. Project Settings → Your apps → Android app
2. Download **`google-services.json`**

**iOS:**
1. Project Settings → Your apps → iOS app
2. Download **`GoogleService-Info.plist`**

### 1.2 Place Files in Project Root

```
rozo-app-mobile/
├── google-services.json          ← Android config
├── GoogleService-Info.plist      ← iOS config
```

**Important:** These files must be in the project root (not in subdirectories).

### 1.3 Add to `.gitignore`

Add these lines to `.gitignore` if handling sensitive projects:

```gitignore
# Firebase config files (optional - depends on your security requirements)
google-services.json
GoogleService-Info.plist
```

**Note:** For this project, these files can be committed since they contain public configuration. However, if using different Firebase projects for dev/staging/prod, you may want to keep them out of git.

---

## Step 2: Configure `app.config.js`

Ensure your `app.config.js` includes the Firebase plugin and proper iOS background modes.

### 2.1 Verify Firebase Plugin

```javascript
// app.config.js
export default {
  // ... other config
  plugins: [
    "@react-native-firebase/app",
    // ... other plugins
  ],
  ios: {
    // ... other iOS config
    infoPlist: {
      UIBackgroundModes: ["remote-notification"],
    },
  },
  android: {
    // ... other Android config
    googleServicesFile: "./google-services.json",
  },
};
```

### 2.2 Add iOS Capabilities

Ensure iOS background notification capability:

```javascript
// app.config.js
export default {
  // ... other config
  ios: {
    // ... other iOS config
    infoPlist: {
      UIBackgroundModes: ["remote-notification"],
    },
    // Enable push notifications capability
    usesAppleSignIn: false, // Set based on your needs
  },
};
```

---

## Step 3: Configure `eas.json`

Set up your EAS build profiles for development, preview, and production.

### 3.1 Basic `eas.json` Configuration

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Debug",
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release",
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release",
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 3.2 Add Environment-Specific Config (Optional)

If using different Firebase projects for dev/staging/prod:

```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://dev-project.supabase.co"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://prod-project.supabase.co"
      }
    }
  }
}
```

---

## Step 4: iOS APNs Setup with EAS

### 4.1 Generate APNs Key (Apple Developer Portal)

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles** → **Keys**
3. Click **"+"** to create new key
4. Name: "Firebase Push Notifications" or "EAS Push Notifications"
5. Enable: ☑️ **Apple Push Notifications service (APNs)**
6. Click **"Continue"** → **"Register"**
7. Download `.p8` file (save securely - can't re-download!)
8. Note the **Key ID** (e.g., `ABC123XYZ`)
9. Note your **Team ID** (top right corner of portal)

### 4.2 Upload APNs Key to Firebase

1. Firebase Console → **Project Settings** → **Cloud Messaging**
2. Scroll to **"Apple app configuration"**
3. Click **"Upload"** under **APNs Authentication Key**
4. Upload the `.p8` file
5. Enter **Key ID** and **Team ID**
6. Click **"Upload"**

### 4.3 Configure EAS Credentials for iOS

EAS needs access to your Apple Developer account:

```bash
# Configure iOS credentials
eas credentials
```

Choose:
1. **iOS** platform
2. Select your build profile (development/production)
3. **Set up push notifications** → Follow prompts to upload APNs key

Alternatively, EAS can auto-manage credentials:

```bash
eas build --platform ios --profile development
```

EAS will prompt you to configure push notification credentials automatically.

---

## Step 5: Android Setup with EAS

### 5.1 Verify `google-services.json`

Ensure `google-services.json` is in project root and referenced in `app.config.js`:

```javascript
// app.config.js
export default {
  android: {
    googleServicesFile: "./google-services.json",
    // ... other config
  },
};
```

### 5.2 Configure Android Signing (for Production)

For production builds, configure signing credentials:

```bash
eas credentials
```

Choose:
1. **Android** platform
2. **Production** profile
3. Set up keystore (EAS can generate one or you can upload existing)

---

## Step 6: Build with EAS

### 6.1 Development Build (For Testing)

**iOS:**
```bash
eas build --platform ios --profile development
```

**Android:**
```bash
eas build --platform android --profile development
```

### 6.2 Install Development Build

**iOS:**
- Download IPA from EAS build page
- Install via TestFlight or direct device installation
- Or use: `eas build:run --platform ios`

**Android:**
- Download APK from EAS build page
- Install directly on device: `adb install app.apk`
- Or use: `eas build:run --platform android`

### 6.3 Production Build

**iOS:**
```bash
eas build --platform ios --profile production
```

**Android:**
```bash
eas build --platform android --profile production
```

---

## Step 7: Verify Push Notifications

### 7.1 Check Build Logs

After EAS build completes, check build logs for:

```
✅ Firebase plugin configured
✅ google-services.json processed (Android)
✅ GoogleService-Info.plist processed (iOS)
✅ Push notification capability enabled (iOS)
```

### 7.2 Test on Physical Device

1. Install the EAS build on a physical device
2. Open the app and login
3. Check console logs for:
   ```
   ✅ Notification system initialized successfully
   📱 FCM Token: [your-token]
   Device token registered successfully
   ```

4. Copy the FCM token from logs

### 7.3 Send Test Notification

1. Firebase Console → **Cloud Messaging** → **Send your first message**
2. Enter title and body
3. Click **"Send test message"**
4. Paste your FCM token
5. Click **"Test"**

### 7.4 Test All App States

- **Foreground** (app open): Notification should appear as banner
- **Background** (app minimized): Should appear in notification tray
- **Killed** (app closed): Should appear in notification tray, open app when tapped

---

## Step 8: Environment Variables in EAS

### 8.1 Set Secrets for EAS Builds

If you need to pass environment variables during build:

```bash
# Set secret
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-project.supabase.co

# List secrets
eas secret:list
```

### 8.2 Use in `eas.json`

Reference secrets in build profiles:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://prod-project.supabase.co"
      }
    }
  }
}
```

---

## Troubleshooting EAS Builds

### Issue: "Firebase not configured" in EAS build

**Solution:**
- Verify `google-services.json` and `GoogleService-Info.plist` are in project root
- Check `app.config.js` has `@react-native-firebase/app` plugin
- Ensure `googleServicesFile` path is correct in `app.config.js`

### Issue: iOS build fails with "Missing push notification capability"

**Solution:**
- Run `eas credentials` and configure push notification credentials
- Verify APNs key uploaded to Firebase
- Check `app.config.js` has `UIBackgroundModes: ["remote-notification"]`

### Issue: Android build fails with "google-services.json not found"

**Solution:**
- Verify file is in project root: `ls google-services.json`
- Check `app.config.js`: `googleServicesFile: "./google-services.json"`
- Ensure file is not in `.gitignore` if relying on repo

### Issue: Notifications work in development but not production build

**iOS:**
- Verify you're using **production** APNs certificate for production builds
- Check Firebase has both development and production APNs keys uploaded
- Ensure production build uses production provisioning profile

**Android:**
- Verify `google-services.json` matches the package name in production
- Check Firebase Cloud Messaging API is enabled
- Ensure Google Play Services is installed on device

### Issue: "Token registration failed" after EAS build

**Solution:**
- Check `EXPO_PUBLIC_API_URL` is set correctly
- Verify backend edge functions are deployed
- Check app can reach Supabase (network permissions)
- Review logs: `eas build:logs --platform ios`

---

## Best Practices for EAS + Firebase

### 1. Use Different Firebase Projects for Environments

Create separate Firebase projects:
- `rozo-dev` → Development builds
- `rozo-staging` → Preview builds
- `rozo-prod` → Production builds

### 2. Automate Config File Switching

Use EAS build hooks to swap config files:

```json
// eas.json
{
  "build": {
    "development": {
      "env": {
        "FIREBASE_ENV": "dev"
      }
    },
    "production": {
      "env": {
        "FIREBASE_ENV": "prod"
      }
    }
  }
}
```

Create a prebuild hook script to swap files based on `FIREBASE_ENV`.

### 3. Test Before Production

Always test notifications on:
- [ ] Development build from EAS
- [ ] Preview build from EAS
- [ ] Production build from EAS (use TestFlight/Internal Testing)

### 4. Monitor Build Logs

Check EAS build logs for warnings:
```bash
eas build:logs --platform ios
eas build:logs --platform android
```

### 5. Version Your Firebase Configs

If managing multiple environments, version your config files:

```
configs/
├── firebase/
│   ├── dev/
│   │   ├── google-services.json
│   │   └── GoogleService-Info.plist
│   └── prod/
│       ├── google-services.json
│       └── GoogleService-Info.plist
```

---

## Production Checklist

Before releasing production build with push notifications:

- [ ] Firebase production project configured
- [ ] APNs production key uploaded to Firebase
- [ ] Production `google-services.json` and `GoogleService-Info.plist` in place
- [ ] Backend edge functions deployed to production
- [ ] `EXPO_PUBLIC_API_URL` points to production backend
- [ ] EAS production build tested on physical iOS device
- [ ] EAS production build tested on physical Android device
- [ ] Notifications tested in foreground, background, and killed states
- [ ] Deep linking tested and working
- [ ] Privacy policy mentions push notifications
- [ ] App Store/Play Store descriptions mention notifications

---

## Useful EAS Commands

```bash
# Login to EAS
eas login

# Initialize EAS in project
eas init

# Configure credentials
eas credentials

# Build for iOS
eas build --platform ios --profile development
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile development
eas build --platform android --profile production

# Build for both platforms
eas build --platform all --profile production

# View build logs
eas build:logs

# List builds
eas build:list

# Submit to app stores
eas submit --platform ios
eas submit --platform android

# Run build on device
eas build:run --platform ios
eas build:run --platform android
```

---

## Additional Resources

- **EAS Build Documentation**: https://docs.expo.dev/build/introduction/
- **Firebase with Expo**: https://docs.expo.dev/guides/using-firebase/
- **EAS Credentials**: https://docs.expo.dev/app-signing/app-credentials/
- **APNs Setup**: https://firebase.google.com/docs/cloud-messaging/ios/certs

---

## Next Steps

- ✅ Complete EAS build setup
- 📱 Test on physical devices
- 🔧 Deploy backend (see [BACKEND.md](./BACKEND.md))
- 📚 Review quick start (see [QUICKSTART.md](./QUICKSTART.md))
- 🚀 Submit to app stores!

---

**Need Help?** Check [FAQ.md](./FAQ.md) for common issues or refer to [EAS Build troubleshooting](https://docs.expo.dev/build-reference/troubleshooting/).
