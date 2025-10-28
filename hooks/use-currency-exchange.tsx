import { useCallback, useEffect, useState } from "react";

import { storage } from "@/libs/storage";
import { isToday } from "@/libs/utils";
import { useApp } from "@/providers/app.provider";

import { fetchExchangeRates } from "@/modules/api/api/merchant/exchange";

type ExchangeRates = Record<string, number>;

// Storage instance for caching exchange rates
const EXCHANGE_RATES_KEY = "_exchange_rates";
const EXCHANGE_RATES_TIMESTAMP_KEY = "_exchange_rates_timestamp";

/**
 * Hook to get currency exchange rates with daily caching
 * Uses the defaultCurrency from app context as the source currency
 * Returns a function to convert to USD
 * @param customSourceCurrency - Optional custom source currency code to override the default
 */
export function useCurrencyExchange(customSourceCurrency?: string) {
  const { defaultCurrency } = useApp();
  const [rates, setRates] = useState<ExchangeRates>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Determine the actual source currency to use
  const sourceCurrency = customSourceCurrency || defaultCurrency?.code || "USD";

  // Check if we need to update the cached rates
  const shouldUpdateRates = useCallback((): boolean => {
    const timestamp = storage.getString(EXCHANGE_RATES_TIMESTAMP_KEY);
    // If no timestamp or rates stored, we need to update
    if (!timestamp) return true;
    // Check if the stored timestamp is from today
    return !isToday(new Date(timestamp));
  }, []);

  // Load rates from storage or fetch new ones
  useEffect(() => {
    const loadRates = async () => {
      try {
        // Skip if source currency is USD (no conversion needed)
        if (sourceCurrency === "USD") {
          setRates({ USD: 1 });
          setIsLoading(false);
          return;
        }

        // Try to get rates from storage first
        const storedRatesKey = `${EXCHANGE_RATES_KEY}_${sourceCurrency}`;
        const storedRates = storage.getString(storedRatesKey);
        if (storedRates && !shouldUpdateRates()) {
          // Use cached rates if they're from today
          setRates(JSON.parse(storedRates));
          setIsLoading(false);
          return;
        }
        // Fetch new rates using fetchExchangeRates utility
        try {
          const rates = await fetchExchangeRates(sourceCurrency);
          setRates(rates);
          // Cache the rates and timestamp
          storage.set(storedRatesKey, JSON.stringify(rates));
          storage.set(EXCHANGE_RATES_TIMESTAMP_KEY, new Date().toISOString());
          setIsLoading(false);
        } catch (fetchError) {
          console.error("Failed to fetch exchange rates:", fetchError);
          // Set default rate if fetch fails
          setRates({ USD: 1, [sourceCurrency]: 1 });
          setIsLoading(false);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to load exchange rates")
        );
        setIsLoading(false);
      }
    };

    loadRates();
  }, [sourceCurrency, shouldUpdateRates]);

  /**
   * Convert an amount to USD using the current exchange rate
   * @param amount - The amount to convert
   * @returns The equivalent amount in USD
   */
  const convertToUSD = useCallback(
    (amount: number): number => {
      // If the source is already USD, return as is
      if (sourceCurrency === "USD") return amount;
      // If we don't have a rate for USD, return the original amount
      if (!rates.USD) return amount;
      // Convert to USD using the exchange rate
      return amount * rates.USD;
    },
    [sourceCurrency, rates]
  );

  return {
    convertToUSD,
    isLoading,
    error,
    rates,
    sourceCurrency,
  };
}
