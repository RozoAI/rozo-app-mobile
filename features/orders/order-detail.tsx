import { format } from "date-fns";
import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-qr-code";

import CheckSvg from "@/components/svg/check";
import { ThemedText } from "@/components/themed-text";
import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import { usePaymentStatus } from "@/hooks/use-payment-status";
import { getShortId, getStatusActionType } from "@/libs/utils";
import { useGetOrder } from "@/modules/api/api/merchant/orders";
import { useApp } from "@/providers/app.provider";

export type OrderDetailActionSheetRef = {
  openOrder: (orderId: string) => void;
};

type OrderDetailActionSheetProps = {
  onClose?: () => void;
};

export const OrderDetailActionSheet = forwardRef<
  OrderDetailActionSheetRef,
  OrderDetailActionSheetProps
>(({ onClose }, ref) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { merchant } = useApp();

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const {
    data: order,
    isLoading,
    refetch,
  } = useGetOrder({
    variables: { id: orderId ?? "" },
    enabled: !!orderId,
  });

  const { status } = usePaymentStatus(
    merchant?.merchant_id,
    orderId ?? undefined
  );

  // Generate QR code when action sheet opens and order is pending
  useEffect(() => {
    if (isOpen && order && order.status === "PENDING" && order.qrcode) {
      // End of Selection
      setQrCodeUrl(order.qrcode);
    } else {
      setQrCodeUrl(null);
    }
  }, [isOpen, order]);

  useImperativeHandle(ref, () => ({
    openOrder: (id: string) => {
      setOrderId(id);
      setIsOpen(true);
    },
  }));

  useEffect(() => {
    if (status === "completed") {
      // Show success view after a brief delay
      refetch();
    }
  }, [status, refetch]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setOrderId(null);
    onClose?.();
  }, [onClose]);

  /* useEffect(() => {
      if (order?.status === 'COMPLETED' && status === 'completed') {
        speakPaymentStatus({
          amount: Number(order?.display_amount ?? 0),
          currency: currencies[order?.display_currency ?? 'USD'].voice,
          language,
        });
      }
    }, [order, status]); */

  if (!orderId) return null;

  return (
    <Actionsheet isOpen={isOpen} onClose={handleClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={{ paddingBottom: insets.bottom }}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        <VStack className="w-full" space="lg">
          {isLoading ? (
            <View className="items-center justify-center py-8">
              <Spinner size="large" />
              <ThemedText className="mt-2" type="default">
                {t("general.loading")}
              </ThemedText>
            </View>
          ) : order ? (
            <>
              {/* Header */}
              <View className="items-center">
                <Heading size="lg" className="text-typography-950">
                  {t("order.orderDetails")}
                </Heading>
                <ThemedText className="text-sm" type="default">
                  #{order.number ?? getShortId(order.order_id, 6)}
                </ThemedText>
              </View>

              {order.status === "COMPLETED" && (
                <View className="flex w-full flex-col items-center justify-center">
                  <CheckSvg width={200} height={150} />
                </View>
              )}

              {/* QR Code for Pending Orders */}
              {order.status === "PENDING" && (
                <View className="mb-4 items-center">
                  <View className="mb-2 size-48 items-center justify-center rounded-xl border bg-white p-3">
                    {qrCodeUrl ? (
                      <QRCode value={qrCodeUrl} size={180} />
                    ) : (
                      <View className="items-center justify-center">
                        <Spinner />
                      </View>
                    )}
                  </View>
                  <Text className="text-sm italic text-gray-500 dark:text-gray-400">
                    {t("payment.scanToPay")}
                  </Text>
                </View>
              )}

              {/* Order Details */}
              <VStack space="sm">
                <View className="flex-row justify-between gap-2">
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {t("general.status")}
                  </Text>
                  <Text className="text-right text-sm">
                    <Badge
                      size="md"
                      variant="solid"
                      action={getStatusActionType(order.status)}
                    >
                      <BadgeText>
                        {t(`order.status.${order.status.toLowerCase()}`)}
                      </BadgeText>
                    </Badge>
                  </Text>
                </View>

                <View className="flex-row justify-between gap-2">
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {t("general.amount")}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Text className="text-right text-sm font-semibold">
                      {order.display_amount} {order.display_currency}
                    </Text>
                    {order.display_currency !== "USD" && (
                      <Text className="text-xs text-gray-500">
                        ≈ {Number(order.required_amount_usd).toFixed(2)} USD
                      </Text>
                    )}
                  </View>
                </View>

                <View className="flex-row justify-between gap-2">
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {t("general.createdAt")}
                  </Text>
                  <Text className="text-right text-sm">
                    {format(new Date(order.created_at), "MMM dd yyyy, HH:mm")}
                  </Text>
                </View>

                <View className="flex-row justify-between gap-2">
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {t("general.description")}
                  </Text>
                  <Text className="text-right text-sm">
                    {order.description === "" ? "-" : order.description}
                  </Text>
                </View>

                {/* <View className="flex-row justify-between gap-2">
                    <Text className="text-sm text-gray-500 dark:text-gray-400">{t('general.merchantId')}</Text>
                    <Text className="text-right text-sm">{getShortId(order.merchant_id, 6, 4)}</Text>
                  </View> */}
              </VStack>
            </>
          ) : (
            <View className="items-center justify-center py-8">
              <Text className="text-gray-500 dark:text-gray-400">
                {t("general.notFound")}
              </Text>
            </View>
          )}

          {/* Actions */}
          {!isLoading && (
            <View className="mt-4">
              <Button variant="link" onPress={handleClose} className="w-full">
                <ButtonText>{t("general.close")}</ButtonText>
              </Button>
            </View>
          )}
        </VStack>
      </ActionsheetContent>
    </Actionsheet>
  );
});

OrderDetailActionSheet.displayName = "OrderDetailActionSheet";
