import { base, PrivyProvider } from "@privy-io/expo";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { ErrorBoundary } from "react-error-boundary";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { privyClient } from "@/libs/privy-client";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";

import { PrivyReady } from "@/components/privy-ready";
import { ThemedText } from "@/components/themed-text";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { AppProvider } from "@/providers/app.provider";
import { QueryProvider } from "@/providers/query.provider";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { PrivyElements } from "@privy-io/expo/ui";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback } from "react";
import { StyleSheet } from "react-native";

export const unstable_settings = {
  initialRouteName: "login",
};

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const onLayoutRootView = useCallback(async () => {
    // We hide the splash screen only when the app is ready AND fonts are loaded
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (
    !process.env.EXPO_PUBLIC_PRIVY_APP_ID ||
    !process.env.EXPO_PUBLIC_PRIVY_MOBILE_CLIENT_ID
  ) {
    return <Text>Missing Privy credentials</Text>;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <GluestackUIProvider mode="system">
        <GestureHandlerRootView
          style={styles.container}
          className={colorScheme ? colorScheme : "light"}
          onLayout={onLayoutRootView}
        >
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <QueryProvider>
              <PrivyProvider
                appId={process.env.EXPO_PUBLIC_PRIVY_APP_ID}
                clientId={process.env.EXPO_PUBLIC_PRIVY_MOBILE_CLIENT_ID}
                supportedChains={[base]}
                client={privyClient}
                config={{
                  embedded: {
                    ethereum: {
                      createOnLogin: "off",
                    },
                  },
                }}
              >
                <PrivyReady>
                  <AppProvider>
                    <KeyboardProvider>
                      <Stack>
                        <Stack.Screen
                          name="(main)"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="login"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="balance"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="pos"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="orders"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="transactions"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="settings"
                          options={{ headerShown: false }}
                        />
                      </Stack>
                    </KeyboardProvider>
                  </AppProvider>

                  <StatusBar style="auto" />
                  <PrivyElements
                    config={{
                      appearance: {
                        accentColor: "#0a0a0a",
                      },
                    }}
                  />
                </PrivyReady>
              </PrivyProvider>
            </QueryProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </GluestackUIProvider>
    </ErrorBoundary>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <ThemedText
        style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}
      >
        Something went wrong:
      </ThemedText>
      <ThemedText style={{ color: "red", textAlign: "center" }}>
        {error.message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
