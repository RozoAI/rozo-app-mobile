import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";

export function BalanceHeader() {
  const { t } = useTranslation();

  return (
    <VStack className="flex flex-row items-start justify-between pt-6">
      <View>
        <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
          {t("balance.title")}
        </ThemedText>
        <ThemedText style={{ fontSize: 14, color: "#6B7280" }} type="default">
          {t("balance.description")}
        </ThemedText>
      </View>
    </VStack>
  );
}
