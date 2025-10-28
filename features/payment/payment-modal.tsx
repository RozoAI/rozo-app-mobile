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
  ModalHeader,
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
import { useSelectedTheme } from "@/hooks/use-selected-theme";
import { useToast } from "@/hooks/use-toast";
import { useRegeneratePayment } from "@/modules/api/api/merchant/orders";
import { PAYMENT_METHODS, type PaymentMethodId } from "./payment-method-config";
import PaymentMethodSelector from "./payment-method-selector";
import { PaymentSuccess } from "./payment-success";
import { type DynamicStyles } from "./types";

// Helper function to generate EVM deeplink URL
const generateEVMDeepLink = (
  tokenAddress: string,
  chainId: number,
  recipientAddress: string,
  amountUnits: string
): string => {
  return `ethereum:${tokenAddress}@${chainId}/transfer?address=${recipientAddress}&uint256=${amountUnits}`;
};

// Helper function to generate Solana deeplink URL
const generateSolanaDeepLink = (
  recipientAddress: string,
  amount: string,
  tokenMint: string,
  memo: string
): string => {
  return `solana:${recipientAddress}?amount=${amount}&spl-token=${tokenMint}&memo=${memo}`;
};

// Helper function to convert USD amount to token units (assuming 6 decimals for USDC)
const convertAmountToUnits = (amount: string): string => {
  const numericAmount = parseFloat(amount);
  // Convert to units (multiply by 1,000,000 for 6 decimal places)
  return Math.floor(numericAmount * 1000000).toString();
};

// Helper function to determine payment method from order data
const getPaymentMethodFromOrder = (
  order?: OrderResponse,
  isFirstTime: boolean = true
): PaymentMethodId => {
  if (isFirstTime) {
    return "rozo";
  }

  const chainId = order?.paymentDetail?.metadata?.payinchainid;
  switch (chainId) {
    case "8453":
      return "base";
    case "900":
      return "solana";
    case "137":
      return "polygon";
    default:
      return "rozo";
  }
};

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
  const { selectedTheme } = useSelectedTheme();

  const { defaultCurrency, merchant } = useApp();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrCodeDeeplink, setQrCodeDeeplink] = useState<string | null>(null);
  const [isSuccessPayment, setIsSuccessPayment] = useState(false);
  const [isChangingPaymentMethod, setIsChangingPaymentMethod] = useState(false);
  const { language } = useSelectedLanguage();
  const isDeposit = useMemo(() => !!deposit?.deposit_id, [deposit]);
  const { error: toastError } = useToast();

  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<OrderResponse | undefined>(
    order
  );

  const { mutateAsync: createOrderPayment } = useRegeneratePayment();

  const {
    data: fetchData,
    refetch,
    isPending: isOrderPending,
  } = useGetOrder({
    variables: { id: currentOrder?.order_id ?? "" },
    enabled: isEnabled,
  });

  const { data: dataDeposit, refetch: refetchDeposit } = useGetDeposit({
    variables: { id: deposit?.deposit_id ?? "", force: true },
    enabled: isDeposit,
  });

  // Use our custom hook to handle payment status updates
  const { status, speakPaymentStatus, unsubscribe } = usePaymentStatus(
    merchant?.merchant_id,
    currentOrder?.order_id
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
      setIsChangingPaymentMethod(false);
    }
  }, [isOpen, currentOrder, deposit]);

  // Watch for payment status changes
  useEffect(() => {
    if (status === "completed" || depositStatus === "completed") {
      if (isDeposit) {
        refetchDeposit();
      } else {
        console.log("Order Success, refetching", !!currentOrder?.order_id);
        setIsEnabled(true);
      }
    }
  }, [status, depositStatus, isDeposit]);

  useEffect(() => {
    if (isEnabled) {
      refetch();
    }
  }, [isEnabled]);

  useEffect(() => {
    if (
      fetchData?.status === "COMPLETED" ||
      dataDeposit?.status === "COMPLETED" ||
      dataDeposit?.status === "COMPLETED"
    ) {
      setIsSuccessPayment(true);
      setIsEnabled(false);
    }

    if (fetchData?.status === "COMPLETED" && !isDeposit && Number(amount) > 0) {
      unsubscribe();
      // Speak the amount
      speakPaymentStatus({
        amount: Number(amount),
        currency: defaultCurrency?.voice ?? "Dollar",
        language,
      });
    }
  }, [
    fetchData,
    dataDeposit,
    amount,
    defaultCurrency?.voice,
    isDeposit,
    language,
  ]);

  // Handle payment method selection
  const handlePaymentMethodSelected = useCallback(
    async (methodId: PaymentMethodId, preferredToken?: string) => {
      if (!currentOrder?.order_id) return;

      setIsChangingPaymentMethod(true);

      try {
        // Always re-create order payment first
        const response = await createOrderPayment({
          id: currentOrder.order_id,
          preferredToken,
        });

        console.log("New payment created:", JSON.stringify(response, null, 2));

        // Process deeplink strategy only if selected option is not Rozo
        if (methodId !== "rozo") {
          const paymentMethod = PAYMENT_METHODS.find(
            (method) => method.id === methodId
          );

          console.log("Payment method found:", paymentMethod);
          console.log("Response payment details:", response.paymentDetail);

          if (paymentMethod?.tokenAddress) {
            // Get recipient address and memo from new payment details
            const recipientAddress =
              response.paymentDetail?.metadata?.receivingAddress;
            const memo = response.paymentDetail?.metadata?.memo;

            console.log(
              "Chain",
              response.paymentDetail?.metadata?.payinchainid
            );
            console.log("Recipient address:", recipientAddress);
            console.log("Memo:", memo);

            if (recipientAddress) {
              let deeplinkUrl: string;

              if (methodId === "solana" && memo) {
                // Generate Solana deeplink
                deeplinkUrl = generateSolanaDeepLink(
                  recipientAddress,
                  amount, // Use original amount for Solana
                  paymentMethod.tokenAddress, // token mint address
                  memo // memo is required
                );
                console.log("Generated Solana deeplink:", deeplinkUrl);
              } else if (paymentMethod.chainId) {
                // Generate EVM deeplink for Base and Polygon
                const amountUnits = convertAmountToUnits(amount);
                deeplinkUrl = generateEVMDeepLink(
                  paymentMethod.tokenAddress,
                  paymentMethod.chainId,
                  recipientAddress,
                  amountUnits
                );
                console.log("Generated EVM deeplink:", deeplinkUrl);
              } else {
                throw new Error(
                  `Chain ID not found for payment method: ${methodId}`
                );
              }

              setQrCodeDeeplink(deeplinkUrl);
            } else {
              throw new Error(
                `Recipient address not found in payment details. ${JSON.stringify(
                  response,
                  null,
                  2
                )}`
              );
            }
          } else {
            console.log(
              "Payment method not found or missing tokenAddress, falling back to API QR code"
            );
            // Fallback to using QR code from API response
            setQrCodeUrl(response.qrcode);
          }
        } else {
          // For Rozo, use the QR code from API response
          setQrCodeUrl(response.qrcode);
          setQrCodeDeeplink(null);
        }

        // Update current order with new payment data AFTER setting QR code
        console.log("Current Order Updated", response);
        setCurrentOrder(response);
        setIsFirstTime(false);
      } catch (error: any) {
        console.error("Payment creation error:", error);
        toastError(error.message || "Failed to create payment");
      } finally {
        setIsChangingPaymentMethod(false);
      }
    },
    [currentOrder, amount]
  );

  // Handle back to home
  const handleBackToHome = useCallback(() => {
    // Reset states
    setIsSuccessPayment(false);
    onClose();
    onBackToHome?.();
  }, []);

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
        <ModalBody
          className={isSuccessPayment ? "!m-0" : ""}
          style={{ padding: 0 }}
        >
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
                {isChangingPaymentMethod || (isOrderPending && isEnabled) ? (
                  <View
                    className="items-center justify-center"
                    style={{ width: 200, height: 200 }}
                  >
                    <Spinner size="large" />
                    <Text className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                      {t("general.loading")}
                    </Text>
                  </View>
                ) : qrCodeDeeplink ? (
                  <QRCode value={qrCodeDeeplink} size={200} />
                ) : qrCodeUrl ? (
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
                  <Countdown
                    targetDate={new Date(currentOrder.expired_at)}
                    textSize="xl"
                    className="text-center text-lg font-bold text-gray-800 dark:text-gray-200"
                    onComplete={() => {
                      toastError("Order expired");
                      handleBackToHome();
                    }}
                  />
                </View>
              )}

              {isOrderPending && isEnabled ? (
                <View className="w-full items-center flex flex-col gap-1">
                  <Text className="text-gray-500 dark:text-gray-400 text-center font-medium">
                    {t("payment.checkingOrder")}
                  </Text>
                </View>
              ) : (
                <View
                  className="w-full items-center flex flex-col gap-1"
                  style={{
                    borderWidth: 1,
                    borderColor:
                      selectedTheme === "dark" ? "#374151" : "#e5e7eb",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <PaymentMethodSelector
                    existingPayment={currentOrder}
                    onPaymentMethodSelected={handlePaymentMethodSelected}
                    className="px-4"
                    isLoading={isChangingPaymentMethod}
                    currentPaymentMethod={getPaymentMethodFromOrder(
                      currentOrder,
                      isFirstTime
                    )}
                  />
                </View>
              )}
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
