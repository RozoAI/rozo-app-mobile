import { usePrivy } from "@privy-io/expo";
import { useLogin } from "@privy-io/expo/ui";
import { useRouter } from "expo-router";
import * as React from "react";
import { useEffect, useState } from "react";

import { FocusAwareStatusBar } from "@/components/focus-aware-status-bar";
import { LoadingScreen } from "@/components/loading-screen";
import LogoSvg from "@/components/svg/logo";
import LogoWhiteSvg from "@/components/svg/logo-white";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEVMWallet } from "@/hooks/use-evm-wallet";

/**
 * Login screen component with Privy authentication
 */
export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  // Privy
  const { isReady: ready, user } = usePrivy();
  const { login } = useLogin();
  const { hasEvmWallet, handleCreateWallet, isCreating } = useEVMWallet();

  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Redirect to home if user is authenticated
  useEffect(() => {
    if (user) {
      router.replace("/(main)");
    }
  }, [user, router]);

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const result = await login({
        loginMethods: ["email"],
        appearance: { logo: "https://rozo.app/logo.png" },
      });
      if (result) {
        if (!hasEvmWallet) {
          await handleCreateWallet();
        }
      }
    } catch {
      setIsAuthLoading(false);
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (!ready || isCreating) {
    return <LoadingScreen />;
  }

  return (
    <>
      <FocusAwareStatusBar />

      {/* Main content container with centered flex layout */}
      <Box className="flex-1 items-center justify-center bg-white px-6 dark:bg-neutral-900">
        {/* Logo and title section */}
        <Box className="mb-6 w-full items-center justify-center">
          {colorScheme === "dark" ? (
            <LogoWhiteSvg width={100} height={100} />
          ) : (
            <LogoSvg width={100} height={100} />
          )}

          <Text className="text-primary text-center text-3xl font-bold">
            Rozo App
          </Text>

          <Text className="mt-2 text-center text-base text-gray-600 dark:text-gray-300">
            Simple and efficient point of sale system
          </Text>
        </Box>

        {/* Button section */}
        <Button
          size="lg"
          variant="outline"
          action="primary"
          className="w-full flex-row items-center justify-center space-x-2 rounded-xl dark:border-neutral-700"
          onPress={handleSignIn}
          isDisabled={isAuthLoading}
        >
          {isAuthLoading && <ButtonSpinner />}
          <ButtonText>
            {isAuthLoading
              ? "Loading..."
              : `Login ${ready ? "with email" : "with wallet"}`}
          </ButtonText>
        </Button>
      </Box>
    </>
  );
}
