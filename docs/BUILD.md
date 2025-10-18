# Build & Deployment Guide

This guide explains how to build and deploy the Rozo app for different environments.

## 📱 Local Development

### Start Development Server

```bash
bun start                 # Start Expo dev server
bun start:dev             # Start with dev client
bun start:clear           # Start with cleared cache
```

### Run on Devices/Simulators

```bash
bun android               # Run on Android emulator/device
bun ios                   # Run on iOS simulator/device
bun web                   # Run on web browser
```

### Prebuild (Generate Native Projects)

```bash
bun prebuild              # Generate android/ios folders
bun prebuild:clean        # Clean and regenerate
```

## 🛠️ Build Commands

### Development Builds (Internal Testing with Dev Client)

Development builds include the Expo dev client for debugging and testing.

```bash
# Android
bun build:dev:android     # Build for Android (dev client)

# iOS
bun build:dev:ios         # Build for iOS (dev client)

# Both platforms
bun build:dev:all         # Build for both platforms
```

### Preview Builds (Internal Testing)

Preview builds are for internal testing and QA. Android builds as APK for easy distribution.

```bash
# Android
bun build:preview:android # Build APK for Android testing

# iOS
bun build:preview:ios     # Build for iOS TestFlight (internal)

# Both platforms
bun build:preview:all     # Build for both platforms
```

### Production Builds (App Store Release)

Production builds are optimized for app store submission.

```bash
# Android
bun build:prod:android    # Build for Google Play Store

# iOS
bun build:prod:ios        # Build for Apple App Store

# Both platforms
bun build:prod:all        # Build for both platforms
```

## 📤 Submit to App Stores

After a successful production build, submit to app stores:

```bash
bun submit:android        # Submit to Google Play Store
bun submit:ios            # Submit to Apple App Store
bun submit:all            # Submit to both stores
```

## 🔄 Over-The-Air (OTA) Updates

Send updates to users without going through app stores:

```bash
# Preview/Staging updates
bun update:preview "Your update message"

# Production updates
bun update:prod "Your update message"
```

## 🏗️ Build Profiles Explained

### Development Profile

- **Purpose**: Testing with dev client, hot reloading
- **Distribution**: Internal only
- **Channel**: `development`
- **Environment**: `APP_ENV=development`

### Preview Profile

- **Purpose**: Internal testing, QA, stakeholder reviews
- **Distribution**: Internal (TestFlight/Internal track)
- **Channel**: `preview`
- **Android**: Builds as APK for easy sharing
- **Environment**: `APP_ENV=preview`

### Production Profile

- **Purpose**: Release to end users
- **Distribution**: App Stores
- **Channel**: `production`
- **Auto-increment**: Version codes automatically increment
- **Environment**: `APP_ENV=production`

## 📋 Version Management

The app version is managed in `package.json`. When you update the version:

```json
{
  "version": "1.0.5"
}
```

This automatically updates:

- `expo.version` → `"1.0.5"`
- `android.versionCode` → `10005` (calculated as `1*10000 + 0*100 + 5`)
- `ios.buildNumber` → `"10005"` (same as versionCode)

### Version Bump Examples

```bash
# Patch release (1.0.5 → 1.0.6)
npm version patch

# Minor release (1.0.5 → 1.1.0)
npm version minor

# Major release (1.0.5 → 2.0.0)
npm version major
```

## 🚀 Typical Workflows

### Workflow 1: Development Build for Testing

```bash
# 1. Make your changes
# 2. Build dev client (first time only)
bun build:dev:ios

# 3. Install on device, then start dev server
bun start:dev
```

### Workflow 2: Internal Testing (Preview)

```bash
# 1. Test locally
bun android
bun ios

# 2. Bump version if needed
npm version patch

# 3. Build preview
bun build:preview:all

# 4. Share the build link with testers
```

### Workflow 3: Production Release

```bash
# 1. Update version
npm version minor  # or patch/major

# 2. Build for production
bun build:prod:all

# 3. Wait for build to complete, then submit
bun submit:all

# 4. After approval, send OTA update for minor fixes
bun update:prod "Fixed critical bug"
```

## 🔍 Monitoring Builds

Check build status:

```bash
eas build:list                    # List all builds
eas build:view [build-id]         # View specific build
eas build:cancel [build-id]       # Cancel a build
```

## 🐛 Troubleshooting

### Build fails with native dependencies

```bash
bun prebuild:clean
bun build:preview:android
```

### Cache issues

```bash
bun start:clear
```

### Version conflicts

Check that `package.json` version is properly formatted (semver: X.Y.Z)

## 📚 Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
