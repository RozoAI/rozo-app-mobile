import React, {
  createContext,
  useContext,
  useMemo,
} from "react";

import { type GenericWallet } from "@/contexts/auth.context";
import { useAuth } from "./auth.provider";

interface WalletContextProps {
  wallets: GenericWallet[];
  primaryWallet: GenericWallet | null;
}

const WalletContext = createContext<WalletContextProps>({
  wallets: [],
  primaryWallet: null,
});

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // Computed values
  const wallets = useMemo(() => {
    if (!user?.linked_accounts) return [];
    return user.linked_accounts
      .filter((account: any) => account.type === "wallet")
      .map((wallet: any) => ({
        address: wallet.address,
        chain: wallet.chainType || "ethereum",
        isConnected: true,
      }));
  }, [user?.linked_accounts]);

  const primaryWallet = useMemo(() => {
    return wallets.length > 0 ? wallets[0] : null;
  }, [wallets]);

  const contextValue = useMemo(
    () => ({
      wallets,
      primaryWallet,
    }),
    [wallets, primaryWallet]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
