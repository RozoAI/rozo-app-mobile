#!/bin/bash

# EAS Build Hook: Fix Android Manifest merger conflicts
# This script adds tools:replace attributes to Firebase notification meta-data tags

MANIFEST_FILE="android/app/src/main/AndroidManifest.xml"

if [ ! -f "$MANIFEST_FILE" ]; then
  echo "❌ AndroidManifest.xml not found at $MANIFEST_FILE"
  exit 1
fi

echo "🔧 Fixing Android Manifest merger conflicts..."

# Add tools:replace for notification channel id
sed -i.bak 's|<meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="rozo-notifications"/>|<meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="rozo-notifications" tools:replace="android:value"/>|g' "$MANIFEST_FILE"

# Add tools:replace for notification color
sed -i.bak 's|<meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/notification_icon_color"/>|<meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/notification_icon_color" tools:replace="android:resource"/>|g' "$MANIFEST_FILE"

# Remove backup file
rm -f "$MANIFEST_FILE.bak"

# Verify the changes
if grep -q 'tools:replace' "$MANIFEST_FILE"; then
  echo "✅ Successfully added tools:replace attributes to AndroidManifest.xml"
else
  echo "⚠️  Warning: tools:replace attributes may not have been added"
fi
