import { useCreateWallet } from "@privy-io/expo/extended-chains";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { type GenericWallet } from "@/contexts/auth.context";
import { useToast } from "@/hooks/use-toast";
import { getItem, setItem } from "@/libs/storage";
import {
  PrivyEmbeddedWalletAccount,
  useEmbeddedEthereumWallet,
} from "@privy-io/expo";
import axios from "axios";
import { useAuth } from "./auth.provider";
import { useStellar } from "./stellar.provider";

export type WalletBalanceInfo = {
  chain: string;
  asset: string;
  raw_value: string;
  raw_value_decimals: number;
  display_values: {
    usdc?: string;
    native?: string;
  };
};

export type Wallet = {
  id: string;
  address: string;
  chain_type: string;
  authorization_threshold: number;
  owner_id: string | null;
  additional_signers: string[];
  created_at: number;
};

export type AvailableChain = "ethereum" | "stellar";

interface WalletContextProps {
  isCreating: boolean;
  isBalanceLoading: boolean;
  hasWallet: boolean;
  wallets: GenericWallet[];
  balances: WalletBalanceInfo[];
  primaryWallet: GenericWallet | null;
  preferredPrimaryChain: AvailableChain;
  setPreferredPrimaryChain: (chain: AvailableChain) => Promise<void>;
  createWallet: (chain: AvailableChain) => Promise<void>;
  switchWallet: () => Promise<void>;
  getBalance: () => Promise<WalletBalanceInfo[] | undefined>;
}

const WalletContext = createContext<WalletContextProps>({
  isCreating: false,
  isBalanceLoading: false,
  hasWallet: false,
  wallets: [],
  balances: [],
  primaryWallet: null,
  preferredPrimaryChain: "ethereum",
  setPreferredPrimaryChain: async () => {},
  createWallet: async () => {},
  switchWallet: async () => {},
  getBalance: async () => [],
});

interface WalletProviderProps {
  children: React.ReactNode;
}

function generateBasicAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  const token = btoa(credentials); // Use btoa for client-side base64 encoding
  return `Basic ${token}`;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const { create: createWallet } = useEmbeddedEthereumWallet(); // EVM
  const { createWallet: createOtherChainWallet } = useCreateWallet(); // Stellar

  const {
    balances: stellarBalances,
    isConnected: stellarConnected,
    refreshAccount,
    setPublicKey,
  } = useStellar();

  const [isCreating, setIsCreating] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const [balances, setBalances] = useState<WalletBalanceInfo[]>([]);

  const [preferredPrimaryChain, setPreferredPrimaryChainState] =
    useState<AvailableChain>("ethereum");

  // Computed values
  const wallets = useMemo<
    {
      id: string;
      address: string;
      chain: AvailableChain;
      isConnected: boolean;
    }[]
  >(() => {
    if (!user?.linked_accounts) return [];
    return user.linked_accounts
      .filter(
        (account): account is PrivyEmbeddedWalletAccount =>
          account.type === "wallet" &&
          account.wallet_client_type === "privy" &&
          (account.chain_type === "ethereum" ||
            account.chain_type === "stellar")
      )
      .map((account) => ({
        id: account.id as string,
        address: account.address,
        chain: account.chain_type as AvailableChain,
        isConnected: true,
      }));
  }, [user]);

  // Storage key depends on the set of wallet addresses to scope per user
  const preferredChainStorageKey = useMemo(() => {
    const addresses = wallets
      .map((w) => w && w.address)
      .filter(Boolean)
      .sort()
      .join("_");
    return addresses
      ? `preferred_primary_chain_${addresses}`
      : "preferred_primary_chain";
  }, [wallets]);

  const primaryWallet = useMemo(() => {
    if (wallets.length === 0) return null;
    const match = wallets.find((w) => w && w.chain === preferredPrimaryChain);
    return match ?? wallets[0] ?? null;
  }, [wallets, preferredPrimaryChain]);

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

  const handleCreateWallet = useCallback(
    async (chain: AvailableChain) => {
      if (!user) {
        return;
      }

      setIsCreating(true);
      try {
        // Check if user has any embedded wallet for the specific chain
        const hasEmbeddedWalletForChain =
          (user?.linked_accounts ?? []).filter(
            (account): account is PrivyEmbeddedWalletAccount =>
              account.type === "wallet" &&
              account.wallet_client_type === "privy" &&
              account.chain_type === chain
          ).length > 0;

        // If user doesn't have a wallet for this specific chain, create it
        if (!hasEmbeddedWalletForChain) {
          if (chain === "ethereum") {
            await createWallet({
              createAdditional: true,
            });
          } else {
            await createOtherChainWallet({
              chainType: chain,
            });
          }

          console.log(`[WALLET CREATED] for chain ${chain}`);

          await refreshUser();
        }
      } catch (error) {
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [user]
  );

  // Auto-create Ethereum wallet for fresh users
  useEffect(() => {
    const createDefaultWallet = async () => {
      if (!user || isCreating) return;

      // Check if user has any embedded wallets at all
      const hasAnyEmbeddedWallet =
        (user?.linked_accounts ?? []).filter(
          (account): account is PrivyEmbeddedWalletAccount =>
            account.type === "wallet" && account.wallet_client_type === "privy"
        ).length > 0;

      // If fresh user (no embedded wallets), create Ethereum wallet by default
      if (!hasAnyEmbeddedWallet) {
        try {
          await handleCreateWallet("ethereum");
        } catch (error) {
          console.error("Failed to create default Ethereum wallet:", error);
        }
      }
    };

    createDefaultWallet();
  }, [user, isCreating]);

  const setPreferredPrimaryChain = useCallback(
    async (chain: "ethereum" | "stellar") => {
      setPreferredPrimaryChainState(chain);
      // @TODO: Hit API to update Primary Wallet
      await setItem(preferredChainStorageKey, chain);
    },
    []
  );

  const handleSwitchWallet = useCallback(async () => {
    try {
      if (!user) return;

      const preferredBeforeChanged =
        preferredPrimaryChain === "ethereum" ? "stellar" : "ethereum";
      const isPreferredExist =
        user.linked_accounts.filter(
          (account) =>
            account.type === "wallet" &&
            account.chain_type === preferredBeforeChanged
        ).length > 0;

      console.log("\n\n", { preferredBeforeChanged, isPreferredExist }, "\n\n");

      if (!isPreferredExist) {
        await handleCreateWallet(preferredBeforeChanged);
      }
      // @TODO: Update Merchant Profile Primary Wallet

      toastSuccess("Wallet switched successfully!");
    } catch (error) {
      console.log("[Switch Wallet]", error);
      toastError("Failed to switch wallet");
    }
  }, [user, preferredPrimaryChain]);

  const getBalance = useCallback(async () => {
    try {
      if (primaryWallet && primaryWallet.id) {
        if (preferredPrimaryChain === "ethereum") {
          const headers = {
            "privy-app-id": process.env.EXPO_PUBLIC_PRIVY_APP_ID || "",
            Authorization: generateBasicAuthHeader(
              process.env.EXPO_PUBLIC_PRIVY_APP_ID || "",
              process.env.EXPO_PUBLIC_PRIVY_APP_SECRET || ""
            ),
            "Content-Type": "application/json",
          };

          // Fetch Native balance
          const nativeResp = await axios.get(
            `https://api.privy.io/v1/wallets/${primaryWallet.id}/balance`,
            {
              params: {
                asset: "eth",
                chain: "base",
              },
              headers,
            }
          );

          // Fetch USDC balance
          const usdcResp = await axios.get(
            `https://api.privy.io/v1/wallets/${primaryWallet.id}/balance`,
            {
              params: {
                asset: "usdc",
                chain: "base",
              },
              headers,
            }
          );

          const allBalances = [
            ...(nativeResp.data.balances || []),
            ...(usdcResp.data.balances || []),
          ];

          setBalances(allBalances);
          return allBalances;
        } else if (preferredPrimaryChain === "stellar" && stellarConnected) {
          console.log("[Getting Stellar Wallet Balance]", stellarBalances);
          await refreshAccount();
          setBalances(stellarBalances);
          return stellarBalances;
        }
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      throw error;
    } finally {
      setIsBalanceLoading(false);
    }
  }, [primaryWallet, preferredPrimaryChain, stellarConnected, stellarBalances]);

  useEffect(() => {
    if (primaryWallet && primaryWallet.chain === "stellar") {
      setPublicKey(primaryWallet.address);
    }
  }, [primaryWallet]);

  const contextValue = useMemo(
    () => ({
      isCreating,
      isBalanceLoading,
      balances,
      hasWallet: wallets.length > 0 && !!wallets[0]?.address,
      wallets,
      primaryWallet,
      preferredPrimaryChain,
      setPreferredPrimaryChain,
      createWallet: handleCreateWallet,
      switchWallet: handleSwitchWallet,
      getBalance,
    }),
    [
      isCreating,
      isBalanceLoading,
      balances,
      wallets,
      primaryWallet,
      preferredPrimaryChain,
      setPreferredPrimaryChain,
      handleCreateWallet,
      handleSwitchWallet,
      getBalance,
    ]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
