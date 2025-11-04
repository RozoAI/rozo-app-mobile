const { withAndroidManifest, AndroidConfig } = require("@expo/config-plugins");

// Compatible helper to add xmlns:tools manually (older config-plugins don't expose ensureToolsManifest)
function ensureToolsNamespace(manifest) {
  if (!manifest.manifest) throw new Error("Invalid AndroidManifest shape");
  if (!manifest.manifest.$) manifest.manifest.$ = {};
  if (!manifest.manifest.$["xmlns:android"]) {
    manifest.manifest.$["xmlns:android"] =
      "http://schemas.android.com/apk/res/android";
  }
  if (!manifest.manifest.$["xmlns:tools"]) {
    manifest.manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
  }
}

function getMainApplicationOrThrow(manifest) {
  const app = AndroidConfig.Manifest.getMainApplication(manifest);
  if (!app)
    throw new Error("Main <application> not found in AndroidManifest.xml");
  return app;
}

function upsertMeta(application, name, attrs) {
  if (!application["meta-data"]) application["meta-data"] = [];
  const existing = application["meta-data"].find(
    (m) => m.$["android:name"] === name
  );
  if (existing) {
    Object.assign(existing.$, attrs);
  } else {
    application["meta-data"].push({ $: { "android:name": name, ...attrs } });
  }
}

const withFcmMetaFix = (config, props = {}) => {
  const {
    channelId = "rozo-notifications",
    colorResource = "@color/notification_icon_color",
  } = props;

  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    // 1) Ensure xmlns:tools exists on <manifest>
    ensureToolsNamespace(manifest);

    // 2) Get <application>
    const app = getMainApplicationOrThrow(manifest);

    // 3) Force default channel id, instruct merger to replace value
    upsertMeta(
      app,
      "com.google.firebase.messaging.default_notification_channel_id",
      {
        "android:value": channelId,
        "tools:replace": "android:value",
      }
    );

    // 4) Force default notification color, instruct merger to replace resource
    upsertMeta(
      app,
      "com.google.firebase.messaging.default_notification_color",
      {
        "android:resource": colorResource,
        "tools:replace": "android:resource",
      }
    );

    return config;
  });
};

module.exports = withFcmMetaFix;
