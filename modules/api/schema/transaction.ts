import { z } from 'zod';

export const TransactionResponseSchema = z.object({
  blockNumber: z.string().regex(/^\d+$/),
  timeStamp: z.string().regex(/^\d+$/),
  hash: z.string().regex(/^0x[a-f0-9]{64}$/),
  nonce: z.string().regex(/^\d+$/),
  blockHash: z.string().regex(/^0x[a-f0-9]{64}$/),
  from: z.string().regex(/^0x[a-f0-9]{40}$/),
  contractAddress: z.string().regex(/^0x[a-f0-9]{40}$/),
  to: z.string().regex(/^0x[a-f0-9]{40}$/),
  value: z.string().regex(/^\d+\.?\d*$/),
  tokenName: z.string(),
  tokenSymbol: z.string(),
  tokenDecimal: z.string().regex(/^\d+$/),
  transactionIndex: z.string().regex(/^\d+$/),
  gas: z.string().regex(/^\d+$/),
  gasPrice: z.string().regex(/^\d+$/),
  gasUsed: z.string().regex(/^\d+$/),
  cumulativeGasUsed: z.string().regex(/^\d+$/),
  input: z.string(),
  methodId: z.string().regex(/^0x[a-f0-9]{8}$/),
  functionName: z.string(),
  confirmations: z.string().regex(/^\d+$/),
});

export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;

export const TransactionSchema = z.object({
  hash: z.string().regex(/^0x[a-f0-9]{64}$/),
  from: z.string().regex(/^0x[a-f0-9]{40}$/),
  to: z.string().regex(/^0x[a-f0-9]{40}$/),
  value: z.string().regex(/^\d+(\.\d+)?$/),
  tokenDecimal: z.string().regex(/^\d+$/),
  timestamp: z.string(),
  url: z.string().url(),
  tokenSymbol: z.string(),
  direction: z.enum(['IN', 'OUT']),
});

export type Transaction = z.infer<typeof TransactionSchema>;
