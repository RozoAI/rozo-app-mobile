import { type AxiosError } from "axios";
import { createMutation } from "react-query-kit";

import { client } from "@/modules/axios/client";
import { UseMutationOptions } from "@tanstack/react-query";

type WalletTransferPayload = {
  walletId: string;
  recipientAddress: string;
  amount: number;
  signature: string;
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

export const useWalletTransfer = createMutation<
  WalletTransferResponse,
  WalletTransferPayload,
  AxiosError
>({
  mutationFn: async (payload: WalletTransferPayload) =>
    client({
      url: `functions/v1/wallets/${payload.walletId}`,
      method: "POST",
      data: payload,
    }).then((response) => response.data),
} as UseMutationOptions<WalletTransferResponse, AxiosError, WalletTransferPayload>);
