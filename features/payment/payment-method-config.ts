export type PaymentMethodId = "rozo" | "base" | "solana" | "polygon";

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  description: string;
  preferredToken?: string;
  tokenAddress?: string;
  chainId?: number;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "rozo",
    name: "Rozo",
    description: "Pay with Rozo",
  },
  {
    id: "base",
    name: "Base",
    description: "Pay on USDC Base",
    preferredToken: "USDC_BASE",
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    chainId: 8453,
  },
  {
    id: "solana",
    name: "Solana",
    description: "Pay on USDC Solana",
    preferredToken: "USDC_SOL",
    tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    chainId: 900,
  },
  {
    id: "polygon",
    name: "Polygon",
    description: "Pay on USDC Polygon",
    preferredToken: "USDC_POL",
    tokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    chainId: 137,
  },
];
