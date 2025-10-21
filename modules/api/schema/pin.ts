import { z } from 'zod';

// PIN Code validation schema (6 digits)
export const PinCodeSchema = z
  .string()
  .length(6, { message: 'PIN must be exactly 6 digits' })
  .regex(/^\d{6}$/, { message: 'PIN must contain only numbers' });

// Set PIN payload schema
export const SetPinPayloadSchema = z.object({
  pin_code: PinCodeSchema,
});

// Update PIN payload schema
export const UpdatePinPayloadSchema = z.object({
  current_pin: PinCodeSchema,
  new_pin: PinCodeSchema,
});

// PIN validation payload schema
export const ValidatePinPayloadSchema = z.object({
  pin_code: PinCodeSchema,
});

// PIN response schemas
export const PinSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

export const PinValidationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  attempts_remaining: z.number().min(0).max(2).optional(),
  is_blocked: z.boolean().optional(),
});

// PIN status schema
export const PinStatusSchema = z.object({
  has_pin: z.boolean(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PIN_BLOCKED']),
  attempts_remaining: z.number().min(0).max(2).optional(),
  is_blocked: z.boolean().optional(),
});

// Type exports
export type PinCode = z.infer<typeof PinCodeSchema>;
export type SetPinPayload = z.infer<typeof SetPinPayloadSchema>;
export type UpdatePinPayload = z.infer<typeof UpdatePinPayloadSchema>;
export type ValidatePinPayload = z.infer<typeof ValidatePinPayloadSchema>;
export type PinSuccessResponse = z.infer<typeof PinSuccessResponseSchema>;
export type PinValidationResponse = z.infer<typeof PinValidationResponseSchema>;
export type PinStatus = z.infer<typeof PinStatusSchema>;

// API Error types
export interface PinApiError {
  success: false;
  error: string;
  code?: 'PIN_REQUIRED' | 'PIN_BLOCKED' | 'INACTIVE';
  attempts_remaining?: number;
  is_blocked?: boolean;
}
