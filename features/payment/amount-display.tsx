import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { CurrencyConverter } from "@/components/currency-converter";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useApp } from "@/providers/app.provider";

import type { DynamicStyles } from "./types";

type AmountDisplayProps = {
  amount: string;
  dynamicStyles: DynamicStyles;
};

export function AmountDisplay({ amount, dynamicStyles }: AmountDisplayProps) {
  const { defaultCurrency } = useApp();
  const { t } = useTranslation();

  // Format amount with appropriate decimal and thousand separators
  const formattedAmount = useMemo(() => {
    if (!amount) return "0";

    // Handle decimal separator
    const decimalSeparator = defaultCurrency?.decimalSeparator || ".";
    // Check if the amount ends with a decimal separator
    const endsWithSeparator = amount.endsWith(decimalSeparator);
    // Split by decimal separator
    const parts = amount.split(decimalSeparator);
    const integerPart = parts[0] || "0"; // Default to '0' if empty
    const decimalPart = parts.length > 1 ? parts[1] : "";

    // Format integer part with thousand separators
    const thousandSeparator = defaultCurrency?.thousandSeparator || ",";
    const formattedInteger =
      integerPart === "0"
        ? "0"
        : integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

    // Return formatted amount with decimal part if it exists or if amount ends with separator
    if (decimalPart) {
      return `${formattedInteger}${decimalSeparator}${decimalPart}`;
    } else if (endsWithSeparator) {
      return `${formattedInteger}${decimalSeparator}`;
    } else {
      return formattedInteger;
    }
  }, [amount, defaultCurrency]);

  return (
    <Card
      className={`rounded-xl border shadow-soft-1 dark:w-full dark:border-white dark:bg-gray-600 ${dynamicStyles.spacing.cardPadding}`}
    >
      <Text className="text-center text-gray-500 dark:text-gray-200">
        {t("general.amount")}
      </Text>
      <Text
        className={`my-3 text-center font-bold text-gray-800 dark:text-gray-200 ${dynamicStyles.fontSize.amount}`}
      >
        {`${formattedAmount} ${defaultCurrency?.code}`}
      </Text>
      {/* USD Conversion */}
      {defaultCurrency?.code !== "USD" && (
        <Box className="mt-1 rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
          <CurrencyConverter
            amount={Number(amount)}
            className={`text-center text-gray-600 dark:text-gray-200 ${dynamicStyles.fontSize.label}`}
          />
        </Box>
      )}
      <Text
        className={`mt-2 text-center italic text-gray-500 dark:text-gray-200 ${dynamicStyles.fontSize.label}`}
      >
        {t("payment.enterPaymentAmount")}
      </Text>
    </Card>
  );
}
// End of Selection
