import { type AxiosError } from "axios";
import { createMutation, createQuery } from "react-query-kit";

import { getItem, setItem } from "@/libs/storage";

import { client } from "@/modules/axios/client";
import {
  type MerchantOrder,
  type OrderResponse,
} from "@/resources/schema/order";

type Payload = {
  display_amount: number;
  display_currency: string;
  description?: string;
  redirect_uri?: string;
};

export const useGetOrders = createQuery<
  MerchantOrder[],
  { status: string; force?: boolean },
  AxiosError
>({
  queryKey: ["orders"],
  fetcher: async (variables) => {
    const { status, force = false } = variables;
    const cacheKey = `orders:${status}`;
    // Cache orders for 5 minutes (300,000 ms)
    const CACHE_DURATION = 5 * 60 * 1000;

    if (!force) {
      const cached = getItem<MerchantOrder[]>(cacheKey);
      if (cached) {
        return cached; // Return cached data if available, Pull to refresh to force a new request
      }
    }

    const response = await client.get("functions/v1/orders", {
      params: { status },
    });

    const data = response?.data?.orders ?? [];
    await setItem(cacheKey, data, CACHE_DURATION);
    return data;
  },
});

export const useGetOrder = createQuery<
  MerchantOrder,
  { id: string; force?: boolean },
  AxiosError
>({
  queryKey: ["orders"],
  fetcher: async (variables) => {
    const { id, force = false } = variables;
    const cacheKey = `order:${id}`;
    // Cache individual order for 2 minutes (120,000 ms)
    const CACHE_DURATION = 2 * 60 * 1000;

    if (!force) {
      const cached = getItem<MerchantOrder>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await client.get(`functions/v1/orders/${id}`);
    const data = response.data.order;

    await setItem(cacheKey, data, CACHE_DURATION);
    return data;
  },
  enabled: false,
});

export const useCreateOrder = createMutation<
  OrderResponse,
  Payload,
  AxiosError
>({
  mutationFn: async (payload) =>
    client({
      url: "functions/v1/orders",
      method: "POST",
      data: payload,
    }).then((response) => response.data),
});
