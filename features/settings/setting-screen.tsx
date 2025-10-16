import * as Application from "expo-application";
import {
  ChevronRightIcon,
  InfoIcon,
  Languages,
  Palette,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native-gesture-handler";

import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Button, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { type ModeType } from "@/components/ui/gluestack-ui-provider";
import { Icon } from "@/components/ui/icon";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import { AccountSection } from "@/features/settings/account-section";
import { useSelectedLanguage } from "@/hooks/use-selected-language";
import { useApp } from "@/providers/app.provider";

import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { POSToggleSetting } from "./pos-toggle-setting";
import { ActionSheetCurrencySwitcher } from "./select-currency";
import { ActionSheetLanguageSwitcher } from "./select-language";
import { ActionSheetThemeSwitcher } from "./theme-switcher";
import { WalletAddressCard } from "./wallet-address-card";

export function SettingScreen() {
  const { logout } = useApp();
  const { t } = useTranslation();
  const { language } = useSelectedLanguage();

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1">
        <View className="mb-6">
          <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
            {t("settings.title")}
          </ThemedText>
          <ThemedText style={{ fontSize: 14, color: "#6B7280" }} type="default">
            {t("settings.description")}
          </ThemedText>
        </View>
        <VStack space="lg">
          <Card className="items-start justify-between rounded-xl border border-background-300 bg-background-0 px-4 py-2">
            <AccountSection />
          </Card>

          <VStack className="items-center justify-between rounded-xl border border-background-300 bg-background-0 px-4 pt-2 pb-0 dark:divide-[#2b2b2b]">
            <WalletAddressCard />
            <Alert action="info" variant="solid" style={{ marginInline: -1 }}>
              <AlertIcon as={InfoIcon} />
              <AlertText className="text-xs">
                {t("settings.gaslessInfo")}
              </AlertText>
            </Alert>
          </VStack>

          {/* List Settings */}
          <View className="flex flex-col items-center justify-between divide-y divide-gray-200 rounded-xl border border-background-300 bg-background-0 px-4 py-2 dark:divide-[#2b2b2b]">
            <POSToggleSetting />

            <Divider />

            <ActionSheetCurrencySwitcher />

            <Divider />

            <ActionSheetLanguageSwitcher
              initialLanguage={language}
              trigger={(lg) => (
                <View className="w-full flex-1 flex-row items-center justify-between gap-4 px-2 py-3">
                  <View className="flex-row items-center gap-2">
                    <Icon
                      as={Languages}
                      className="mb-auto mt-1 stroke-[#747474]"
                    />
                    <View className="flex-col items-start gap-1">
                      <Text size="md">{t("settings.language.title")}</Text>
                      <ThemedText style={{ fontSize: 14 }} type="default">
                        {lg}
                      </ThemedText>
                    </View>
                  </View>
                  <Icon as={ChevronRightIcon} />
                </View>
              )}
            />

            <Divider />

            <ActionSheetThemeSwitcher
              trigger={(selectedTheme: ModeType) => (
                <View className="w-full flex-1 flex-row items-center justify-between gap-4 px-2 py-3">
                  <View className="flex-row items-center gap-2">
                    <Icon
                      as={Palette}
                      className="mb-auto mt-1 stroke-[#747474]"
                    />
                    <View className="flex-col items-start gap-1">
                      <Text size="md">{t("settings.theme.title")}</Text>
                      <ThemedText style={{ fontSize: 14 }} type="default">
                        {t(`settings.theme.${selectedTheme}`)}
                      </ThemedText>
                    </View>
                  </View>
                  <Icon as={ChevronRightIcon} />
                </View>
              )}
            />
          </View>

          <Button
            variant="link"
            size="sm"
            action="negative"
            onPress={logout}
            className="rounded-xl"
          >
            <ButtonText>{t("settings.logout")}</ButtonText>
          </Button>

          {Application.nativeApplicationVersion && (
            <VStack space="sm">
              <Text className="text-center text-xs">
                {t("settings.version")} - {Application.nativeApplicationVersion}
              </Text>
            </VStack>
          )}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
