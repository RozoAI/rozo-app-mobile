const packageJson = require("./package.json");

/**
 * Convert semantic version to version code
 * Example: 1.0.4 -> 10004
 * Format: MAJOR * 10000 + MINOR * 100 + PATCH
 */
const getVersionCode = (version) => {
  const [major, minor, patch] = version.split(".").map(Number);
  return major * 10000 + minor * 100 + patch;
};

/**
 * Get build number for iOS
 * Uses the same logic as versionCode for consistency
 */
const getBuildNumber = (version) => {
  return getVersionCode(version).toString();
};

/**
 * Package ID for the app
 * Used for bundleIdentifier and package in Android
 */
const packageId = "com.rozoapp";

module.exports = {
  expo: {
    name: "Rozo",
    description:
      "Rozo is a modern mobile application that combines a Point-of-Sale system with embedded wallets. It's designed to make it easy for merchants and users to handle payments, deposits, and withdrawals — all in one place.",
    slug: "rozo-app-mobile",
    version: packageJson.version,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "rozo",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: packageId,
      buildNumber: getBuildNumber(packageJson.version),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["remote-notification"],
        // Firebase notifications configuration
        FirebaseAppDelegateProxyEnabled: false, // Disable proxy to handle notifications manually
        // User notifications capabilities
        UIUserNotificationSettings: {
          UNAuthorizationOptionAlert: true,
          UNAuthorizationOptionBadge: true,
          UNAuthorizationOptionSound: true,
        },
      },
      googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? "./GoogleService-Info.plist",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#ffffff",
        foregroundImage: "./assets/images/playstore-icon.png",
        backgroundImage: "./assets/images/playstore-icon.png",
      },
      versionCode: getVersionCode(packageJson.version),
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: packageId,
      playStoreUrl: `https://play.google.com/store/apps/details?id=${packageId}`,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      permissions: [
        "POST_NOTIFICATIONS", // Android 13+ (API 33+) - required for push notifications
        "RECEIVE_BOOT_COMPLETED", // Restart notification listeners after device reboot
        "VIBRATE", // Allow notification vibrations
        "WAKE_LOCK", // Keep device awake for FCM
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "rozo",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-light.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            image: "./assets/images/splash-dark.png",
            backgroundColor: "#0a0a0a",
          },
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "The app needs access to your photos to allow you to upload merchant logo.",
          cameraPermission:
            "The app needs access to your camera to allow you to upload merchant logo.",
        },
      ],
      [
        "@react-native-firebase/app",
        {
          android: {
            googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
          },
          ios: {
            googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? "./GoogleService-Info.plist",
          },
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#FF6C44",
          defaultChannel: "rozo-notifications",
          sounds: [],
        },
      ],
      "expo-secure-store",
      "expo-web-browser",
      "expo-font",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    owner: "rozodev",
    extra: {
      router: {},
      eas: {
        projectId: "8b6aa76e-6766-4389-8241-26b3e141ee86",
      },
    },
  },
};
