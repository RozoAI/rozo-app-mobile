import React, { createContext, useCallback, useContext, useMemo } from "react";

import { LoadingScreen } from "@/components/loading-screen";
import { type GenericWallet } from "@/contexts/auth.context";
import { MERCHANT_KEY, TOKEN_KEY } from "@/libs/constants";
import { type CurrencyConfig } from "@/libs/currencies";
import { removeItem } from "@/libs/storage";
import { type Token } from "@/libs/tokens";
import { showToast } from "@/libs/utils";
import { type MerchantProfile } from "@/resources/schema/merchant";
import { usePrivy } from "@privy-io/expo";
import { AuthProvider, useAuth } from "./auth.provider";
import { MerchantProvider, useMerchant } from "./merchant.provider";
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
  setToken: () => {},
  setMerchant: () => {},
  logout: async () => {},
  togglePOS: async () => {},
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
  const { logout: logoutPrivy } = usePrivy();

  const logout = useCallback(async () => {
    try {
      // Logout Privy
      await logoutPrivy();

      // Clear storage
      removeItem(TOKEN_KEY);
      removeItem(MERCHANT_KEY);

      // Reset merchant state
      merchant.setMerchant(undefined);

      showToast({
        type: "success",
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      showToast({
        type: "danger",
        message: "Failed to logout",
      });
    }
  }, [merchant]);

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
      showPOS: wallet.showPOS,

      // Actions
      setToken: () => {}, // Not used in this simplified approach
      setMerchant: merchant.setMerchant,
      logout,
      togglePOS: wallet.togglePOS,

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
      wallet.showPOS,
      wallet.togglePOS,
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
    <AuthProvider>
      <MerchantProvider>
        <WalletProvider>
          <AppProviderInternal>{children}</AppProviderInternal>
        </WalletProvider>
      </MerchantProvider>
    </AuthProvider>
  );
};

export const useApp = () => useContext(AppContext);

// Export usePOSToggle for backward compatibility
export const usePOSToggle = () => {
  const { showPOS, togglePOS } = useWallet();
  return { showPOS, togglePOS };
};
