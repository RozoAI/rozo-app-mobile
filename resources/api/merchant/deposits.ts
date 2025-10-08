import { type AxiosError } from "axios";
import { createMutation, createQuery } from "react-query-kit";

import { client } from "@/modules/axios/client";
import { type DepositResponse } from "@/resources/schema/deposit";

type MerchantDeposit = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type DepositPayload = {
  display_amount: number;
  display_currency: string;
  redirect_uri?: string;
};

export const useGetDeposits = createQuery<
  MerchantDeposit[],
  { status: string },
  AxiosError
>({
  queryKey: ["deposits"],
  fetcher: ({ status }) =>
    client
      .get("functions/v1/deposits", {
        params: { status },
      })
      .then((res) => res?.data?.deposits ?? []),
});

export const useGetDeposit = createQuery<
  MerchantDeposit,
  { id: string },
  AxiosError
>({
  queryKey: ["deposits"],
  fetcher: (variables) =>
    client
      .get(`functions/v1/deposits/${variables.id}`)
      .then((res) => res.data.deposit),
  enabled: false,
});

export const useCreateDeposit = createMutation<
  DepositResponse,
  DepositPayload,
  AxiosError
>({
  mutationFn: async (payload) =>
    client({
      url: "functions/v1/deposits",
      method: "POST",
      data: payload,
    }).then((response) => response.data),
});
