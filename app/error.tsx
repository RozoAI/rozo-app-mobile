import { Stack, useRouter } from "expo-router";
import React from "react";
import { Alert } from "react-native";

import { FocusAwareStatusBar } from "@/components/focus-aware-status-bar";
import { ThemedText } from "@/components/themed-text";
import { Button, ButtonText } from "@/components/ui/button";
import { View } from "@/components/ui/view";

type ErrorScreenProps = {
  message?: string;
};

/**
 * Error screen component displayed when application encounters an error
 */
export default function ErrorScreen({
  message = "Something went wrong",
}: ErrorScreenProps) {
  const router = useRouter();

  /**
   * Handle app reload attempt
   */
  function handleReload() {
    try {
      // Clear tokens but keep state
      router.replace("/login");
    } catch {
      Alert.alert(
        "Reload Failed",
        "Could not reload the application. Please try again."
      );
    }
  }

  return (
    <>
      <FocusAwareStatusBar />
      <Stack.Screen options={{ title: "Error", headerShown: false }} />
      <View className="flex-1 items-center justify-center bg-white p-6">
        <ThemedText className="mb-2 text-center text-2xl font-bold">
          Oops!
        </ThemedText>
        <ThemedText className="mb-8 text-center text-base text-gray-600">
          {message}
        </ThemedText>
        <View className="w-full gap-4">
          <Button
            onPress={handleReload}
            variant="solid"
            size="xs"
            action="primary"
            className="mb-3"
          >
            <ButtonText>Reload Application</ButtonText>
          </Button>
        </View>
      </View>
    </>
  );
}
