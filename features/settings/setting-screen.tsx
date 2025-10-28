import { ThemedText } from "@/components/themed-text";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import { AccountSection } from "@/features/settings/account-section";
import { SettingGroup } from "@/features/settings/setting-group";
import { useSelectedLanguage } from "@/hooks/use-selected-language";
import { useApp } from "@/providers/app.provider";
import * as Application from "expo-application";
import { InfoIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { ScrollView } from "react-native";
import { PINSettings } from "./pin";
import { POSToggleSetting } from "./pos-toggle-setting";
import { ActionSheetCurrencySwitcher } from "./select-currency";
import { ActionSheetLanguageSwitcher } from "./select-language";
import { SwitchPrimaryWallet } from "./switch-primary-wallet";
import { ActionSheetThemeSwitcher } from "./theme-switcher";
import { WalletAddressCard } from "./wallet-address-card";

export function SettingScreen() {
  const { logout, preferredPrimaryChain } = useApp();
  const { t } = useTranslation();
  const { language } = useSelectedLanguage();

  return (
    <ScrollView className="py-6 flex-1">
      {/* Header */}
      <VStack className="flex flex-row items-start justify-between">
        <View className="mb-6">
          <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
            {t("settings.title")}
          </ThemedText>
          <ThemedText style={{ fontSize: 14, color: "#6B7280" }} type="default">
            {t("settings.description")}
          </ThemedText>
        </View>
      </VStack>

      <View className="flex-1 flex flex-col gap-4">
        {/* Account Section */}
        <Card className="rounded-xl border border-background-300 bg-background-0 px-4 py-2">
          <AccountSection />
        </Card>

        {/* Wallet Section */}
        <SettingGroup title={"Wallet"}>
          <WalletAddressCard />
          {preferredPrimaryChain === "ethereum" && (
            <Alert action="info" variant="solid" className="rounded-b-xl">
              <AlertIcon as={InfoIcon} />
              <AlertText className="text-xs" style={{ paddingRight: 20 }}>
                {t("settings.gaslessInfo")}
              </AlertText>
            </Alert>
          )}
          <SwitchPrimaryWallet />
        </SettingGroup>

        {/* Security Settings */}
        <SettingGroup title={t("settings.groups.security")}>
          <PINSettings />
        </SettingGroup>

        {/* App Preferences */}
        <SettingGroup title={t("settings.groups.preferences")}>
          <POSToggleSetting />
          <ActionSheetCurrencySwitcher />
          <ActionSheetLanguageSwitcher initialLanguage={language} />
          <ActionSheetThemeSwitcher />
        </SettingGroup>

        {/* Logout Button */}
        <Button
          variant="link"
          size="sm"
          action="negative"
          onPress={logout}
          className="rounded-xl"
        >
          <ButtonText>{t("settings.logout")}</ButtonText>
        </Button>

        {/* App Version */}
        {Application.nativeApplicationVersion && (
          <VStack space="sm" style={{ paddingBottom: 12 }}>
            <Text className="text-center text-xs text-gray-500 dark:text-gray-400">
              {t("settings.version")} - {Application.nativeApplicationVersion}
            </Text>
          </VStack>
        )}
      </View>
    </ScrollView>
  );
}
