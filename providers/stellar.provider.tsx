"use client";

import { useToast } from "@/hooks/use-toast";
import { StellarConfig } from "@/libs/stellar/config";
import { isAccountNotFound } from "@/libs/stellar/errors";
import {
  formatStellarBalancesAsWalletInfo,
  StellarBalance,
} from "@/libs/stellar/utils";
import { Asset, Horizon } from "@stellar/stellar-sdk";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { WalletBalanceInfo } from "./wallet.provider";

type StellarContextProvider = { children: ReactNode; stellarRpcUrl?: string };

type StellarContextProviderValue = {
  server: Horizon.Server | undefined;
  publicKey: string | undefined;
  setPublicKey: (publicKey: string) => void;
  hasUsdcTrustline: boolean;
  account: Horizon.AccountResponse | undefined | null;
  balances: WalletBalanceInfo[];
  isConnected: boolean;
  disconnect: () => void;
  convertXlmToUsdc: (amount: string) => Promise<string>;
  refreshAccount: () => Promise<void>;
};

const initialContext = {
  server: undefined,
  publicKey: undefined,
  setPublicKey: () => {},
  hasUsdcTrustline: false,
  account: undefined,
  balances: [],
  isConnected: false,
  disconnect: () => {},
  convertXlmToUsdc: () => Promise.resolve(""),
  refreshAccount: () => Promise.resolve(),
};

export const StellarContext =
  createContext<StellarContextProviderValue>(initialContext);

export const StellarProvider = ({
  children,
  stellarRpcUrl,
}: StellarContextProvider) => {
  const server = new Horizon.Server(
    stellarRpcUrl ?? StellarConfig.NETWORK.rpcUrl
  );

  // Auto-initialize Stellar wallet for authenticated users
  const { error: toastError } = useToast();

  const [publicKey, setPublicKey] = useState<string | undefined>(undefined);
  const [accountInfo, setAccountInfo] = useState<
    Horizon.AccountResponse | undefined | null
  >(undefined);

  const formattedBalances = useMemo(() => {
    if (!accountInfo?.balances) return [];
    return formatStellarBalancesAsWalletInfo(
      accountInfo.balances as StellarBalance[]
    );
  }, [accountInfo?.balances]);

  const hasUsdcTrustline = useMemo(() => {
    if (!accountInfo?.balances) return false;
    return accountInfo.balances.some(
      (balance: any) =>
        balance.asset_code === StellarConfig.USDC_ASSET.code &&
        balance.asset_issuer === StellarConfig.USDC_ASSET.issuer
    );
  }, [accountInfo?.balances]);

  const getAccountInfo = async (publicKey: string) => {
    try {
      const data = await server.loadAccount(publicKey);
      console.log(JSON.stringify(data, null, 2));
      setAccountInfo(data);
    } catch (error: any) {
      // Handle 404 error specifically - account doesn't exist (not funded)
      if (isAccountNotFound(error)) {
        console.log(
          `Account ${publicKey} not found - needs activation/funding`
        );
        // Set account info to null to indicate unfunded account
        setAccountInfo(null);
        return;
      }

      // For other errors, show toast and log
      toastError(error.message || "Failed to get account info");
      console.error("Error loading account:", error);
    }
  };

  const convertXlmToUsdc = async (amount: string) => {
    try {
      const destAsset = StellarConfig.USDC_ASSET.asset;
      const pathResults = await server
        .strictSendPaths(Asset.native(), amount, [destAsset])
        .call();

      if (!pathResults?.records?.length) {
        throw new Error("No exchange rate found for XLM swap");
      }

      // Apply 5% slippage tolerance
      const bestPath = pathResults.records[0];
      const estimatedDestMinAmount = (
        parseFloat(bestPath.destination_amount) * 0.94
      ).toFixed(2);

      return estimatedDestMinAmount;
    } catch (error: any) {
      throw error;
    }
  };

  const refreshAccount = async () => {
    if (publicKey) {
      await getAccountInfo(publicKey);
    }
  };

  const disconnect = async () => {
    try {
      setPublicKey(undefined);
      setAccountInfo(undefined);
    } catch (error: any) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (publicKey && !accountInfo) {
      refreshAccount();
    }
  }, [publicKey, accountInfo]);

  return (
    <StellarContext.Provider
      value={{
        publicKey,
        setPublicKey,
        server,
        hasUsdcTrustline,
        account: accountInfo,
        balances: formattedBalances,
        isConnected: !!publicKey,
        disconnect,
        convertXlmToUsdc,
        refreshAccount,
      }}
    >
      {children}
    </StellarContext.Provider>
  );
};

export const useStellar = () => useContext(StellarContext);
