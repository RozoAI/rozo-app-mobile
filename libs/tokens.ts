import type { defineChain } from "viem";
import { base } from "viem/chains";

/**
 * Basic token type definition
 */
export type BaseToken = {
  readonly key: string;
  readonly networkKey: string;
  readonly address: string;
  readonly decimal: number;
  readonly maxDecimals: number;
  readonly label: string;
};

/**
 * Network type definition
 */
export type Network = {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly chain: ReturnType<typeof defineChain>;
  readonly networkId: string;
  readonly feeSymbol: string;
  readonly feeDecimal: number;
  readonly transactionUrl: string;
  readonly tokens: readonly BaseToken[];
};

/**
 * Enhanced token type that includes its parent network
 */
export type Token = BaseToken & {
  readonly network: Network;
};

/**
 * Result of a token balance query
 */
export type TokenBalanceResult = {
  balance: string;
  balanceRaw: bigint;
  formattedBalance: string;
  token?: Token;
};

/**
 * Result of a token transfer operation
 */
export type TokenTransferResult = {
  success: boolean;
  transactionHash?: string;
  signature?: string;
  error?: Error;
};

/**
 * Network data with supported tokens
 */
const networksData: readonly Network[] = [
  {
    key: "base",
    label: "Base",
    description: "Fast, scalable, cost-effective.",
    networkId: "0x2105",
    feeSymbol: "Base",
    feeDecimal: 18,
    transactionUrl: "https://basescan.org/tx",
    chain: base,
    tokens: [
      {
        key: "USDC_BASE",
        label: "USDC",
        networkKey: "base",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        decimal: 6,
        maxDecimals: 2,
      },
    ],
  },
] as const;

/**
 * Export networks for use in other modules
 */
export const networks = networksData;

/**
 * Enhanced tokens list with network information included
 */
export const tokens: readonly Token[] = networksData.flatMap((network) =>
  network.tokens.map((token) => ({
    ...token,
    network,
  }))
);

/**
 * Default token used in the application (with network information)
 * USDC Base is the default for new merchants
 */
export const defaultToken = tokens.find((token) => token.key === "USDC_BASE");

/**
 * Helper function to get a token's network by token key
 */
export function getTokenNetwork(tokenKey: string): Network | undefined {
  const token = tokens.find((t) => t.key === tokenKey);
  return token?.network;
}

/**
 * Helper function to get all tokens for a specific network
 */
export function getNetworkTokens(networkKey: string): readonly Token[] {
  return tokens.filter((token) => token.networkKey === networkKey);
}
