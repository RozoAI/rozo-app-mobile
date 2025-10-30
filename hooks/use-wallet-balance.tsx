import { useCallback, useEffect, useMemo, useState } from "react";

import { type TokenBalanceResult } from "@/libs/tokens";
import { useApp } from "@/providers/app.provider";

import { useWallet } from "@/providers";

type UseWalletBalanceResult = {
  balance: TokenBalanceResult | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useWalletBalance(): UseWalletBalanceResult {
  const { primaryWallet, preferredPrimaryChain, merchantToken } = useApp();

  const [balance, setBalance] = useState<TokenBalanceResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { getBalance } = useWallet();

  const fetchBalance = useCallback(async () => {
    if (!primaryWallet) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const balances = await getBalance();
      console.log({ balances });
      const usdcBalance = balances?.find((balance) => balance.asset === "usdc");

      setBalance({
        balance: usdcBalance?.display_values.usdc ?? "0",
        formattedBalance: usdcBalance?.display_values.usdc ?? "0",
        token: merchantToken,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setIsLoading(false);
    }
  }, [primaryWallet, merchantToken]);

  // Fetch balance on component mount and when dependencies change
  useEffect(() => {
    if (primaryWallet && preferredPrimaryChain) {
      fetchBalance();
    }
  }, [primaryWallet, preferredPrimaryChain, fetchBalance]); // More specific dependencies

  return useMemo(
    () => ({
      balance,
      isLoading,
      error,
      refetch: fetchBalance,
    }),
    [balance, isLoading, error]
  );
}
