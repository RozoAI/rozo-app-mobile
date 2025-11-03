import axios, { type AxiosError } from "axios";
import { createInfiniteQuery } from "react-query-kit";

import { getItem, setItem } from "@/libs/storage";

import { type Transaction } from "../schema/transaction";

const PAGE_SIZE = 5;
const HORIZON_API = "https://horizon.stellar.org";
const USDC_CODE = "USDC";
const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

const horizonClient = axios.create({
  baseURL: HORIZON_API,
  timeout: 20 * 1000,
});

export const useStellarUSDCTransactions = createInfiniteQuery<
  Transaction[],
  { address: string; force?: boolean },
  AxiosError
>({
  queryKey: ["stellar-transactions"],
  initialPageParam: 1,
  fetcher: async (variables, context) => {
    if (!variables?.address) return [];

    const cacheKey = `stellar:txs:${variables.address}`;
    const CACHE_DURATION = 1 * 60 * 1000; // 1 minute

    if (!variables.force) {
      const cached = getItem<Transaction[]>(cacheKey);
      if (cached) return cached;
    }

    const response = await horizonClient.get(
      `/accounts/${variables.address}/payments`,
      {
        signal: context.signal,
        params: {
          limit: PAGE_SIZE,
          order: "desc",
        },
      }
    );

    const transactions: Transaction[] = (response.data._embedded?.records || [])
      .filter(
        (op: any) =>
          op.asset_type !== "native" &&
          op.asset_code === USDC_CODE &&
          op.asset_issuer === USDC_ISSUER &&
          op.type === "payment"
      )
      .map((op: any) => {
        const from: string = op.from || "";
        const to: string = op.to || "";
        const amount: string = op.amount || "0";

        const direction: "IN" | "OUT" = to === variables.address ? "IN" : "OUT";
        const hash: string = op.transaction_hash || op.id;
        const timestamp: string = new Date(op.created_at).toLocaleString();
        const url = `https://stellar.expert/explorer/public/tx/${hash}`;
        console.log("[useStellarUSDCTransactions] amount:", amount);
        return {
          hash,
          from,
          to,
          value: (amount.includes(".")
            ? parseFloat(amount)
            : Number(amount) / 1e7
          ).toFixed(2),
          tokenDecimal: "7",
          timestamp,
          url,
          tokenSymbol: "USDC",
          direction,
        } as Transaction;
      });
    console.log("[useStellarUSDCTransactions] transactions:", transactions);
    await setItem(cacheKey, transactions, CACHE_DURATION);
    return transactions;
  },
  // We only fetch the latest PAGE_SIZE; disable further pages for now
  // @ts-ignore
  getNextPageParam: () => undefined,
});
