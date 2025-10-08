import {
  PrivyEmbeddedWalletAccount,
  type PrivyUser,
  useEmbeddedEthereumWallet,
  usePrivy,
  usePrivyClient,
} from "@privy-io/expo";
import axios from "axios";
import { fetch } from "expo/fetch";
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
  const { create: createWallet } = useEmbeddedEthereumWallet();

  const client = usePrivyClient();

  const [isCreating, setIsCreating] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [balances, setBalances] = useState<EVMBalanceInfo[]>([]);
  const [user, setUser] = useState<PrivyUser | null>(privyUser);
  const [wallet, setWallet] = useState<EVMWallet | null>(null);

  // Update user when privyUser changes - only if actually different
  useEffect(() => {
    if (privyUser !== user) {
      setUser(privyUser);
    }
  }, [privyUser, user]);

  const wallets = useMemo(() => {
    if (!user?.linked_accounts) return [];
    return user.linked_accounts
      .filter((account: any) => account.type === "wallet")
      .map((wallet: any) => ({
        id: wallet.id,
        address: wallet.address,
        chain: wallet.chainType || "ethereum",
        isConnected: true,
      }));
  }, [user?.linked_accounts]);

  const primaryWallet = useMemo(() => {
    return wallets.length > 0 ? wallets[0] : null;
  }, [wallets]);

  const refreshUser = useCallback(async () => {
    const fetchedUser = await client.user.get();
    if (fetchedUser) {
      setUser(fetchedUser.user as PrivyUser);
    }
  }, [client]);

  const handleCreateWallet = async () => {
    if (!privyUser) {
      console.log("No user found");
      return;
    }

    // Only create wallet if user doesn't have an embedded wallet
    if (wallets.length > 0) {
      console.log("Wallet already exists");
      return;
    }

    setIsCreating(true);
    try {
      const hasEmbeddedWallet =
        (user?.linked_accounts ?? []).filter(
          (account): account is PrivyEmbeddedWalletAccount =>
            account.type === "wallet" &&
            account.wallet_client_type === "privy" &&
            account.chain_type === "ethereum"
        ).length > 0;

      if (!hasEmbeddedWallet) {
        await createWallet({
          createAdditional: true,
        });
      }

      await refreshUser();
    } catch (error) {
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

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
      console.log("Wallet data:", primaryWallet);

      console.log("user:", JSON.stringify(user, null, 2));

      if (primaryWallet) {
        const headers = {
          "privy-app-id": process.env.EXPO_PUBLIC_PRIVY_APP_ID || "",
          Authorization: generateBasicAuthHeader(
            process.env.EXPO_PUBLIC_PRIVY_APP_ID || "",
            process.env.EXPO_PUBLIC_PRIVY_APP_SECRET || ""
          ),
          "Content-Type": "application/json",
        };

        // Fetch ETH balance
        const ethResp = await fetch(
          `https://api.privy.io/v1/wallets/${primaryWallet.id}/balance?asset=eth&chain=base`,
          {
            method: "GET",
            headers,
          }
        );

        // Fetch USDC balance
        const usdcResp = await fetch(
          `https://api.privy.io/v1/wallets/${primaryWallet.id}/balance?asset=usdc&chain=base`,
          {
            method: "GET",
            headers,
          }
        );

        const ethData = await ethResp.json();
        const usdcData = await usdcResp.json();

        console.log("ETH data:", JSON.stringify(ethData, null, 2));
        console.log("USDC data:", JSON.stringify(usdcData, null, 2));

        const allBalances = [
          ...(ethData.balances || []),
          ...(usdcData.balances || []),
        ];

        setBalances(allBalances);
        return allBalances;
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
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
    hasEvmWallet: wallets.length > 0 && !!wallets[0].address,
    wallets: wallets,
    primaryWallet,
    wallet,
    handleCreateWallet,
    getWallet,
    getBalance,
    balances,
    ethBalance,
    usdcBalance,
  };
}
