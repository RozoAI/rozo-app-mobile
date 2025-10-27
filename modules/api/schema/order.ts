import { z } from 'zod';

export const MerchantOrderStatusSchema = z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'DISCREPANCY']);
export type MerchantOrderStatus = z.infer<typeof MerchantOrderStatusSchema>;

export const MerchantOrderSchema = z.object({
  order_id: z.string(),
  merchant_id: z.string(),
  payment_id: z.string(),
  status: MerchantOrderStatusSchema,
  callback_payload: z.object({
    type: z.string(),
    txHash: z.string(),
    chainId: z.number(),
    payment: z.object({
      id: z.string(),
      source: z.object({
        txHash: z.string(),
        chainId: z.string(),
        amountUnits: z.string(),
        tokenSymbol: z.string(),
        payerAddress: z.string(),
        tokenAddress: z.string(),
      }),
      status: z.string(),
      display: z.object({
        intent: z.string(),
        currency: z.string(),
        paymentValue: z.string(),
      }),
      metadata: z.null(),
      createdAt: z.string(),
      externalId: z.null(),
      destination: z.object({
        txHash: z.string(),
        chainId: z.string(),
        callData: z.string(),
        amountUnits: z.string(),
        tokenSymbol: z.string(),
        tokenAddress: z.string(),
        destinationAddress: z.string(),
      }),
    }),
    paymentId: z.string(),
  }),
  display_currency: z.string(),
  merchant_chain_id: z.string(),
  merchant_address: z.string(),
  required_token: z.string(),
  required_amount_usd: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  source_txn_hash: z.string(),
  source_chain_name: z.string(),
  source_token_address: z.string(),
  source_token_amount: z.number(),
  description: z.string(),
  display_amount: z.number(),
  payment_url: z.optional(z.string().url()),
  qrcode: z.optional(z.string().url()),
  number: z.union([z.string(), z.number()]),
  expired_at: z.string().datetime().nullable(),
});

export const OrderPaymentResponseSchema = z.object({
  id: z.string().nullable(),
  status: z.string().nullable(),
  createdAt: z.string().nullable(),
  display: z.object({
    intent: z.string().nullable(),
    currency: z.string().nullable(),
  }).nullable(),
  source: z.any().nullable(),
  destination: z.object({
    destinationAddress: z.string().nullable(),
    txHash: z.string().nullable(),
    chainId: z.string().nullable(),
    amountUnits: z.string().nullable(),
    tokenSymbol: z.string().nullable(),
    tokenAddress: z.string().nullable(),
  }).nullable(),
  metadata: z.object({
    daimoOrderId: z.string().nullable(),
    intent: z.string().nullable(),
    items: z.array(z.object({
      name: z.string().nullable(),
      description: z.string().nullable(),
    })).nullable(),
    payer: z.record(z.any()).nullable(),
    orderDate: z.string().nullable(),
    callbackUrl: z.string().nullable(),
    webhookUrl: z.string().nullable(),
    provider: z.string().nullable(),
    receivingAddress: z.string().nullable(),
    memo: z.string().nullable(),
    payinchainid: z.string().nullable(),
    payintokenaddress: z.string().nullable(),
  }).nullable(),
  url: z.string().nullable(),
});

export const OrderResponseSchema = z.object({
  qrcode: z.string().url(),
  order_id: z.string(),
  order_number: z.union([z.string(), z.number()]),
  expired_at: z.string().datetime().nullable(),
  payment_details: OrderPaymentResponseSchema.nullable(),
});

export type OrderResponse = z.infer<typeof OrderResponseSchema>;
export type MerchantOrder = z.infer<typeof MerchantOrderSchema>;
export type OrderPaymentResponse = z.infer<typeof OrderPaymentResponseSchema>;
