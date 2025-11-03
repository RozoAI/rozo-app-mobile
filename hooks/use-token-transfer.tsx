/**
 * Hook for handling token transfers
 *
 * This hook provides functions for transferring tokens using both standard
 * and gasless (ZeroDev) methods, with loading and error state management.
 */

import { useEmbeddedEthereumWallet } from "@privy-io/expo";
import { useCallback, useMemo, useState } from "react";
import { type Address } from "viem";

import { type TokenTransferResult } from "@/libs/tokens";
import { getShortId } from "@/libs/utils";
import {
  useWalletStellarTransfer,
  useWalletTransfer,
} from "@/modules/api/api/merchant/wallets";

import { useMerchant, useWallet } from "@/providers";
import { useStellar } from "@/providers/stellar.provider";

type TransferStatus = {
  isLoading: boolean;
  error: string | null;
  transactionHash: string | null;
  signature: string | null;
  success: boolean;
};

type TransferOptions = {
  toAddress: Address;
  amount: string;
  useGasless?: boolean;
  customMessage?: string;
  pinCode?: string; // Optional PIN code for authorization
};

type UseTokenTransferResult = {
  isAbleToTransfer: boolean;
  transfer: (
    options: TransferOptions
  ) => Promise<TokenTransferResult | undefined>;
  status: TransferStatus;
  resetStatus: () => void;
};

export function useTokenTransfer(): UseTokenTransferResult {
  const { merchantToken } = useMerchant();
  const { mutateAsync: walletTransfer } = useWalletTransfer();
  const { mutateAsync: walletStellarTransfer } = useWalletStellarTransfer();
  const { primaryWallet, preferredPrimaryChain } = useWallet();

  const { isConnected } = useStellar();

  const walletsPrivy = useEmbeddedEthereumWallet();

  const [status, setStatus] = useState<TransferStatus>({
    isLoading: false,
    error: null,
    transactionHash: null,
    signature: null,
    success: false,
  });

  /**
   * Reset the transfer status
   */
  const resetStatus = useCallback(() => {
    setStatus({
      isLoading: false,
      error: null,
      transactionHash: null,
      signature: null,
      success: false,
    });
  }, []);

  /**
   * Transfer tokens to an address
   *
   * @param toAddress - Recipient address
   * @param amount - Amount to transfer as a string
   * @param useGasless - Whether to use gasless transactions via ZeroDev
   * @returns Result of the transfer operation
   */
  const transfer = async (options: TransferOptions) => {
    const { toAddress, amount } = options;

    console.log("[useTokenTransfer] transfer called with:", options);

    setStatus({
      isLoading: true,
      error: null,
      transactionHash: null,
      signature: null,
      success: false,
    });

    try {
      if (preferredPrimaryChain === "USDC_BASE" && primaryWallet) {
        if (!walletsPrivy.wallets[0] || !merchantToken) {
          const error = new Error("Wallet or token not available");
          console.error(
            "[useTokenTransfer] Error: Wallet or token not available"
          );
          setStatus({
            isLoading: false,
            error: error.message,
            transactionHash: null,
            signature: null,
            success: false,
          });
          return { success: false, error };
        }

        const privyWallet = walletsPrivy.wallets[0];
        const provider = await privyWallet.getProvider();
        const accounts = await provider.request({
          method: "eth_requestAccounts",
        });
        console.log("[useTokenTransfer] Accounts:", accounts);
        console.log("[useTokenTransfer] Merchant Token:", merchantToken);
        const signature = await provider.request({
          method: "personal_sign",
          params: [
            `- From: ${getShortId(privyWallet.address, 6, 4)}
  - To: ${getShortId(toAddress, 6, 4)}
  - Amount: ${amount} ${merchantToken.label}
  - Network: ${merchantToken.network.chain.name}`,
            accounts[0],
          ],
        });

        console.log("[useTokenTransfer] Signature:", signature);

        console.log("[useTokenTransfer] Payload:", {
          walletId: primaryWallet.id,
          recipientAddress: toAddress,
          amount: parseFloat(amount),
          signature,
        });

        // Use the wallet transfer API for Privy mode
        const response = await walletTransfer({
          walletId: primaryWallet.id,
          recipientAddress: toAddress,
          amount: parseFloat(amount),
          signature,
          pinCode: options.pinCode, // Pass PIN code if provided
        });

        console.log("[useTokenTransfer] walletTransfer response:", response);

        if (response.success && response.transaction) {
          setStatus({
            isLoading: false,
            error: null,
            transactionHash: response.transaction.hash,
            signature: null,
            success: true,
          });

          console.log(
            "[useTokenTransfer] Transfer successful. Tx hash:",
            response.transaction.hash
          );

          return {
            success: true,
            error: undefined,
            signature: undefined,
            transactionHash: response.transaction.hash,
          };
        } else {
          const error = new Error(response.message || "Transfer failed");
          console.error("[useTokenTransfer] Transfer failed:", error.message);
          setStatus({
            isLoading: false,
            error: error.message,
            transactionHash: null,
            signature: null,
            success: false,
          });
          return { success: false, error };
        }
      } else if (preferredPrimaryChain === "USDC_XLM" && isConnected) {
        if (!primaryWallet) {
          const error = new Error("Wallet not available");
          console.error(
            "[useTokenTransfer] Error: Wallet not available for Stellar transfer"
          );
          setStatus({
            isLoading: false,
            error: error.message,
            transactionHash: null,
            signature: null,
            success: false,
          });
          return { success: false, error };
        }

        console.log("[useTokenTransfer] Stellar transfer payload:", {
          walletId: primaryWallet.id,
          destinationAddress: toAddress,
          amount: amount,
        });

        const response = await walletStellarTransfer({
          walletId: primaryWallet.id,
          destinationAddress: toAddress,
          amount: amount,
          pinCode: options.pinCode, // Pass PIN code if provided
        });

        console.log(
          "[useTokenTransfer] walletStellarTransfer response:",
          response
        );

        if (response.success && response.result?.successful) {
          setStatus({
            isLoading: false,
            error: null,
            transactionHash: response.result.hash,
            signature: null,
            success: true,
          });

          console.log(
            "[useTokenTransfer] Stellar transfer successful. Tx hash:",
            response.result.hash
          );

          return {
            success: true,
            error: undefined,
            signature: undefined,
            transactionHash: response.result.hash,
          };
        } else {
          const errorMessage =
            "error" in response ? response.error : "Transfer failed";
          const error = new Error(errorMessage);
          console.error(
            "[useTokenTransfer] Stellar transfer failed:",
            errorMessage
          );
          setStatus({
            isLoading: false,
            error: errorMessage,
            transactionHash: null,
            signature: null,
            success: false,
          });
          return { success: false, error };
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to transfer tokens";
      console.error("[useTokenTransfer] Exception:", err);
      setStatus({
        isLoading: false,
        error: errorMessage,
        transactionHash: null,
        signature: null,
        success: false,
      });
      return {
        success: false,
        error: err instanceof Error ? err : new Error(errorMessage),
      };
    }
  };

  const isAbleToTransfer = useMemo(() => {
    return !!(
      (preferredPrimaryChain === "USDC_BASE"
        ? (walletsPrivy.wallets || []).length > 0
        : isConnected) && merchantToken
    );
  }, [walletsPrivy, merchantToken, preferredPrimaryChain, isConnected]);

  return {
    isAbleToTransfer,
    transfer: transfer as (
      options: TransferOptions
    ) => Promise<TokenTransferResult | undefined>,
    status,
    resetStatus,
  };
}
