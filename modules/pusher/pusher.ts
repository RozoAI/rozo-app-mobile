import type { PusherEvent as PusherNativeEvent } from "@pusher/pusher-websocket-react-native";
// Import both Pusher libraries
import { Pusher as PusherNative } from "@pusher/pusher-websocket-react-native";
// Web Pusher import
import PusherJS from "pusher-js";
import { Platform } from "react-native";

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
let pusherWebInstance: PusherJS | null = null;

/**
 * Get the appropriate Pusher instance based on platform
 */
export async function getPusherInstance(): Promise<PusherNative | PusherJS> {
  const isWeb = Platform.OS === "web";

  if (isWeb) {
    // Web implementation using pusher-js
    if (!pusherWebInstance) {
      pusherWebInstance = new PusherJS(PUSHER_APP_KEY ?? "", {
        cluster: PUSHER_CLUSTER ?? "",
      });
    }
    return pusherWebInstance;
  } else {
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
  const isWeb = Platform.OS === "web";

  if (isWeb) {
    // Web implementation using pusher-js
    const webPusher = pusher as PusherJS;

    // Subscribe to the channel
    const channel = webPusher.subscribe(channelName);

    // If we have a specific event name and callback, bind to it
    if (eventName && callback) {
      channel.bind(eventName, (data: any) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error handling event data for ${eventName}:`, error);
        }
      });
    }

    // Return a wrapper that implements the IPusherChannel interface
    return {
      bind: (event: string, cb: (data: any) => void) => channel.bind(event, cb),
      unbind: (event: string) => channel.unbind(event),
    };
  } else {
    // Native implementation using @pusher/pusher-websocket-react-native
    const nativePusher = pusher as PusherNative;

    // Make sure we're connected
    await nativePusher.connect();

    // Subscribe to the channel
    await nativePusher.subscribe({
      channelName,
      onEvent: (event: PusherNativeEvent) => {
        // If we have a specific event name and callback, only trigger for that event
        if (eventName && callback && event.eventName === eventName) {
          try {
            const data =
              typeof event.data === "string"
                ? JSON.parse(event.data)
                : event.data;
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
        console.log(
          `Native channel unbinding is handled at unsubscription time`
        );
      },
    };
  }
}

/**
 * Helper function to unsubscribe from a channel
 * @param channelName The name of the channel to unsubscribe from
 */
export async function unsubscribeFromChannel(
  channelName: string
): Promise<void> {
  const pusher = await getPusherInstance();
  const isWeb = Platform.OS === "web";

  if (isWeb) {
    // Web implementation using pusher-js
    const webPusher = pusher as PusherJS;
    webPusher.unsubscribe(channelName);
  } else {
    // Native implementation using @pusher/pusher-websocket-react-native
    const nativePusher = pusher as PusherNative;
    await nativePusher.unsubscribe({ channelName });
  }
}

/**
 * Helper function to disconnect Pusher
 */
export async function disconnectPusher(): Promise<void> {
  const isWeb = Platform.OS === "web";

  if (isWeb && pusherWebInstance) {
    pusherWebInstance.disconnect();
    pusherWebInstance = null;
  } else if (!isWeb && pusherNativeInstance) {
    await pusherNativeInstance.disconnect();
    pusherNativeInstance = null;
  }
}
