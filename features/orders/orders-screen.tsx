import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";

import { Spinner } from "@/components/ui/spinner";
import { VStack } from "@/components/ui/vstack";
import { useGetOrders } from "@/modules/api/api/merchant/orders";
import {
  type MerchantOrder,
  type MerchantOrderStatus,
} from "@/modules/api/schema/order";

import { ThemedText } from "@/components/themed-text";
import EmptyOrdersState from "./empty-orders";
import { FilterOrderActionSheet } from "./filter-order";
import { OrderCard } from "./order-card";
import {
  OrderDetailActionSheet,
  type OrderDetailActionSheetRef,
} from "./order-detail";

export function OrdersScreen() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [status, setStatus] = useState<MerchantOrderStatus>("COMPLETED");
  const [refreshing, setRefreshing] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);

  const { data, isFetching, refetch } = useGetOrders({
    variables: { status, force: forceRefresh },
  });

  useEffect(() => {
    setOrders(data ?? []);
    setRefreshing(false);
  }, [data]);

  const handleStatusChange = (status: MerchantOrderStatus) => {
    setStatus(status);
  };

  const orderDetailRef = useRef<OrderDetailActionSheetRef>(null);

  const handleOrderPress = (orderId: string) => {
    orderDetailRef.current?.openOrder(orderId);
  };
  const onRefresh = useCallback(() => {
    setForceRefresh(true);
    setRefreshing(true);
    refetch();

    setTimeout(() => {
      setForceRefresh(false);
    }, 500);
  }, [refetch]);

  return (
    
    <ScrollView className="py-6 flex-1">
      {/* Header */}
      <VStack className="flex flex-row items-start justify-between">
        <View className="mb-6">
          <ThemedText style={{ fontSize: 24, fontWeight: "bold" }}>
            {t("order.recentOrders")}
          </ThemedText>
          <ThemedText style={{ fontSize: 14, color: "#6B7280" }} type="default">
            {t("order.recentOrdersDesc")}
          </ThemedText>
        </View>

        <FilterOrderActionSheet onStatusChange={handleStatusChange} />
      </VStack>

      {isFetching && <Spinner size="small" />}

      {!isFetching && (
        <>
          {/* Orders List */}
          <View className="space-y-4">
            {orders.length === 0 ? (
              <EmptyOrdersState />
            ) : (
              <View className="space-y-4">
                <FlatList
                  data={orders}
                  keyExtractor={(item) => item.order_id}
                  renderItem={(order) => (
                    <OrderCard
                      key={order.item.order_id}
                      order={order.item}
                      onPress={(order) => handleOrderPress(order.order_id)}
                    />
                  )}
                  scrollEnabled={false}
                  contentContainerClassName="gap-4"
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                    />
                  }
                />
              </View>
            )}
          </View>
        </>
      )}

      <OrderDetailActionSheet ref={orderDetailRef} />
    </ScrollView>
    
  );
}
