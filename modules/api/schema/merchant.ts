import { z } from 'zod';

export const MerchantProfileSchema = z.object({
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  default_currency: z.string(),
  default_language: z.string(),
  default_token_id: z.string(),
  description: z.string().nullable(),
  display_name: z.string(),
  dynamic_id: z.string().uuid(),
  email: z.string().email(),
  logo_url: z.string().url().nullable(),
  merchant_id: z.string().uuid(),
  wallet_address: z.string(),
  // PIN-related fields
  status: z.enum(['ACTIVE', 'INACTIVE', 'PIN_BLOCKED']),
  has_pin: z.boolean(),
});

export const UpdateMerchantProfileSchema = z.object({
  display_name: z
    .string()
    .min(2, { message: 'Display name must be at least 2 characters' })
    .max(50, { message: 'Display name must be less than 50 characters' }),
  email: z.string().email(),
});

export type MerchantProfile = z.infer<typeof MerchantProfileSchema>;
export type UpdateMerchantProfile = z.infer<typeof UpdateMerchantProfileSchema>;
