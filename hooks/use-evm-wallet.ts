import {
  type PrivyEmbeddedWalletAccount,
  type PrivyUser,
  useEmbeddedEthereumWallet,
  usePrivy,
  usePrivyClient,
} from "@privy-io/expo";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

export type EVMBalanceInfo = {
  chain: string;
  asset: string;
  raw_value: string;
  raw_value_decimals: number;
  display_values: {
    usdc?: string;
    eth?: string;
  };
};

export type EVMWallet = {
  id: string;
  address: string;
  chain_type: string;
  authorization_threshold: number;
  owner_id: string | null;
  additional_signers: string[];
  created_at: number;
};

export function useEVMWallet() {
  const { user: privyUser, getAccessToken } = usePrivy();
  const { wallets, create: createWallet } = useEmbeddedEthereumWallet();

  const client = usePrivyClient();

  const [isCreating, setIsCreating] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [balances, setBalances] = useState<EVMBalanceInfo[]>([]);
  const [user, setUser] = useState<PrivyUser | null>(privyUser);

  // Update user when privyUser changes - only if actually different
  useEffect(() => {
    if (privyUser !== user) {
      setUser(privyUser);
    }
  }, [privyUser?.id, privyUser?.linked_accounts, privyUser, user]); // Include all dependencies
  const [wallet, setWallet] = useState<EVMWallet | null>(null);

  const evmEmbeddedWallets = useMemo<PrivyEmbeddedWalletAccount[]>(
    () =>
      (user?.linked_accounts ?? []).filter(
        (account): account is PrivyEmbeddedWalletAccount =>
          account.type === "wallet" &&
          account.wallet_client_type === "privy" &&
          account.chain_type === "ethereum"
      ),
    [user]
  );

  const refreshUser = useCallback(async () => {
    const fetchedUser = await client.user.get();
    if (fetchedUser) {
      setUser(fetchedUser.user);
    }
  }, [client]);

  const handleCreateWallet = useCallback(async () => {
    // Only create wallet if user doesn't have an embedded wallet
    if (evmEmbeddedWallets.length > 0) {
      return;
    }

    setIsCreating(true);
    try {
      await createWallet({
        createAdditional: true,
      });
      await refreshUser();
    } catch (error) {
      console.error("Error creating wallet:", error);
    } finally {
      setIsCreating(false);
    }
  }, [createWallet, refreshUser, evmEmbeddedWallets.length]);

  function generateBasicAuthHeader(username: string, password: string): string {
    const credentials = `${username}:${password}`;
    const token = btoa(credentials); // Use btoa for client-side base64 encoding
    return `Basic ${token}`;
  }

  /**
   * Fetches the first Ethereum wallet from Privy API using app credentials.
   * @param appId Privy App ID
   * @param appSecret Privy App Secret
   * @returns The first Ethereum wallet object or undefined
   */
  const getWallet = async () => {
    try {
      const response = await axios.get("https://api.privy.io/v1/wallets", {
        params: {
          chain_type: "ethereum",
          limit: 2,
        },
        headers: {
          "privy-app-id": process.env.EXPO_PUBLIC_PRIVY_APP_ID || "",
          "Content-Type": "application/json",
          Authorization: generateBasicAuthHeader(
            process.env.EXPO_PUBLIC_PRIVY_APP_ID || "",
            process.env.EXPO_PUBLIC_PRIVY_APP_SECRET || ""
          ),
        },
      });

      console.log("Wallet data fetched", response.data?.data);

      if (response.data?.data.length === 1) {
        const walletData = (response.data?.data || []).find(
          (wallet: EVMWallet) => wallet.chain_type === "ethereum"
        );

        setWallet(walletData);
        return walletData;
      } else if (response.data?.data.length > 1) {
        const walletData = (response.data?.data || []).filter(
          (wallet: EVMWallet) => wallet.chain_type === "ethereum"
        );

        setWallet(walletData[1]);
        return walletData[1];
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    }
  };

  const getBalance = async () => {
    try {
      const walletData = await getWallet();

      if (walletData) {
        const accessToken = await getAccessToken();

        const headers = {
          "privy-app-id": process.env.EXPO_PUBLIC_PRIVY_APP_ID || "",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        };

        // Fetch ETH balance
        const ethResp = await axios.get(
          `https://api.privy.io/v1/wallets/${walletData?.id}/balance`,
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
          `https://api.privy.io/v1/wallets/${walletData?.id}/balance`,
          {
            params: {
              asset: "usdc",
              chain: "base",
            },
            headers,
          }
        );

        const ethData = ethResp.data;
        const usdcData = usdcResp.data;
        console.log("Wallet :", walletData);
        console.log("ETH data:", ethData);
        console.log("USDC data:", usdcData);

        const allBalances = [
          ...(ethData.balances || []),
          ...(usdcData.balances || []),
        ];

        setBalances(allBalances);
        return allBalances;
      }
    } catch (error) {
      throw error;
    } finally {
      setIsBalanceLoading(false);
    }
  };

  const ethBalance = useMemo(() => {
    return balances.find((balance) => balance.asset === "eth") as
      | EVMBalanceInfo
      | undefined;
  }, [balances]);

  const usdcBalance = useMemo(() => {
    return balances.find((balance) => balance.asset === "usdc") as
      | EVMBalanceInfo
      | undefined;
  }, [balances]);

  return {
    isCreating,
    isBalanceLoading,
    hasEvmWallet:
      evmEmbeddedWallets.length > 0 && !!evmEmbeddedWallets[0].address,
    wallets: evmEmbeddedWallets,
    wallet,
    handleCreateWallet,
    getWallet,
    getBalance,
    balances,
    ethBalance,
    usdcBalance,
  };
}
