export type PaymentMethodId = 'rozo' | 'base' | 'solana' | 'polygon';

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  description: string;
  preferredToken?: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'rozo',
    name: 'Rozo Payment',
    description: 'Pay with Rozo',
  },
  {
    id: 'base',
    name: 'Base',
    description: 'Pay on Base',
    preferredToken: 'USDC_BASE',
  },
  {
    id: 'solana',
    name: 'Solana',
    description: 'Pay on Solana',
    preferredToken: 'USDC_SOL',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    description: 'Pay on Polygon',
    preferredToken: 'USDC_POL',
  },
];
