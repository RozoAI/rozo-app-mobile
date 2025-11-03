import { RefreshCw } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { Button, ButtonIcon } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import { getShortId } from "@/libs/utils";
import { useWallet } from "@/providers";
import { useApp } from "@/providers/app.provider";
import { useMemo } from "react";

export function BalanceInfo({
  isLoading,
  refetch,
}: {
  isLoading: boolean;
  refetch: () => void;
}) {
  const { t } = useTranslation();
  const { primaryWallet } = useApp();
  const { balances } = useWallet();

  const usdcBalance = useMemo(() => {
    return (balances || []).find(
      (item) => (item.asset || "").toUpperCase() === "USDC"
    );
  }, [balances]);

  return (
    <VStack className="items-start" space="sm">
      <HStack space="sm" className="w-full items-center justify-between">
        <Text style={{ fontSize: 14 }}>{t("general.walletBalance")}</Text>

        <Button
          onPress={refetch}
          disabled={isLoading}
          size="xs"
          variant="link"
          className="rounded-full p-2"
        >
          <ButtonIcon as={RefreshCw} />
        </Button>
      </HStack>

      <View>
        {isLoading ? (
          <Spinner size="small" color="grey" />
        ) : (
          <HStack space="sm" className="items-end">
            <Heading size="4xl" className={`font-bold text-primary-600`}>
              {Number(usdcBalance?.display_values?.usdc || 0).toFixed(2) ??
                "0.00"}
            </Heading>

            <Text style={{ fontSize: 16, color: "#6B7280", marginTop: "auto" }}>
              {(usdcBalance?.asset ?? "USD").toUpperCase()}
            </Text>
          </HStack>
        )}
      </View>

      {primaryWallet && (
        <Text className="text-typography-400" size="sm">
          {getShortId(primaryWallet?.address ?? "", 6, 4)}
        </Text>
      )}
    </VStack>
  );
}
