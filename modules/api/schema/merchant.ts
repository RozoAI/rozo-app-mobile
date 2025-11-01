import { z } from "zod";

export const MerchantDefaultTokenIDs = z.enum(["USDC_BASE", "USDC_XLM"]);

export const MerchantProfileSchema = z.object({
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  default_currency: z.string(),
  default_language: z.string(),
  default_token_id: MerchantDefaultTokenIDs,
  description: z.string().nullable(),
  display_name: z.string(),
  dynamic_id: z.string().uuid(),
  email: z.string().email(),
  logo_url: z.string().url().nullable(),
  merchant_id: z.string().uuid(),
  wallet_address: z.string(),
  stellar_address: z.string().nullable(),
  // PIN-related fields
  status: z.enum(["ACTIVE", "INACTIVE", "PIN_BLOCKED"]),
  has_pin: z.boolean(),
});

export const UpdateMerchantProfileSchema = z.object({
  display_name: z
    .string()
    .min(2, { message: "Display name must be at least 2 characters" })
    .max(50, { message: "Display name must be less than 50 characters" }),
  email: z.string().email(),
  logo: z.string().url().nullable(),
  stellar_address: z.string().nullable(),
});

export type MerchantProfile = z.infer<typeof MerchantProfileSchema>;
export type MerchantDefaultTokenID = z.infer<typeof MerchantDefaultTokenIDs>;
export type UpdateMerchantProfile = z.infer<typeof UpdateMerchantProfileSchema>;
