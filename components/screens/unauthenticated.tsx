import { FocusAwareStatusBar } from "@/components/focus-aware-status-bar";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Stack, useRouter } from "expo-router";
import React from "react";

export function UnauthenticatedScreen() {
  const router = useRouter();

  const handleLogin = () => {
    // You may want to call your logout logic here
    router.replace("/login");
  };

  return (
    <>
      <FocusAwareStatusBar />
      <Stack.Screen options={{ title: "Authenticated", headerShown: false }} />
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="mb-2 text-center text-2xl font-bold">
          You are authenticated.
        </Text>
        <Text className="mb-8 text-center text-base text-gray-600">
          This is a protected screen only visible to authenticated users.
        </Text>
        <Button
          onPress={handleLogin}
          variant="solid"
          size="xs"
          action="primary"
        >
          <ButtonText>Login</ButtonText>
        </Button>
      </View>
    </>
  );
}
