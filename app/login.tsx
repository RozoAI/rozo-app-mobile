import { FocusAwareStatusBar } from "@/components/focus-aware-status-bar";
import { LoadingScreen } from "@/components/loading-screen";
import { ProtectedByPrivyLogo } from "@/components/protected-by-privy-logo";
import LogoSvg from "@/components/svg/logo";
import LogoWhiteSvg from "@/components/svg/logo-white";
import { ThemedText } from "@/components/themed-text";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { ActionSheetLanguageSwitcher } from "@/features/settings/select-language";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSelectedLanguage } from "@/hooks/use-selected-language";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/providers";
import { usePrivy, type PrivyEmbeddedWalletAccount } from "@privy-io/expo";
import { useLogin } from "@privy-io/expo/ui";
import * as Application from "expo-application";
import { useRouter } from "expo-router";
import * as React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Login screen component with Privy authentication
 */
export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  // Privy
  const { isReady: ready } = usePrivy();
  const { login } = useLogin();
  const { createWallet, isCreating } = useWallet();
  const { language, setLanguage } = useSelectedLanguage();
  const { t } = useTranslation();

  const { error: toastError } = useToast();

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  // const [isFreshLogin, setIsFreshLogin] = useState(false);

  // Redirect to home if user is authenticated
  // React.useEffect(() => {
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
        // setIsFreshLogin(true);
        const hasEmbeddedWallet =
          (result.user?.linked_accounts ?? []).filter(
            (account): account is PrivyEmbeddedWalletAccount =>
              account.type === "wallet" &&
              account.wallet_client_type === "privy" &&
              account.chain_type === "ethereum"
          ).length > 0;

        if (!hasEmbeddedWallet) {
          await createWallet("ethereum");
        }

        setTimeout(() => {
          router.replace("/balance");
        }, 2000);
      }
    } catch (error) {
      setIsAuthLoading(false);
      toastError(error instanceof Error ? error.message : "Failed to sign in");
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
            {t("login.description")}
          </ThemedText>
        </Box>

        {/* Button section */}
        <Button
          size="lg"
          action="primary"
          className="w-full flex-row items-center justify-center space-x-2 rounded-xl dark:border-neutral-700"
          onPress={handleSignIn}
          isDisabled={isAuthLoading}
        >
          {isAuthLoading && <ButtonSpinner />}
          <ButtonText>
            {isAuthLoading ? t("login.loading") : t("login.signIn")}
          </ButtonText>
        </Button>

        <HStack className="mt-10" space="md">
          <ActionSheetLanguageSwitcher
            className="w-min"
            updateApi={false}
            initialLanguage={language ?? "en"}
            onChange={(lang) => setLanguage(lang)}
            // trigger={(label) => (
            //   <ThemedText
            //     className="space-x-2 rounded-xl text-center text-sm border border-neutral-200 dark:border-neutral-700 p-1.5 px-3 max-w-64 m-auto"
            //     style={{ fontSize: 14 }}
            //   >
            //     {label}
            //   </ThemedText>
            // )}
          />
        </HStack>

        {ready && (
          <Box className="mt-3 w-full items-center justify-center">
            <ProtectedByPrivyLogo />
          </Box>
        )}

        {/* App version */}
        <Box className="mt-6 w-full items-center justify-center">
          <ThemedText style={{ fontSize: 14, color: "#747474" }}>
            Version {Application.nativeApplicationVersion}
          </ThemedText>
        </Box>
      </Box>
    </>
  );
}
