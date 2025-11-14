import { FocusAwareStatusBar } from "@/components/focus-aware-status-bar";
import { LoadingScreen } from "@/components/loading-screen";
import { ProtectedByPrivyLogo } from "@/components/protected-by-privy-logo";
import LogoSvg from "@/components/svg/logo";
import LogoWhiteSvg from "@/components/svg/logo-white";
import { ThemedText } from "@/components/themed-text";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import {
  Input,
  InputField,
  InputIcon,
  InputSlot,
} from "@/components/ui/input";
import { Modal, ModalBackdrop, ModalBody, ModalContent } from "@/components/ui/modal";
import { VStack } from "@/components/ui/vstack";
import { ActionSheetLanguageSwitcher } from "@/features/settings/select-language";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSelectedLanguage } from "@/hooks/use-selected-language";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/libs/storage";
import { useWallet } from "@/providers";
import { usePrivy, type PrivyEmbeddedWalletAccount } from "@privy-io/expo";
import { useLogin } from "@privy-io/expo/ui";
import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { CheckCircle, XCircle } from "lucide-react-native";
import * as React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Platform } from "react-native";

const VALID_INVITATION_CODE = "ROZO";
const INVITATION_VALIDATED_KEY = "invitation.validated";

/**
 * Login screen with invitation modal gate
 */
export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  // Privy
  const { isReady: ready, user } = usePrivy();
  const { login } = useLogin();
  const { createWallet, isCreating } = useWallet();
  const { language, setLanguage } = useSelectedLanguage();
  const { t } = useTranslation();

  const { error: toastError } = useToast();

  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Invitation modal state
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationState, setValidationState] = useState<
    "idle" | "valid" | "invalid"
  >("idle");

  // Check if invitation was already validated
  React.useEffect(() => {
    const isValidated = storage.getBoolean(INVITATION_VALIDATED_KEY);
    const isIOS = Platform.OS === "ios";

    // If user is already authenticated, they've passed the gate
    if (user) {
      if (!isValidated) {
        storage.set(INVITATION_VALIDATED_KEY, true);
      }
      router.replace("/balance");
      return;
    }

    // Skip invitation modal for iOS
    if (isIOS) {
      storage.set(INVITATION_VALIDATED_KEY, true);
      return;
    }

    // If not validated and not authenticated, show invitation modal
    if (!isValidated) {
      setShowInvitationModal(true);
    }
  }, [user, router]);

  const handleValidateInvitation = async () => {
    if (!invitationCode.trim()) {
      toastError(t("invitation.codeRequired"));
      return;
    }

    setIsValidating(true);
    setValidationState("idle");

    // Simulate validation delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    const isValid = invitationCode === VALID_INVITATION_CODE;

    if (isValid) {
      setValidationState("valid");
      // toastSuccess(t("invitation.validCode"));

      // Save validation state
      storage.set(INVITATION_VALIDATED_KEY, true);

      // Close modal after short delay
      setTimeout(() => {
        setShowInvitationModal(false);
        setIsValidating(false);
      }, 500);
    } else {
      setValidationState("invalid");
      toastError(t("invitation.invalidCode"));
      setIsValidating(false);
    }
  };

  const handleJoinWaitlist = async () => {
    try {
      const url = "https://rozo.ai/";
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        toastError("Cannot open URL");
      }
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : "Failed to open waitlist"
      );
    }
  };

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const result = await login({
        loginMethods: ["email"],
        appearance: { logo: "https://rozo.app/logo.png" },
      });

      if (result) {
        const hasEmbeddedWallet =
          (result.user?.linked_accounts ?? []).filter(
            (account): account is PrivyEmbeddedWalletAccount =>
              account.type === "wallet" &&
              account.wallet_client_type === "privy" &&
              account.chain_type === "ethereum"
          ).length > 0;

        if (!hasEmbeddedWallet) {
          await createWallet("USDC_BASE");
        }

        // Mark invitation as validated for authenticated users
        storage.set(INVITATION_VALIDATED_KEY, true);

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

      {/* Invitation Modal */}
      <Modal isOpen={showInvitationModal} size="lg">
        <ModalBackdrop />
        <ModalContent className="bg-white dark:bg-neutral-900 rounded-2xl p-0">
          <ModalBody className="p-8 m-0">
            <VStack space="lg" className="items-center w-full">
              {/* Logo */}
              {colorScheme === "dark" ? (
                <LogoWhiteSvg width={80} height={80} />
              ) : (
                <LogoSvg width={80} height={80} />
              )}

              {/* Title and subtitle */}
              <VStack space="sm" className="items-center">
                <ThemedText type="title" className="text-center">
                  {t("invitation.title")}
                </ThemedText>
                <ThemedText type="default" className="text-center">
                  {t("invitation.subtitle")}
                </ThemedText>
              </VStack>

              {/* Input field */}
              <Input
                variant="outline"
                size="lg"
                className="w-full rounded-xl"
                isDisabled={isValidating}
                isInvalid={validationState === "invalid"}
              >
                <InputField
                  placeholder={t("invitation.placeholder")}
                  value={invitationCode}
                  onChangeText={setInvitationCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={10}
                  onSubmitEditing={handleValidateInvitation}
                  returnKeyType="done"
                />
                {validationState === "valid" && (
                  <InputSlot className="pr-3">
                    <InputIcon
                      as={CheckCircle}
                      className="text-success-500"
                      size="lg"
                    />
                  </InputSlot>
                )}
                {validationState === "invalid" && (
                  <InputSlot className="pr-3">
                    <InputIcon
                      as={XCircle}
                      className="text-error-500"
                      size="lg"
                    />
                  </InputSlot>
                )}
              </Input>

              {/* Continue button */}
              <Button
                size="lg"
                action="primary"
                className="w-full rounded-xl"
                onPress={handleValidateInvitation}
                isDisabled={isValidating || !invitationCode.trim()}
              >
                <ButtonText>
                  {isValidating ? t("general.loading") : t("invitation.continue")}
                </ButtonText>
              </Button>

              {/* Divider */}
              <HStack space="md" className="w-full items-center justify-center">
                <Box className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                <ThemedText
                  style={{ fontSize: 14, color: "#747474" }}
                  className="px-2"
                >
                  {t("invitation.or")}
                </ThemedText>
                <Box className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
              </HStack>

              {/* Join waitlist button */}
              <Button
                size="lg"
                action="primary"
                variant="outline"
                className="w-full rounded-xl"
                onPress={handleJoinWaitlist}
                isDisabled={isValidating}
              >
                <ButtonText>{t("invitation.joinWaitlist")}</ButtonText>
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Main login content */}
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
          isDisabled={isAuthLoading || showInvitationModal}
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
