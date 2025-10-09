import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { CurrencyConverter } from "@/components/currency-converter";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { useApp } from "@/providers/app.provider";

import { ThemedText } from "@/components/themed-text";
import { useSelectedTheme } from "@/hooks/use-selected-theme";
import type { DynamicStyles } from "./types";

type AmountDisplayProps = {
  amount: string;
  dynamicStyles: DynamicStyles;
};

export function AmountDisplay({ amount, dynamicStyles }: AmountDisplayProps) {
  const { defaultCurrency } = useApp();
  const { t } = useTranslation();
  const { selectedTheme } = useSelectedTheme();

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
      className={`rounded-xl shadow-soft-1 ${dynamicStyles.spacing.cardPadding}`}
      style={{
        backgroundColor: selectedTheme === "dark" ? "#0a0a0a" : "#ffffff",
        borderColor: selectedTheme === "dark" ? "#222430" : "gray",
        borderWidth: 1,
      }}
    >
      <ThemedText className="text-center">{t("general.amount")}</ThemedText>
      <ThemedText
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginTop: 12,
          marginBottom: 12,
        }}
        className={`text-center ${dynamicStyles.fontSize.amount}`}
      >
        {`${formattedAmount} ${defaultCurrency?.code}`}
      </ThemedText>
      {/* USD Conversion */}
      {defaultCurrency?.code !== "USD" && (
        <Box className="rounded-lg p-2">
          <CurrencyConverter
            amount={Number(amount)}
            className={`text-center`}
          />
        </Box>
      )}
      <ThemedText
        className={`text-center italic ${dynamicStyles.fontSize.label}`}
        type="default"
        style={{ fontSize: 14, marginTop: 12 }}
      >
        {t("payment.enterPaymentAmount")}
      </ThemedText>
    </Card>
  );
}
