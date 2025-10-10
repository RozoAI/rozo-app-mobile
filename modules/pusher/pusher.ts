import type { PusherEvent as PusherNativeEvent } from "@pusher/pusher-websocket-react-native";
// Import both Pusher libraries
import { Pusher as PusherNative } from "@pusher/pusher-websocket-react-native";
// Web Pusher import
import PusherJS from "pusher-js";

// Initialize Pusher with your credentials
const PUSHER_APP_KEY = process.env.EXPO_PUBLIC_PUSHER_APP_KEY;
const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER;

// Define common interfaces for both implementations
export interface IPusherChannel {
  bind: (eventName: string, callback: (data: any) => void) => void;
  unbind: (eventName: string) => void;
}

// Common event interface
export interface IPusherEvent {
  eventName: string;
  channelName: string;
  data: any;
}

// Re-export the PaymentCompletedEvent type for use in hooks
export type PaymentCompletedEvent = {
  order_id: string;
  display_amount?: number;
  display_currency?: string;
  message?: string;
  timestamp?: string;
};

// Create singleton instances for each platform
let pusherNativeInstance: PusherNative | null = null;

/**
 * Get the appropriate Pusher instance based on platform
 */
export async function getPusherInstance(): Promise<PusherNative | PusherJS> {
  // Native implementation using @pusher/pusher-websocket-react-native
  if (!pusherNativeInstance) {
    const pusher = PusherNative.getInstance();

    await pusher.init({
      apiKey: PUSHER_APP_KEY ?? "",
      cluster: PUSHER_CLUSTER ?? "",
    });

    pusherNativeInstance = pusher;
  }
  return pusherNativeInstance;
}

/**
 * Helper function to subscribe to a channel
 * @param channelName The name of the channel to subscribe to
 * @param eventName Optional event name to listen for
 * @param callback Optional callback function to handle events
 * @returns The channel object
 */
export async function subscribeToChannel(
  channelName: string,
  eventName?: string,
  callback?: (data: any) => void
): Promise<IPusherChannel> {
  const pusher = await getPusherInstance();
  // Native implementation using @pusher/pusher-websocket-react-native
  const nativePusher = pusher as PusherNative;

  // Debug: log connection intent
  console.debug(`[Pusher] Connecting to Pusher...`);

  // Make sure we're connected
  await nativePusher.connect();

  // Debug: log subscribe attempt
  console.debug(`[Pusher] Subscribing to channel: ${channelName}`);

  // Subscribe to the channel
  await nativePusher.subscribe({
    channelName,
    onEvent: (event: PusherNativeEvent) => {
      console.debug(
        `[Pusher] Event received on channel "${channelName}": eventName="${
          event.eventName
        }", data=${JSON.stringify(event.data)}`
      );
      // If we have a specific event name and callback, only trigger for that event
      if (eventName && callback && event.eventName === eventName) {
        try {
          const data =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;
          console.debug(
            `[Pusher] Event "${eventName}" matched. Triggering callback with:`,
            data
          );
          callback(data);
        } catch (error) {
          console.error(`Error parsing event data for ${eventName}:`, error);
        }
      }
    },
  });

  // Return a wrapper that implements the IPusherChannel interface
  return {
    bind: (_event: string, _cb: (data: any) => void) => {
      // Native SDK doesn't have a direct bind method on channel
      // The binding is done at subscription time with onEvent
      console.log(`Native channel binding is handled at subscription time`);
    },
    unbind: (_event: string) => {
      // Native SDK doesn't have a direct unbind method on channel
      console.log(`Native channel unbinding is handled at unsubscription time`);
    },
  };
}

/**
 * Helper function to unsubscribe from a channel
 * @param channelName The name of the channel to unsubscribe from
 */
export async function unsubscribeFromChannel(
  channelName: string
): Promise<void> {
  const pusher = await getPusherInstance();
  // Native implementation using @pusher/pusher-websocket-react-native
  const nativePusher = pusher as PusherNative;
  await nativePusher.unsubscribe({ channelName });
}

/**
 * Helper function to disconnect Pusher
 */
export async function disconnectPusher(): Promise<void> {
  if (pusherNativeInstance) {
    await pusherNativeInstance.disconnect();
    pusherNativeInstance = null;
  }
}
