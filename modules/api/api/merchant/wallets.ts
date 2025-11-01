import { type AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { client } from "@/modules/axios/client";
import { UseMutationOptions } from "@tanstack/react-query";

// Shared error types
type WalletPinError = {
  success: false;
  error: string;
  code?: "PIN_REQUIRED" | "PIN_BLOCKED" | "INACTIVE" | "INVALID_PIN";
  attempts_remaining?: number;
  is_blocked?: boolean;
};

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

type WalletTransferError = WalletPinError;

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
  | WalletPinError;

type WalletEnableUSDCErrors = WalletPinError;

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

type WalletStellarTransferPayload = {
  walletId: string;
  destinationAddress: string;
  amount: string | number;
  pinCode?: string;
};

type WalletStellarTransferResponse =
  | {
      success: true;
      result: {
        successful: boolean;
        hash: string;
        ledger: number;
      };
    }
  | WalletPinError;

type WalletStellarTransferErrors = WalletPinError;

// Wallet Stellar Transfer (POST /wallets/:walletId/stellar-transfer)
export const useWalletStellarTransfer = createMutation<
  WalletStellarTransferResponse,
  WalletStellarTransferPayload,
  AxiosError<WalletStellarTransferErrors>
>({
  mutationFn: async (payload: WalletStellarTransferPayload) => {
    const { walletId, destinationAddress, amount, pinCode } = payload;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (pinCode) {
      headers["x-pin-code"] = pinCode;
    }

    return client({
      url: `functions/v1/wallets/${walletId}/stellar-transfer`,
      method: "POST",
      headers,
      data: {
        destinationAddress,
        amount,
      },
    }).then((response) => response.data);
  },
} as UseMutationOptions<WalletStellarTransferResponse, AxiosError<WalletStellarTransferErrors>, WalletStellarTransferPayload>);
