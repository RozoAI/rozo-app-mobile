import { useToast } from "@/hooks/use-toast";
import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export function DiscoveryScreen() {
  const { error: toastError } = useToast();
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: "https://bridge.rozo.ai/bridge" }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn("WebView error:", nativeEvent);
          toastError("Failed to load discovery page");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 6,
  },
  webview: {
    flex: 1,
  },
});
