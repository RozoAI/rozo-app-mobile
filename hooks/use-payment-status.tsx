import * as Speech from "expo-speech";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

import { useGetOrder } from "@/modules/api/api/merchant/orders";
import type { PaymentCompletedEvent } from "@/modules/pusher/pusher";
import {
  subscribeToChannel,
  unsubscribeFromChannel,
} from "@/modules/pusher/pusher";

type PaymentStatus = "pending" | "completed" | "failed";

/**
 * Hook to subscribe to payment status updates via Pusher
 * Works with both web (pusher-js) and native (@pusher/pusher-websocket-react-native) platforms
 */
export function usePaymentStatus(merchantId?: string, orderId?: string) {
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const isWeb = Platform.OS === "web";
  const { t } = useTranslation();

  const { refetch, data, isLoading } = useGetOrder({
    variables: { id: orderId ?? "" },
    enabled: false,
  });

  // Function to manually check payment status
  const checkPaymentStatus = () => {
    if (orderId) {
      refetch();
    }
  };

  const unsubscribe = async () => {
    try {
      if (!merchantId) return;

      const channelName = merchantId;
      await unsubscribeFromChannel(channelName);
      console.log(`Unsubscribed from ${channelName} channel`);
    } catch (error) {
      console.error("Error cleaning up Pusher:", error);
    }
  };

  const speakPaymentStatus = async ({
    amount,
    currency,
    language,
    onEnd,
  }: {
    amount: number;
    currency: string;
    language: string;
    onEnd?: () => void;
  }) => {
    const thingToSay = t("payment.voiceSuccess", {
      amount: amount,
      currency: currency,
    });
    Speech.speak(thingToSay, {
      language: language,
      pitch: 0.8,
      rate: 0.8,
      onDone: onEnd,
    });
  };

  useEffect(() => {
    // Only subscribe if we have a merchantId and orderId
    if (!merchantId || !orderId) return;

    const channelName = merchantId;

    // Setup Pusher channel and event binding
    const setupPusher = async () => {
      try {
        // Subscribe to the channel with event handler for payment_completed event
        // The subscribeToChannel function handles platform differences internally
        await subscribeToChannel(
          channelName,
          "payment_completed",
          (data: PaymentCompletedEvent) => {
            if (data.order_id === orderId) {
              setStatus("completed");
              console.log(`Payment completed for order ${orderId}`);
            }
          }
        );

        console.log(
          `Subscribed to ${channelName} channel on ${
            isWeb ? "web" : "native"
          } platform`
        );
      } catch (error) {
        console.error("Error setting up Pusher:", error);
      }
    };

    setupPusher();

    // Cleanup function
    return () => {
      setStatus("pending"); // Reset status when unmounted

      if (channelName) {
        // Unsubscribe from channel
        const cleanup = async () => {
          try {
            await unsubscribeFromChannel(channelName);
            console.log(`Unsubscribed from ${channelName} channel`);
          } catch (error) {
            console.error("Error cleaning up Pusher:", error);
          }
        };

        cleanup();
      }
    };
  }, [merchantId, orderId, isWeb]);

  useEffect(() => {
    if (data && data.status === "COMPLETED") {
      setStatus("completed");
    }
  }, [data]);

  return useMemo(
    () => ({
      status,
      isLoading: isLoading,
      checkPaymentStatus,
      speakPaymentStatus,
      unsubscribe,
      isPending: status === "pending",
      isCompleted: status === "completed",
      isFailed: status === "failed",
    }),
    [status, isLoading]
  );
}
