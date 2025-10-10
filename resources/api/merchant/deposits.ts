import { type AxiosError } from "axios";
import { createMutation, createQuery } from "react-query-kit";

import { getItem, setItem } from "@/libs/storage";
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
  { status: string; force?: boolean },
  AxiosError
>({
  queryKey: ["deposits"],
  fetcher: async (variables) => {
    const { status, force = false } = variables;
    const cacheKey = `deposits:${status}`;
    // Cache deposits for 3 minutes (180,000 ms)
    const CACHE_DURATION = 3 * 60 * 1000;

    if (!force) {
      const cached = getItem<MerchantDeposit[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await client.get("functions/v1/deposits", {
      params: { status },
    });

    const data = response?.data?.deposits ?? [];
    await setItem(cacheKey, data, CACHE_DURATION);
    return data;
  },
});

export const useGetDeposit = createQuery<
  MerchantDeposit,
  { id: string; force?: boolean },
  AxiosError
>({
  queryKey: ["deposits"],
  fetcher: async (variables) => {
    const { id, force = false } = variables;
    const cacheKey = `deposit:${id}`;
    // Cache individual deposit for 2 minutes (120,000 ms)
    const CACHE_DURATION = 2 * 60 * 1000;

    if (!force) {
      const cached = getItem<MerchantDeposit>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await client.get(`functions/v1/deposits/${id}`);
    const data = response.data.deposit;

    await setItem(cacheKey, data, CACHE_DURATION);
    return data;
  },
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
