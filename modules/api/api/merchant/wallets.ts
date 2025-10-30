import { type AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { client } from "@/modules/axios/client";
import { UseMutationOptions } from "@tanstack/react-query";

type WalletTransferPayload = {
  walletId: string;
  recipientAddress: string;
  amount: number;
  signature: string;
  pinCode?: string; // Optional PIN code for authorization
};

type WalletTransferResponse = {
  success: boolean;
  transaction?: {
    hash: string;
    caip2: string;
    walletId: string;
  };
  walletId: string;
  recipientAddress: string;
  amount: number;
  message?: string;
};

type WalletTransferError = {
  success: false;
  error: string;
  code?: "PIN_REQUIRED" | "PIN_BLOCKED" | "INACTIVE" | "INVALID_PIN";
  attempts_remaining?: number;
  is_blocked?: boolean;
};

// Wallet Transfer (POST /wallets/:walletId)
// Uses x-pin-code header for PIN authorization if provided
export const useWalletTransfer = createMutation<
  WalletTransferResponse,
  WalletTransferPayload,
  AxiosError<WalletTransferError>
>({
  mutationFn: async (payload: WalletTransferPayload) => {
    const { walletId, recipientAddress, amount, signature, pinCode } = payload;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add PIN code to header if provided
    if (pinCode) {
      headers["x-pin-code"] = pinCode;
    }

    return client({
      url: `functions/v1/wallets/${walletId}`,
      method: "POST",
      headers,
      data: {
        recipientAddress,
        amount,
        signature,
      },
    }).then((response) => response.data);
  },
} as UseMutationOptions<WalletTransferResponse, AxiosError<WalletTransferError>, WalletTransferPayload>);

type WalletEnableUSDCPayload = {
  walletId: string;
  pinCode?: string;
};

export interface SubmitTrustlineResult {
  successful: boolean;
  hash?: string;
  ledger?: number;
  alreadyExists?: boolean;
  errorMessage?: string;
  raw?: unknown;
}

export type WalletEnableUSDCResponse =
  | {
      success: true;
      result: SubmitTrustlineResult;
      already_exists?: boolean;
    }
  | {
      success: false;
      error: string;
      code?: "PIN_BLOCKED" | "INACTIVE" | "PIN_REQUIRED";
      attempts_remaining?: number;
      is_blocked?: boolean;
    };

type WalletEnableUSDCErrors = {
  success: false;
  error: string;
  code?: "PIN_REQUIRED" | "PIN_BLOCKED" | "INACTIVE" | "INVALID_PIN";
  attempts_remaining?: number;
  is_blocked?: boolean;
};

// Wallet Enable USDC Trustline (POST /wallets/:walletId/enable-usdc)
export const useWalletEnableUSDC = createMutation<
  WalletEnableUSDCResponse,
  WalletEnableUSDCPayload,
  AxiosError<WalletEnableUSDCErrors>
>({
  mutationFn: async (payload: WalletEnableUSDCPayload) => {
    const { walletId, pinCode } = payload;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (pinCode) {
      headers["x-pin-code"] = pinCode;
    }

    return client({
      url: `functions/v1/wallets/${walletId}/enable-usdc`,
      method: "POST",
      headers,
    }).then((response) => response.data);
  },
} as UseMutationOptions<WalletEnableUSDCResponse, AxiosError<WalletEnableUSDCErrors>, WalletEnableUSDCPayload>);
