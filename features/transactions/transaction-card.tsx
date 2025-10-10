import { ClockIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { getShortId } from "@/libs/utils";
import { type Transaction } from "@/resources/schema/transaction";

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

const getStatusActionType = (
  isInFlow: Transaction["direction"]
): "success" | "error" | "warning" | "info" | "muted" => {
  const statusMap: Record<
    Transaction["direction"],
    "success" | "error" | "warning" | "info" | "muted"
  > = {
    IN: "success",
    OUT: "error",
  };

  return statusMap[isInFlow] || "muted";
};

export function TransactionCard({
  transaction,
  onPress,
}: TransactionCardProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(transaction)}
    >
      <View
        className="items-start justify-between rounded-xl border border-background-300 bg-background-0"
        style={{
          paddingInline: 12,
          paddingVertical: 8,
        }}
      >
        {/* Main Transaction Info */}
        <View className="w-full flex-row items-start justify-between">
          <View className="flex flex-1 flex-col gap-1.5">
            <View className="flex-row items-center justify-between">
              <ThemedText
                className="text-sm font-medium"
                style={{
                  color: "gray",
                }}
              >
                {transaction.hash
                  ? `#${getShortId(transaction.hash, 6)}`
                  : t("general.unknown")}{" "}
              </ThemedText>

              <Badge
                size="md"
                variant="solid"
                action={getStatusActionType(transaction.direction)}
              >
                <BadgeText>
                  {t(`transaction.direction.${transaction.direction}`)}
                </BadgeText>
              </Badge>
            </View>
            <ThemedText className="text-2xl font-bold" type="default">
              {transaction.value} {transaction.tokenSymbol}
            </ThemedText>
            {transaction.timestamp &&
              (() => {
                try {
                  const date = transaction.timestamp;
                  // if (isNaN(date.getTime())) {
                  //   return null;
                  // }
                  return (
                    <View className="flex-row items-center gap-1">
                      <Icon
                        as={ClockIcon}
                        className="text-gray-500 dark:text-gray-400"
                        size="xs"
                      />
                      <ThemedText
                        type="default"
                        style={{
                          color: "gray",
                          fontSize: 12,
                        }}
                      >
                        {date}
                      </ThemedText>
                    </View>
                  );
                } catch {
                  return null;
                }
              })()}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
