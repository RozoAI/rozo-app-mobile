import { base, createPrivyClient } from "@privy-io/expo";

export const privyClient = createPrivyClient({
  appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID || "",
  clientId: process.env.EXPO_PUBLIC_PRIVY_MOBILE_CLIENT_ID || "",
  supportedChains: [base],
});
