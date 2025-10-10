import { useEffect, useMemo, useState } from "react";

import type { PaymentCompletedEvent } from "@/modules/pusher/pusher";
import {
  subscribeToChannel,
  unsubscribeFromChannel,
} from "@/modules/pusher/pusher";
import { useGetDeposit } from "@/resources/api/merchant/deposits";

type PaymentStatus = "pending" | "completed" | "failed";

/**
 * Hook to subscribe to payment status updates via Pusher
 * Works with both web (pusher-js) and native (@pusher/pusher-websocket-react-native) platforms
 */
export function useDepositStatus(merchantId?: string, depositId?: string) {
  const [status, setStatus] = useState<PaymentStatus>("pending");

  const {
    refetch: refetchDeposit,
    data: dataDeposit,
    isLoading: isDepositLoading,
  } = useGetDeposit({
    variables: { id: depositId ?? "" },
    enabled: false,
  });

  // Function to manually check payment status
  const checkPaymentStatus = () => {
    if (depositId) {
      refetchDeposit();
    }
  };

  useEffect(() => {
    // Only subscribe if we have a merchantId and depositId
    if (!merchantId || !depositId) return;

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
            if (data.order_id === depositId) {
              setStatus("completed");
              console.log(`Payment completed for deposit ${depositId}`);
            }
          }
        );

        console.log(`Subscribed to ${channelName} channel on native platform`);
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
  }, [merchantId, depositId]);

  useEffect(() => {
    if (dataDeposit && dataDeposit.status === "COMPLETED") {
      setStatus("completed");
    }
  }, [dataDeposit]);

  return useMemo(
    () => ({
      status,
      isLoading: isDepositLoading,
      checkPaymentStatus,
      isPending: status === "pending",
      isCompleted: status === "completed",
      isFailed: status === "failed",
    }),
    [status, isDepositLoading]
  );
}
