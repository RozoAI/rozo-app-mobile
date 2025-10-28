import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { type GenericWallet } from "@/contexts/auth.context";
import { getItem } from "@/libs/storage";
import { useAuth } from "./auth.provider";

interface WalletContextProps {
  wallets: GenericWallet[];
  primaryWallet: GenericWallet | null;
  preferredPrimaryChain: "ethereum" | "stellar";
  setPreferredPrimaryChain: (chain: "ethereum" | "stellar") => Promise<void>;
}

const WalletContext = createContext<WalletContextProps>({
  wallets: [],
  primaryWallet: null,
  preferredPrimaryChain: "ethereum",
  setPreferredPrimaryChain: async () => {},
});

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [preferredPrimaryChain, setPreferredPrimaryChainState] = useState<
    "ethereum" | "stellar"
  >("ethereum");

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

  // Storage key depends on the set of wallet addresses to scope per user
  const preferredChainStorageKey = useMemo(() => {
    const addresses = wallets
      .map((w) => w.address)
      .filter(Boolean)
      .sort()
      .join("_");
    return addresses
      ? `preferred_primary_chain_${addresses}`
      : "preferred_primary_chain";
  }, [wallets]);

  // Load preferred chain once wallets are known
  useEffect(() => {
    const stored = getItem<"ethereum" | "stellar">(preferredChainStorageKey);
    if (stored === "ethereum" || stored === "stellar") {
      setPreferredPrimaryChainState(stored);
    } else {
      // default to ethereum (Base)
      setPreferredPrimaryChainState("ethereum");
    }
  }, [preferredChainStorageKey]);

  const setPreferredPrimaryChain = useCallback(
    async (chain: "ethereum" | "stellar") => {
      setPreferredPrimaryChainState(chain);
      // @TODO: Hit API to update Primary Wallet
      // await setItem(preferredChainStorageKey, chain);
    },
    [preferredChainStorageKey]
  );

  const primaryWallet = useMemo(() => {
    if (wallets.length === 0) return null;
    const match = wallets.find((w) => w.chain === preferredPrimaryChain);
    return match ?? wallets[0] ?? null;
  }, [wallets, preferredPrimaryChain]);

  const contextValue = useMemo(
    () => ({
      wallets,
      primaryWallet,
      preferredPrimaryChain,
      setPreferredPrimaryChain,
    }),
    [wallets, primaryWallet, preferredPrimaryChain, setPreferredPrimaryChain]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
