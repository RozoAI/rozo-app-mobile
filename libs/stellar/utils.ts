import { WalletBalanceInfo } from "@/providers/wallet.provider";
import { StellarConfig } from "./config";

/**
 * Stellar balance interface matching the API response
 */
export interface StellarBalance {
  balance: string;
  buying_liabilities: string;
  selling_liabilities: string;
  asset_type: "native" | "credit_alphanum4" | "credit_alphanum12";
  asset_code?: string;
  asset_issuer?: string;
}

/**
 * Formatted balance for display
 */
export interface FormattedBalance {
  code: string;
  balance: string;
  formattedBalance: string;
  decimals: number;
  isNative: boolean;
}

/**
 * Wallet balance info matching the wallet provider format
 */
export interface StellarWalletBalanceInfo {
  chain: string;
  asset: string;
  raw_value: string;
  raw_value_decimals: number;
  display_values: {
    usdc?: string;
    native?: string;
  };
}

/**
 * Format a stellar balance amount based on asset decimals
 */
export function formatStellarAmount(amount: string, decimals: number): string {
  const numericAmount = parseFloat(amount);

  if (isNaN(numericAmount)) {
    return "0";
  }

  // Format with appropriate decimal places
  return numericAmount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Get asset configuration for a given balance
 */
export function getAssetConfigForBalance(balance: StellarBalance) {
  if (balance.asset_code) {
    return StellarConfig.getAssetByCode(balance.asset_code);
  }

  return undefined;
}

/**
 * Format stellar balances for display
 */
export function formatStellarBalances(
  balances: StellarBalance[]
): FormattedBalance[] {
  return (
    balances
      // .filter((balance) => parseFloat(balance.balance) > 0) // Only show non-zero balances
      .map((balance) => {
        const assetConfig = getAssetConfigForBalance(balance);
        const isNative = balance.asset_type === "native";
        const code = isNative ? "XLM" : balance.asset_code || "Unknown";
        const decimals = assetConfig?.decimals || 7;

        return {
          code,
          balance: balance.balance,
          formattedBalance: formatStellarAmount(balance.balance, decimals),
          decimals,
          isNative,
        };
      })
      .sort((a, b) => {
        // Sort native asset first, then alphabetically
        if (a.isNative && !b.isNative) return -1;
        if (!a.isNative && b.isNative) return 1;
        return a.code.localeCompare(b.code);
      })
  );
}

/**
 * Format stellar balances in WalletBalanceInfo format
 * Only returns XLM (native) and USDC balances
 */
export function formatStellarBalancesAsWalletInfo(
  balances: StellarBalance[]
): WalletBalanceInfo[] {
  return balances
    .filter((balance) => {
      const isNative = balance.asset_type === "native";
      const isUsdc = balance.asset_code === "USDC";
      return isNative || isUsdc;
    })
    .map((balance) => {
      const assetConfig = getAssetConfigForBalance(balance);
      const isNative = balance.asset_type === "native";
      const asset = isNative ? "xlm" : "usdc";
      const decimals = assetConfig?.decimals || 7;
      const formattedBalance = formatStellarAmount(balance.balance, decimals);

      return {
        chain: "stellar",
        asset,
        raw_value: balance.balance,
        raw_value_decimals: decimals,
        display_values: {
          native: isNative ? formattedBalance : undefined,
          usdc: !isNative ? formattedBalance : undefined,
        },
      };
    })
    .sort((a, b) => {
      // Sort XLM first, then USDC
      if (a.asset === "xlm" && b.asset !== "xlm") return -1;
      if (a.asset !== "xlm" && b.asset === "xlm") return 1;
      return a.asset.localeCompare(b.asset);
    });
}

/**
 * Get the total balance value (for native asset only)
 */
export function getNativeBalance(balances: StellarBalance[]): string | null {
  const nativeBalance = balances.find(
    (balance) => balance.asset_type === "native"
  );
  return nativeBalance ? nativeBalance.balance : null;
}
