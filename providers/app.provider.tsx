import React, { createContext, useCallback, useContext, useMemo } from "react";

import { LoadingScreen } from "@/components/loading-screen";
import { ToastProvider } from "@/components/toast/toast-provider";
import { type GenericWallet } from "@/contexts/auth.context";
import { useToast } from "@/hooks/use-toast";
import { MERCHANT_KEY, TOKEN_KEY } from "@/libs/constants";
import { type CurrencyConfig } from "@/libs/currencies";
import { removeItem } from "@/libs/storage";
import { type Token } from "@/libs/tokens";
import { type MerchantProfile } from "@/modules/api/schema/merchant";
import { usePrivy } from "@privy-io/expo";
import { AuthProvider, useAuth } from "./auth.provider";
import { MerchantProvider, useMerchant } from "./merchant.provider";
import { PreferencesProvider, usePreferences } from "./preferences.provider";
import { WalletProvider, useWallet } from "./wallet.provider";

// Re-export GenericWallet type for backward compatibility
export type { GenericWallet };

interface IContextProps {
  // Auth state
  isAuthenticated: boolean;
  token: string | undefined;
  isAuthLoading: boolean;
  user?: any;

  // Merchant state
  merchant: MerchantProfile | undefined;
  defaultCurrency: CurrencyConfig | undefined;
  merchantToken: Token | undefined;

  // Wallet state
  wallets: GenericWallet[];
  primaryWallet: GenericWallet | null;

  // POS Toggle state
  showPOS: boolean;

  // Actions
  setToken: (token: string | undefined) => void;
  setMerchant: (merchant: MerchantProfile | undefined) => void;
  logout: () => Promise<void>;
  togglePOS: (value: boolean) => Promise<void>;

  // Additional Privy-specific functionality
  getAccessToken?: () => Promise<string | null>;
}

export const AppContext = createContext<IContextProps>({
  isAuthenticated: false,
  token: undefined,
  isAuthLoading: false,
  user: undefined,
  merchant: undefined,
  defaultCurrency: undefined,
  merchantToken: undefined,
  wallets: [],
  primaryWallet: null,
  showPOS: false,
  setToken: () => { },
  setMerchant: () => { },
  logout: async () => { },
  togglePOS: async () => { },
  getAccessToken: undefined,
});

interface IProviderProps {
  children: React.ReactNode;
}

// Internal component that uses the separated providers
const AppProviderInternal: React.FC<IProviderProps> = ({ children }) => {
  const auth = useAuth();
  const merchant = useMerchant();
  const wallet = useWallet();
  const preferences = usePreferences();
  const { logout: logoutPrivy, user: privyUser } = usePrivy();
  const { success, error } = useToast();

  const logout = useCallback(async () => {
    try {
      if (privyUser) {
        // Logout Privy
        await logoutPrivy();

        // Clear storage
        await removeItem(TOKEN_KEY);
        await removeItem(MERCHANT_KEY);
        await preferences.deleteTogglePOS();

        // Reset merchant state
        merchant.setMerchant(undefined);

        success("Logged out successfully");
      }
    } catch (err) {
      console.error("Logout error:", err);
      error("Failed to logout");
    }
  }, [merchant, preferences, logoutPrivy, privyUser, success, error]);

  // Determine if we're still loading
  const isLoading = auth.isAuthLoading || merchant.isMerchantLoading;

  // Context value
  const contextValue = useMemo(
    () => ({
      // Auth state
      isAuthenticated: auth.isAuthenticated,
      token: auth.token,
      isAuthLoading: auth.isAuthLoading,
      user: auth.user,

      // Merchant state
      merchant: merchant.merchant,
      defaultCurrency: merchant.defaultCurrency,
      merchantToken: merchant.merchantToken,

      // Wallet state
      wallets: wallet.wallets,
      primaryWallet: wallet.primaryWallet,

      // POS Toggle state
      showPOS: preferences.showPOS,

      // Actions
      setToken: () => { }, // Not used in this simplified approach
      setMerchant: merchant.setMerchant,
      logout,
      togglePOS: preferences.togglePOS,

      // Additional Privy-specific functionality
      getAccessToken: auth.refreshAccessToken,
    }),
    [
      auth.isAuthenticated,
      auth.token,
      auth.isAuthLoading,
      auth.user,
      auth.refreshAccessToken,
      merchant.merchant,
      merchant.defaultCurrency,
      merchant.merchantToken,
      merchant.setMerchant,
      wallet.wallets,
      wallet.primaryWallet,
      preferences.showPOS,
      preferences.togglePOS,
      logout,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {isLoading ? <LoadingScreen merchant={merchant.merchant} /> : children}
    </AppContext.Provider>
  );
};

// Main AppProvider that composes all the separated providers
export const AppProvider: React.FC<IProviderProps> = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        <MerchantProvider>
          <WalletProvider>
            <PreferencesProvider>
              <AppProviderInternal>{children}</AppProviderInternal>
            </PreferencesProvider>
          </WalletProvider>
        </MerchantProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export const useApp = () => useContext(AppContext);
