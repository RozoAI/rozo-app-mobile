import { useEffect, useMemo, useState } from "react";

import { type TokenBalanceResult } from "@/libs/tokens";
import { useApp } from "@/providers/app.provider";

import { useEVMWallet } from "./use-evm-wallet";

type UseWalletBalanceResult = {
  balance: TokenBalanceResult | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useWalletBalance(): UseWalletBalanceResult {
  const { primaryWallet, merchantToken } = useApp();

  const [balance, setBalance] = useState<TokenBalanceResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { getBalance } = useEVMWallet();

  const fetchBalance = async () => {
    if (!primaryWallet) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (primaryWallet) {
        const balances = await getBalance();

        const usdcBalance = balances?.find(
          (balance) => balance.asset === "usdc"
        );

        if (usdcBalance) {
          setBalance({
            balance: usdcBalance.display_values.usdc ?? "0",
            formattedBalance: usdcBalance.display_values.usdc ?? "0",
            token: merchantToken,
            balanceRaw: BigInt(usdcBalance.raw_value),
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch balance on component mount and when dependencies change
  useEffect(() => {
    if (primaryWallet) {
      fetchBalance();
    }
  }, [primaryWallet]); // More specific dependencies

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
