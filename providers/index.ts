// Main App Provider - use this in your app root
export { AppProvider, useApp } from "./app.provider";
export type { GenericWallet } from "./app.provider";

// Individual providers - typically only needed for internal use
export { AuthProvider, useAuth } from "./auth.provider";
export { MerchantProvider, useMerchant } from "./merchant.provider";
export {
  PreferencesProvider,
  usePOSToggle,
  usePreferences,
} from "./preferences.provider";
export { QueryProvider, queryClient } from "./query.provider";
export { WalletProvider, useWallet } from "./wallet.provider";
