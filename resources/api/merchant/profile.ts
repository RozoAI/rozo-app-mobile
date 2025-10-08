import type { AxiosError } from "axios";
import { createMutation, createQuery } from "react-query-kit";

import { client } from "@/modules/axios/client";
import { type MerchantProfile } from "@/resources/schema/merchant";

type Payload = {
  email: string;
  display_name: string;
  description?: string | null;
  logo_url?: string | null;
  default_currency: string;
  default_language: string;
  default_token_id?: string;
  wallet_address?: string;
};
type Response = MerchantProfile;

type UpdateProfilePayload = {
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

export const useGetProfile = createQuery<Response, {}, AxiosError>({
  queryKey: ["profile"],
  fetcher: () =>
    client
      .get("functions/v1/merchants", {
        "axios-retry": {
          retries: 0,
        },
      })
      .then((response) => response.data.profile),
  enabled: false,
  staleTime: 5 * 60 * 1000, // 5 minutes - prevent unnecessary refetches
  retry: false,
});
