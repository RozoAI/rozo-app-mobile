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
  fetcher: async ({ status, force }) => {
    const cacheKey = `orders:${status}`;

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
    await setItem(cacheKey, data);
    return data;
  },
});

export const useGetOrder = createQuery<
  MerchantOrder,
  { id: string },
  AxiosError
>({
  queryKey: ["orders"],
  fetcher: (variables) =>
    client
      .get(`functions/v1/orders/${variables.id}`)
      .then((res) => res.data.order),
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
