import { PrivyEmbeddedWalletAccount, usePrivy } from "@privy-io/expo";
import { useLogin } from "@privy-io/expo/ui";
import { useRouter } from "expo-router";
import * as React from "react";
import { useState } from "react";

import { FocusAwareStatusBar } from "@/components/focus-aware-status-bar";
import { LoadingScreen } from "@/components/loading-screen";
import LogoSvg from "@/components/svg/logo";
import LogoWhiteSvg from "@/components/svg/logo-white";
import { ThemedText } from "@/components/themed-text";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
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
  const { handleCreateWallet, isCreating } = useEVMWallet();

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isFreshLogin, setIsFreshLogin] = useState(false);

  // Redirect to home if user is authenticated
  // useEffect(() => {
  //   if (user && !isFreshLogin) {
  //     router.replace("/balance");
  //   }
  // }, [user, router]);

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const result = await login({
        loginMethods: ["email"],
        appearance: { logo: "https://rozo.app/logo.png" },
      });

      if (result) {
        setIsFreshLogin(true);
        const hasEmbeddedWallet =
          (result.user?.linked_accounts ?? []).filter(
            (account): account is PrivyEmbeddedWalletAccount =>
              account.type === "wallet" &&
              account.wallet_client_type === "privy" &&
              account.chain_type === "ethereum"
          ).length > 0;

        if (!hasEmbeddedWallet) {
          await handleCreateWallet();
        }

        setTimeout(() => {
          router.replace("/balance");
        }, 2000);
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

          <ThemedText type="title">ROZO</ThemedText>

          <ThemedText type="default" className="text-center mt-4">
            Simple and efficient point of sale system
          </ThemedText>
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
              : `Login ${ready ? "with Email" : ""}`}
          </ButtonText>
        </Button>
      </Box>
    </>
  );
}
