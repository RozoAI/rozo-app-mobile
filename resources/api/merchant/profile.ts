import type { AxiosError } from "axios";
import { createMutation, createQuery } from "react-query-kit";

import { getItem, setItem } from "@/libs/storage";
import { client } from "@/modules/axios/client";
import { type MerchantProfile } from "@/resources/schema/merchant";

type Payload = {
  email: string;
  display_name: string | null;
  description?: string | null;
  logo_url?: string | null;
  default_currency: string;
  default_language: string;
  default_token_id?: string;
  wallet_address?: string;
};
type Response = MerchantProfile;

type UpdateProfilePayload = {
  email: string;
  display_name?: string;
  logo?: string | null;
};

export const useCreateProfile = createMutation<Response, Payload, AxiosError>({
  mutationFn: async (payload: Payload) =>
    client({
      url: "functions/v1/merchants",
      method: "POST",
      data: payload,
    }).then((response) => response.data.profile),
});

export const useUpdateProfile = createMutation<
  Response,
  UpdateProfilePayload,
  AxiosError
>({
  mutationFn: async (payload: UpdateProfilePayload) =>
    client({
      url: "functions/v1/merchants",
      method: "PUT",
      data: payload,
    }).then((response) => response.data.profile),
});

export const useGetProfile = createQuery<
  Response,
  { force?: boolean },
  AxiosError
>({
  queryKey: ["profile"],
  fetcher: async (variables = {}) => {
    const { force = false } = variables;
    const cacheKey = "profile";
    // Cache profile for 10 minutes (600,000 ms) - profile data changes less frequently
    const CACHE_DURATION = 10 * 60 * 1000;

    console.log("[useGetProfile] fetcher called with variables:", variables);

    if (!force) {
      const cached = getItem<Response>(cacheKey);
      if (cached) {
        console.log("[useGetProfile] Returning cached profile data:", cached);
        return cached;
      }
    }

    try {
      const response = await client.get("functions/v1/merchants", {
        "axios-retry": {
          retries: 0,
        },
      });

      const data = response.data.profile;
      await setItem(cacheKey, data, CACHE_DURATION);
      console.log("[useGetProfile] Fetched profile from API and cached:", data);
      return data;
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        const cached = getItem<Response>(cacheKey);
        if (cached) {
          console.warn(
            "[useGetProfile] Authentication error, returning cached profile data"
          );
          return cached;
        }
      }
      console.error("[useGetProfile] Error fetching profile:", error);
      throw error;
    }
  },
  enabled: false,
  retry: false,
});
