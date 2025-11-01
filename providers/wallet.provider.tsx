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
import { useUpdateProfile } from "@/modules/api/api";
import { MerchantDefaultTokenID } from "@/modules/api/schema/merchant";
import {
  PrivyEmbeddedWalletAccount,
  useEmbeddedEthereumWallet,
} from "@privy-io/expo";
import axios from "axios";
import { useAuth } from "./auth.provider";
import { useMerchant } from "./merchant.provider";
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

interface WalletContextProps {
  isCreating: boolean;
  isBalanceLoading: boolean;
  isSwitching: boolean;
  hasWallet: boolean;
  wallets: GenericWallet[];
  balances: WalletBalanceInfo[];
  primaryWallet: GenericWallet | null;
  preferredPrimaryChain: MerchantDefaultTokenID | undefined;
  setPreferredPrimaryChain: (chain: MerchantDefaultTokenID) => Promise<void>;
  createWallet: (chain: MerchantDefaultTokenID) => Promise<void>;
  switchWallet: () => Promise<void>;
  getBalance: () => Promise<WalletBalanceInfo[] | undefined>;
}

const WalletContext = createContext<WalletContextProps>({
  isCreating: false,
  isBalanceLoading: false,
  isSwitching: false,
  hasWallet: false,
  wallets: [],
  balances: [],
  primaryWallet: null,
  preferredPrimaryChain: undefined,
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
  const { merchant, refetchMerchant } = useMerchant();

  const { error: toastError, success: toastSuccess } = useToast();
  const { create: createWallet } = useEmbeddedEthereumWallet(); // EVM
  const { createWallet: createOtherChainWallet } = useCreateWallet(); // Stellar

  const {
    balances: stellarBalances,
    isConnected: stellarConnected,
    refreshAccount,
    setPublicKey,
  } = useStellar();

  const { mutateAsync: updateProfile } = useUpdateProfile();

  const [isCreating, setIsCreating] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [balances, setBalances] = useState<WalletBalanceInfo[]>([]);
  const [preferredPrimaryChain, setPreferredPrimaryChainState] = useState<
    MerchantDefaultTokenID | undefined
  >();

  // Computed values
  const wallets = useMemo<
    {
      id: string;
      address: string;
      chain: "ethereum" | "stellar";
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
        chain: account.chain_type as "ethereum" | "stellar",
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

    const chain =
      preferredPrimaryChain === "USDC_BASE" ? "ethereum" : "stellar";
    const match = wallets.find((w) => w && w.chain === chain);
    return match ?? wallets[0] ?? null;
  }, [wallets, preferredPrimaryChain]);

  useEffect(() => {
    if (merchant) {
      setPreferredPrimaryChain(merchant.default_token_id);
    } else {
      refetchMerchant();
    }
  }, [merchant, refetchMerchant]);

  // Load preferred chain once wallets are known
  useEffect(() => {
    const stored = getItem<MerchantDefaultTokenID>(preferredChainStorageKey);

    if (stored === "USDC_BASE" || stored === "USDC_XLM") {
      setPreferredPrimaryChainState(stored);
    } else {
      // default to ethereum (Base)
      setPreferredPrimaryChainState("USDC_BASE");
    }
  }, [preferredChainStorageKey]);

  const handleCreateWallet = useCallback(
    async (chain: "ethereum" | "stellar") => {
      if (!user || !merchant) {
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
            const { wallet } = await createOtherChainWallet({
              chainType: chain,
            });

            await updateProfile({
              email: merchant.email,
              display_name: merchant.display_name,
              logo: merchant.logo_url,
              stellar_address: wallet.address,
            });
          }

          console.log(`[WALLET CREATED] for chain ${chain}`);

          await refreshUser();
          await refetchMerchant();
        }
      } catch (error) {
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [user, merchant]
  );

  // Auto-create Ethereum wallet for fresh users
  useEffect(() => {
    const createDefaultWallet = async () => {
      if (!user || isCreating) return;

      // Check if user has any embedded wallets at all
      const hasAnyEmbeddedWallet =
        (user?.linked_accounts ?? []).filter(
          (account) =>
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
    async (token: MerchantDefaultTokenID) => {
      console.log("[setPreferredPrimaryChain] token:", token);
      setPreferredPrimaryChainState(token);
      await setItem(preferredChainStorageKey, token);
    },
    [preferredChainStorageKey]
  );

  const createWalletByToken = useCallback(
    async (token: MerchantDefaultTokenID) => {
      const chain: "ethereum" | "stellar" =
        token === "USDC_BASE" ? "ethereum" : "stellar";
      await handleCreateWallet(chain);
    },
    []
  );

  const handleSwitchWallet = useCallback(async () => {
    try {
      console.log("[handleSwitchWallet] user:", user);
      console.log("[handleSwitchWallet] merchant:", merchant);
      if (!user || !merchant) return;
      setIsSwitching(true);
      const preferredBeforeChanged =
        preferredPrimaryChain === "USDC_BASE" ? "stellar" : "ethereum";
      const isPreferredExist =
        user.linked_accounts.filter(
          (account) =>
            account.type === "wallet" &&
            account.chain_type === preferredBeforeChanged
        ).length > 0;

      if (!isPreferredExist) {
        await handleCreateWallet(preferredBeforeChanged);
        // Refresh user again to ensure we have the latest wallet data
        // before proceeding with the switch
        await refreshUser();
        // Small delay to ensure React processes the state update
        // This ensures wallets memo recomputes with the new user data
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const newPrimaryChain =
        preferredPrimaryChain === "USDC_BASE" ? "USDC_XLM" : "USDC_BASE";
      console.log("[handleSwitchWallet] newPrimaryChain:", newPrimaryChain);
      await updateProfile({
        email: merchant.email,
        display_name: merchant.display_name,
        logo: merchant.logo_url,
        default_token_id: newPrimaryChain,
      });
      setPreferredPrimaryChain(newPrimaryChain);
      await refetchMerchant();
      toastSuccess("Wallet switched successfully!");
    } catch (error) {
      console.log("[Switch Wallet]", error);
      toastError("Failed to switch wallet");
    } finally {
      setIsSwitching(false);
    }
  }, [user, merchant, preferredPrimaryChain, refreshUser]);

  const getBalance = useCallback(async () => {
    try {
      setIsBalanceLoading(true);
      if (primaryWallet && primaryWallet.id) {
        if (preferredPrimaryChain === "USDC_BASE") {
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
        } else if (preferredPrimaryChain === "USDC_XLM" && stellarConnected) {
          const latestBalances = await refreshAccount();
          setBalances(latestBalances);
          return latestBalances;
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

  // Auto refresh balances when chain preference or primary wallet changes
  useEffect(() => {
    setIsBalanceLoading(true);
    getBalance().catch(() => setIsBalanceLoading(false));
  }, [preferredPrimaryChain, primaryWallet?.id]);

  // When switching to Stellar, wait for connection then refresh
  useEffect(() => {
    if (preferredPrimaryChain === "USDC_XLM" && stellarConnected) {
      setIsBalanceLoading(true);
      getBalance().catch(() => setIsBalanceLoading(false));
    }
  }, [stellarConnected, preferredPrimaryChain]);

  const contextValue = useMemo(
    () => ({
      isCreating,
      isBalanceLoading,
      isSwitching,
      balances,
      hasWallet: wallets.length > 0 && !!wallets[0]?.address,
      wallets,
      primaryWallet,
      preferredPrimaryChain,
      setPreferredPrimaryChain,
      createWallet: createWalletByToken,
      switchWallet: handleSwitchWallet,
      getBalance,
    }),
    [
      isCreating,
      isBalanceLoading,
      isSwitching,
      balances,
      wallets,
      primaryWallet,
      preferredPrimaryChain,
      setPreferredPrimaryChain,
      createWalletByToken,
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
