import { Redirect, Tabs } from "expo-router";
import React, { useEffect } from "react";

import { LoadingScreen } from "@/components/loading-screen";
import { ThemedText } from "@/components/themed-text";
import { Icon } from "@/components/ui/icon";
import { useEVMWallet } from "@/hooks/use-evm-wallet";
import { cn } from "@/libs/utils";
import { usePOSToggle } from "@/providers/app.provider";
import { AuthBoundary, usePrivy } from "@privy-io/expo";
import {
  Coins,
  Settings2Icon,
  ShoppingBagIcon,
  ShoppingCartIcon,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function TabLayout() {
  const theme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showPOS } = usePOSToggle();

  return (
    <AuthBoundary
      loading={<LoadingScreen />}
      unauthenticated={<Redirect href="/login" />}
    >
      <WalletHandler>
        <SafeAreaProvider>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                // height: 64,
                paddingTop: 6,
                paddingBottom: 10,
                marginBottom: insets.bottom,
                backgroundColor:
                  theme?.colorScheme === "dark" ? "#222430" : "#FFFFFF",
                elevation: 0,
                shadowOpacity: 0.5,
                borderTopColor:
                  theme?.colorScheme === "dark" ? "#222430" : "#E5E7EB",
              },
              tabBarActiveTintColor:
                theme?.colorScheme === "dark" ? "white" : "#0a0a0a",
              tabBarInactiveTintColor: "gray", // Gray-500
              tabBarIconStyle: {
                marginBottom: -4,
              },
              tabBarAllowFontScaling: true,
              animation: "fade" as const,
              tabBarLabelPosition: "below-icon",
              tabBarLabel: ({
                children,
                color,
                focused,
              }: {
                children: string;
                color: string;
                focused: boolean;
              }) => (
                <ThemedText
                  className={cn(
                    "text-sm font-medium",
                    focused && `font-semibold`
                  )}
                  style={{ color, fontSize: 12 }}
                >
                  {children}
                </ThemedText>
              ),
              sceneStyle: {
                paddingTop: insets.top,
                paddingLeft: insets.left + 16,
                paddingRight: insets.right + 16,
                backgroundColor:
                  theme?.colorScheme === "dark" ? "#141419" : "#f8f8ff",
              },
            }}
          >
            <Tabs.Screen
              name="balance"
              options={{
                title: t("balance.title"),
                tabBarIcon: ({ color }: any) => (
                  <Icon as={Coins} size="md" color={color} />
                ),
                tabBarButtonTestID: "balance-tab",
              }}
            />

            <Tabs.Screen
              name="pos"
              options={
                showPOS
                  ? {
                      title: t("pos.title"),
                      tabBarIcon: ({ color }: any) => (
                        <Icon as={ShoppingCartIcon} size="md" color={color} />
                      ),
                      tabBarButtonTestID: "pos-tab",
                    }
                  : {
                      href: null,
                    }
              }
            />

            <Tabs.Screen
              name="orders"
              options={{
                title: t("order.title"),
                tabBarIcon: ({ color }: any) => (
                  <Icon as={ShoppingBagIcon} size="md" color={color} />
                ),
                tabBarButtonTestID: "orders-tab",
              }}
            />

            <Tabs.Screen
              name="transactions"
              options={{
                href: null,
              }}
            />

            <Tabs.Screen
              name="settings"
              options={{
                title: t("settings.title"),
                tabBarIcon: ({ color }: any) => (
                  <Icon as={Settings2Icon} size="md" color={color} />
                ),
                tabBarButtonTestID: "settings-tab",
              }}
            />
          </Tabs>
        </SafeAreaProvider>
      </WalletHandler>
    </AuthBoundary>
  );
}

function WalletHandler({ children }: { children: React.ReactNode }) {
  const { handleCreateWallet, hasEvmWallet } = useEVMWallet();
  const { user } = usePrivy();

  useEffect(() => {
    if (user && !hasEvmWallet) {
      handleCreateWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasEvmWallet]);

  return children;
}
