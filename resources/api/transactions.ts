import axios, { type AxiosError } from "axios";
import { createInfiniteQuery } from "react-query-kit";

import { getItem, setItem } from "@/libs/storage";

import {
  type Transaction,
  type TransactionResponse,
} from "../schema/transaction";

if (!process.env.EXPO_PUBLIC_ETHERSCAN_API_KEY) {
  throw new Error("Missing EXPO_PUBLIC_ETHERSCAN_API_KEY");
}

const ETHERSCAN_API = "https://api.etherscan.io/v2";
const API_KEY = process.env.EXPO_PUBLIC_ETHERSCAN_API_KEY;
const CHAIN_ID = 8453;
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const PAGE_SIZE = 20;

const etherScanClient = axios.create({
  baseURL: ETHERSCAN_API,
  timeout: 20 * 1000,
});

export const useBaseUSDCTransactions = createInfiniteQuery<
  Transaction[],
  { address: string; force?: boolean },
  AxiosError
>({
  queryKey: ["usdc-transactions"],
  fetcher: async (variables, context) => {
    if (!variables?.address) return [];
    const cacheKey = `txs:${variables.address}`;
    // Cache transactions for 1 minute (60,000 ms) - blockchain data changes frequently
    const CACHE_DURATION = 1 * 60 * 1000;

    if (!variables.force) {
      const cached = getItem<Transaction[]>(cacheKey);
      if (cached) {
        return cached; // Return cached data if available, Pull to refresh to force a new request
      }
    }

    const response = await etherScanClient.get("/api", {
      signal: context.signal, // Cancel previous requests
      params: {
        chainid: CHAIN_ID,
        module: "account",
        action: "tokentx",
        contractaddress: USDC_CONTRACT,
        address: variables.address,
        page: context.pageParam || 1,
        offset: PAGE_SIZE,
        sort: "desc",
        apikey: API_KEY,
      },
    });

    const txs = response.data?.result || [];

    const data = txs.map(
      (tx: TransactionResponse): Transaction => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: (
          parseInt(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal))
        ).toFixed(2),
        tokenDecimal: tx.tokenDecimal,
        tokenSymbol: tx.tokenSymbol,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toLocaleString(),
        url: `https://basescan.org/tx/${tx.hash}`,
        direction:
          tx.to.toLowerCase() === variables.address.toLowerCase()
            ? "IN"
            : "OUT",
      })
    );

    await setItem(cacheKey, data, CACHE_DURATION);
    return data;
  },
  // @ts-ignore ignore this
  getNextPageParam: (
    lastPage: string | Transaction[],
    pages: string | Transaction[]
  ) => {
    if (lastPage.length < PAGE_SIZE) return undefined;
    return pages.length + 1;
  },
});
