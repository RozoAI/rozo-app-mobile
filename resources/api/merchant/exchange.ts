import { Convert } from 'easy-currencies';

/**
 * Utility function to fetch exchange rates using easy-currencies
 * @param sourceCurrency - The source currency code to convert from
 * @returns A record of exchange rates
 */
export async function fetchExchangeRates(sourceCurrency: string): Promise<Record<string, number>> {
  try {
    const convert = await Convert().from(sourceCurrency).fetch();
    return convert.rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    // Return a minimal set of default rates if everything fails
    return { USD: 1, [sourceCurrency]: 1 };
  }
}
