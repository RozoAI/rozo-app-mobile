import { XIcon } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";

import { CurrencyConverter } from "@/components/currency-converter";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader
} from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useDepositStatus } from "@/hooks/use-deposit-status";
import { usePaymentStatus } from "@/hooks/use-payment-status";
import { useSelectedLanguage } from "@/hooks/use-selected-language";
import { useGetOrder } from "@/modules/api/api";
import { useGetDeposit } from "@/modules/api/api/merchant/deposits";
import { type DepositResponse } from "@/modules/api/schema/deposit";
import { type OrderResponse } from "@/modules/api/schema/order";
import { useApp } from "@/providers/app.provider";

import { Countdown } from "@/components/ui/countdown";
import { useToast } from "@/hooks/use-toast";
import { useCreateOrderPayment } from "@/modules/api/api/merchant/orders";
import { type PaymentMethodId } from "./payment-method-config";
import PaymentMethodSelector from "./payment-method-selector";
import { PaymentSuccess } from "./payment-success";
import { type DynamicStyles } from "./types";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  dynamicStyles: DynamicStyles;
  order?: OrderResponse;
  deposit?: DepositResponse;
  showOpenLink?: boolean;
  onBackToHome?: () => void;
};

export function PaymentModal({
  isOpen,
  onClose,
  amount,
  dynamicStyles,
  order,
  deposit,
  showOpenLink,
  onBackToHome,
}: PaymentModalProps): React.ReactElement {
  const { t } = useTranslation();
  const { defaultCurrency, merchant } = useApp();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isSuccessPayment, setIsSuccessPayment] = useState(false);
  const { language } = useSelectedLanguage();
  const isDeposit = useMemo(() => !!deposit?.deposit_id, [deposit]);
  const { error } = useToast();

  const [currentOrder, setCurrentOrder] = useState<OrderResponse | undefined>(order);

  const { mutateAsync: createOrderPayment } = useCreateOrderPayment();

  const { data: fetchData, refetch } = useGetOrder({
    variables: { id: order?.order_id ?? "" },
    enabled: !!order?.order_id,
  });

  const { data: dataDeposit, refetch: refetchDeposit } = useGetDeposit({
    variables: { id: deposit?.deposit_id ?? "", force: true },
    enabled: isDeposit,
  });

  // Use our custom hook to handle payment status updates
  const { status, speakPaymentStatus } = usePaymentStatus(
    merchant?.merchant_id,
    order?.order_id
  );

  // Use deposit status hook
  const { status: depositStatus } = useDepositStatus(
    merchant?.merchant_id,
    deposit?.deposit_id
  );

  useEffect(() => {
    if (order) {
      setCurrentOrder(order);
    }
  }, [order]);

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && (currentOrder?.qrcode || deposit?.qrcode)) {
      setQrCodeUrl(currentOrder?.qrcode || deposit?.qrcode || null);
    } else {
      setQrCodeUrl(null);
    }

    // Reset states when modal opens
    if (isOpen) {
      setIsSuccessPayment(false);
    }
  }, [isOpen, currentOrder, deposit]);

  // Watch for payment status changes
  useEffect(() => {
    if (status === "completed" || depositStatus === "completed") {
      // Show success view after a brief delay
      if (isDeposit) {
        refetchDeposit();
      } else {
        refetch();
      }
    }
  }, [status, depositStatus]);

  useEffect(() => {
    if (
      fetchData?.status === "COMPLETED" ||
      dataDeposit?.status === "COMPLETED" ||
      dataDeposit?.status === "COMPLETED"
    ) {
      setIsSuccessPayment(true);
    }

    if (fetchData?.status === "COMPLETED" && !isDeposit && Number(amount) > 0) {
      // Speak the amount
      speakPaymentStatus({
        amount: Number(amount),
        currency: defaultCurrency?.voice ?? "Dollar",
        language,
      });
    }
  }, [fetchData, dataDeposit]);

  // Handle payment method selection
  const handlePaymentMethodSelected = useCallback(async (methodId: PaymentMethodId, preferredToken?: string) => {
    if (!currentOrder?.order_id) return;

    try {
      // Simple if condition by id for Rozo payment
      if (methodId === 'rozo') {
        // Use existing payment data for Rozo
        if (currentOrder) {
          console.log("Using existing Rozo payment:", JSON.stringify(order, null, 2));
          setQrCodeUrl(currentOrder.qrcode);
        }
      } else {
        // API call for other payment methods
        const response = await createOrderPayment({
          id: currentOrder.order_id,
          preferredToken,
        });
        
        console.log("New payment created:", JSON.stringify(response, null, 2));
        setQrCodeUrl(response.qrcode);
        setCurrentOrder(response);
      }
    } catch (error: any) {
      console.error('Payment creation error:', error);
      error(error.message || 'Failed to create payment');
    }
  }, [currentOrder, createOrderPayment, error]);

  // Handle back to home
  const handleBackToHome = useCallback(() => {
    // Reset states
    setIsSuccessPayment(false);
    onClose();
    onBackToHome?.();
  }, [onClose, onBackToHome]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeOnOverlayClick={false}
    >
      <ModalBackdrop />
      <ModalContent>
        {!isSuccessPayment && (
          <ModalHeader className="mb-6 flex flex-row items-center justify-between">
            <Heading size="xl" className="text-typography-950">
              {t("payment.scanToPay")}
            </Heading>
            <ModalCloseButton>
              <Icon
                as={XIcon}
                size="xl"
                className="stroke-background-400 group-[:active]/modal-close-button:stroke-background-900 group-[:focus-visible]/modal-close-button:stroke-background-900 group-[:hover]/modal-close-button:stroke-background-700"
              />
            </ModalCloseButton>
          </ModalHeader>
        )}
        <ModalBody className={isSuccessPayment ? "!m-0" : ""}>
          {isSuccessPayment ? (
            <PaymentSuccess
              defaultCurrency={defaultCurrency}
              amount={amount}
              dynamicStyles={dynamicStyles}
              onPrintReceipt={() => {}}
              onBackToHome={handleBackToHome}
              order={currentOrder}
            />
          ) : (
            <View className="items-center justify-center flex flex-col gap-4">
              {/* QR Code */}
              <View className="size-80 items-center justify-center rounded-xl border bg-white p-2">
                {qrCodeUrl ? (
                  <QRCode value={qrCodeUrl} size={200} />
                ) : (
                  <View className="mb-4 items-center justify-center">
                    <Spinner />
                  </View>
                )}
              </View>

              {/* Order Number */}
              {currentOrder?.order_number && (
                <View className="items-center flex flex-col gap-1 w-full">
                  <Text className=" text-gray-500 dark:text-gray-400">
                    {t("payment.orderNumber")}{" "}
                  </Text>
                  <Text className="text-center text-lg font-medium text-gray-800 dark:text-gray-200">
                    #{currentOrder.order_number}
                  </Text>
                </View>
              )}

              {/* Amount Information */}
              <View className="w-full items-center flex flex-col gap-1">
                <Text className=" text-gray-500 dark:text-gray-400">
                  {t("payment.amountToPay")}
                </Text>
                <Text
                  className={`text-center font-bold text-lg text-gray-600 dark:text-gray-200 ${dynamicStyles.fontSize.modalAmount}`}
                >
                  {`${amount} ${defaultCurrency?.code}`}
                </Text>
                {defaultCurrency?.code !== "USD" && (
                  <View className="mt-1 rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                    <CurrencyConverter
                      amount={Number(amount)}
                      customSourceCurrency={defaultCurrency?.code}
                      className={`text-center text-gray-600 dark:text-gray-200 ${dynamicStyles.fontSize.label}`}
                    />
                  </View>
                )}
              </View>

              {currentOrder?.expired_at && (
                <View className="items-center flex flex-col gap-1 w-full">
                  <Text className=" text-gray-500 dark:text-gray-400">
                    {t("general.expiredAt")}
                  </Text>
                  <Countdown targetDate={new Date(currentOrder.expired_at)} textSize="xl" className="text-center text-lg font-bold text-gray-800 dark:text-gray-200"
                  onComplete={() => {
                    error("Order expired");
                    handleBackToHome();
                  }} />
                </View>
              )}

              <View className="w-full items-center flex flex-col gap-1">
                <PaymentMethodSelector
                  orderId={currentOrder?.order_id || ''}
                  existingPayment={currentOrder}
                  onPaymentMethodSelected={handlePaymentMethodSelected}
                  className="px-4"
                />
              </View>
            </View>
          )}
        </ModalBody>
        {/* {!isSuccessPayment && (
          <ModalFooter className="flex w-full flex-col items-center gap-2">
            
              {showOpenLink && (
                <Button
                  onPress={() => {
                    if (qrCodeUrl) {
                      Linking.openURL(qrCodeUrl);
                    }
                  }}
                  isDisabled={!qrCodeUrl}
                  className="w-full rounded-xl"
                  size={dynamicStyles.size.buttonSize as "sm" | "md" | "lg"}
                >
                  <ButtonText>{t("payment.openPaymentLink")}</ButtonText>
                </Button>
              )}
              <Button
                variant="link"
                onPress={onClose}
                className="w-full"
                size={dynamicStyles.size.buttonSize as "sm" | "md" | "lg"}
              >
                <ButtonText>{t("general.cancel")}</ButtonText>
              </Button>
            
          </ModalFooter>
        )} */}
      </ModalContent>
    </Modal>
  );
}
