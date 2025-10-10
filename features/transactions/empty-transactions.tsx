import { ReceiptIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Icon } from "@/components/ui/icon";

export default function EmptyTransactionsState() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="mb-6 size-24 items-center justify-center rounded-full bg-background-0">
        <Icon as={ReceiptIcon} size="xl" />
      </View>

      <ThemedText className="mb-2 text-center text-xl font-bold" type="default">
        {t("transaction.noTransactionsFound")}
      </ThemedText>
    </View>
  );
}
