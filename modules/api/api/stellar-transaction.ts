import { type AxiosError } from "axios";
import { createInfiniteQuery } from "react-query-kit";

import { getItem, setItem } from "@/libs/storage";

import { Asset, Horizon } from "@stellar/stellar-sdk";
import { type Transaction } from "../schema/transaction";

const PAGE_SIZE = 5;

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

    const server = new Horizon.Server("https://horizon.stellar.org");
    const USDC = new Asset(
      "USDC",
      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    );

    const payments = await server
      .payments()
      .forAccount(variables.address)
      .limit(PAGE_SIZE)
      .order("desc")
      .call();

    const transactions: Transaction[] = (payments.records as any[])
      .filter(
        (op) =>
          op.asset_type !== "native" &&
          op.asset_code === USDC.code &&
          op.asset_issuer === USDC.issuer &&
          op.type === "payment"
      )
      .map((op) => {
        const from: string = op.from || "";
        const to: string = op.to || "";
        const amount: string = op.amount || "0";

        const direction: "IN" | "OUT" = to === variables.address ? "IN" : "OUT";
        const hash: string = op.transaction_hash || op.id;
        const timestamp: string = new Date(op.created_at).toLocaleString();
        const url = `https://stellar.expert/explorer/public/tx/${hash}`;

        return {
          hash,
          from,
          to,
          value: (Number(amount) / (10 * 7)).toFixed(2),
          tokenDecimal: "7",
          timestamp,
          url,
          tokenSymbol: "USDC",
          direction,
        } as Transaction;
      });

    await setItem(cacheKey, transactions, CACHE_DURATION);
    return transactions;
  },
  // We only fetch the latest PAGE_SIZE; disable further pages for now
  // @ts-ignore
  getNextPageParam: () => undefined,
});
