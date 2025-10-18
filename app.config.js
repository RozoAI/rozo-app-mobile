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
    scheme: "rozoappmobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: packageId,
      buildNumber: getBuildNumber(packageJson.version),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
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
