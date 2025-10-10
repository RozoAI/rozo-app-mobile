import { XIcon } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import QRCode from "react-qr-code";

import { CurrencyConverter } from "@/components/currency-converter";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useDepositStatus } from "@/hooks/use-deposit-status";
import { usePaymentStatus } from "@/hooks/use-payment-status";
import { useSelectedLanguage } from "@/hooks/use-selected-language";
import { useApp } from "@/providers/app.provider";
import { useGetOrder } from "@/resources/api";
import { useGetDeposit } from "@/resources/api/merchant/deposits";
import { type DepositResponse } from "@/resources/schema/deposit";
import { type OrderResponse } from "@/resources/schema/order";

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

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && (order?.qrcode || deposit?.qrcode)) {
      setQrCodeUrl(order?.qrcode || deposit?.qrcode || null);
    } else {
      setQrCodeUrl(null);
    }

    // Reset states when modal opens
    if (isOpen) {
      setIsSuccessPayment(false);
    }
  }, [isOpen, order, deposit]);

  // Watch for payment status changes
  useEffect(() => {
    console.log("status", status);
    console.log("depositStatus", depositStatus);
    console.log("isDeposit", isDeposit);

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
    console.log("fetchData", fetchData);
    console.log("dataDeposit", dataDeposit);

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
          <ModalHeader className="mb-2">
            <Heading size="md" className="text-typography-950">
              {t("payment.scanToPay")}
            </Heading>
            <ModalCloseButton>
              <Icon
                as={XIcon}
                size="md"
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
              order={order}
            />
          ) : (
            <View className="items-center justify-center">
              {/* QR Code */}
              <View className="mb-4 size-60 items-center justify-center rounded-xl border bg-white p-2">
                {qrCodeUrl ? (
                  <QRCode value={qrCodeUrl} size={150} />
                ) : (
                  <View className="mb-4 items-center justify-center">
                    <Spinner />
                  </View>
                )}
              </View>

              {/* Order Number */}
              {order?.order_number && (
                <View className="mb-4 items-center">
                  <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {t("payment.orderNumber")}{" "}
                  </Text>
                  <Text className="text-center font-medium text-gray-800 dark:text-gray-200">
                    #{order.order_number}
                  </Text>
                </View>
              )}

              {/* Amount Information */}
              <View className="mb-6 w-full items-center">
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {t("payment.amountToPay")}
                </Text>
                <Text
                  className={`text-center font-bold text-gray-800 dark:text-gray-200 ${dynamicStyles.fontSize.modalAmount}`}
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
            </View>
          )}
        </ModalBody>
        {!isSuccessPayment && (
          <ModalFooter className="flex w-full flex-col items-center gap-2">
            <>
              {/* <Button
                onPress={handleVerifyPayment}
                isDisabled={isLoading || isCompleted}
                className="w-full rounded-xl"
                size={dynamicStyles.size.buttonSize as 'sm' | 'md' | 'lg'}
              >
                {isLoading ? <ButtonSpinner /> : <ButtonText>{t('payment.verifyPayment')}</ButtonText>}
              </Button> */}
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
            </>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
