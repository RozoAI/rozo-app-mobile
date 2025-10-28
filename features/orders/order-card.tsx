import { format } from "date-fns";
import { ClockIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { getShortId, getStatusActionType } from "@/libs/utils";
import { type MerchantOrder } from "@/modules/api/schema/order";

interface OrderCardProps {
  order: MerchantOrder;
  onPress?: (order: MerchantOrder) => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onPress?.(order)}>
      <View
        className="items-start justify-between rounded-xl border border-background-300 bg-background-0"
        style={{
          paddingInline: 12,
          paddingVertical: 8,
        }}
      >
        {/* Main Order Info */}
        <View className="w-full flex-row items-start justify-between">
          <View className="flex flex-1 flex-col gap-1.5">
            <View className="flex-row items-center justify-between">
              <ThemedText
                className="text-sm font-medium"
                style={{
                  color: "gray",
                }}
              >
                #{order.number ?? getShortId(order.order_id, 6)}
              </ThemedText>

              <Badge
                size="md"
                variant="solid"
                action={getStatusActionType(order.status)}
              >
                <BadgeText>
                  {t(`order.status.${order.status.toLowerCase()}`)}
                </BadgeText>
              </Badge>
            </View>
            <ThemedText className="text-2xl font-bold" type="default">
              {order.display_amount} {order.display_currency}
            </ThemedText>
            {order.created_at && (
              <View className="flex-row items-center gap-1">
                <Icon as={ClockIcon} size="xs" />
                <ThemedText
                  type="default"
                  style={{
                    color: "gray",
                    fontSize: 12,
                  }}
                >
                  {format(new Date(order.created_at), "MMM dd yyyy, HH:mm")}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
