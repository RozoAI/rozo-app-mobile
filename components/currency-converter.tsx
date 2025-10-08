import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useCurrencyExchange } from "@/hooks/use-currency-exchange";
import { formatCurrency } from "@/libs/utils";

type Props = {
  amount: number;
  customSourceCurrency?: string;
  className?: string;
};

/**
 * Component to display an amount in both source currency and USD equivalent
 */
export function CurrencyConverter({
  amount,
  customSourceCurrency,
  className,
}: Props) {
  const { t } = useTranslation();
  const [usdAmount, setUsdAmount] = useState<number | null>(null);
  const { convertToUSD, isLoading, error } =
    useCurrencyExchange(customSourceCurrency);

  const updateUsdAmount = useCallback(() => {
    if (!isLoading) {
      const converted = convertToUSD(amount);
      setUsdAmount(converted);
    }
  }, [amount, convertToUSD, isLoading]);

  useEffect(() => {
    updateUsdAmount();
  }, [updateUsdAmount]);

  if (isLoading) {
    return <Spinner size="small" />;
  }

  if (error) {
    return (
      <Text className={`text-error-500 ${className}`}>
        {t("general.conversionError")}
      </Text>
    );
  }

  // Only show USD conversion if it's different from source currency
  // if (sourceCurrency === 'USD' || !usdAmount) {
  //   return <Text className={className}>{formatCurrency(amount, sourceCurrency)}</Text>;
  // }

  return (
    <Text className={`text-sm text-gray-500 ${className}`}>{`≈ ${formatCurrency(
      usdAmount ?? 0,
      "USD"
    )}`}</Text>
  );
}
