import React from "react";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { type QuickAmount } from "@/libs/currencies";

import { type DynamicStyles } from "./types";

type QuickAmountListProps = {
  quickAmounts: QuickAmount[];
  dynamicStyles: DynamicStyles;
  onSelectQuickAmount: (value: string) => void;
};

export function QuickAmountList({
  quickAmounts,
  dynamicStyles,
  onSelectQuickAmount,
}: QuickAmountListProps) {
  return (
    <>
      <Text className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-200">
        Quick Amount
      </Text>
      <View
        className={`flex-row flex-wrap justify-between ${dynamicStyles.spacing.quickAmountGap}`}
      >
        {quickAmounts.map((item) => (
          <View
            key={item.value}
            className={`flex-1 ${dynamicStyles.size.quickAmountMinWidth}`}
          >
            <Button
              onPress={() => onSelectQuickAmount(item.value)}
              variant="outline"
              size={
                dynamicStyles.size.buttonSize === "sm"
                  ? "sm"
                  : dynamicStyles.size.buttonSize === "md"
                  ? "md"
                  : "lg"
              }
              className="rounded-xl border border-gray-200 bg-background-0 py-1 text-lg shadow-soft-1 dark:border-gray-800"
            >
              <Text
                className={`text-center font-medium text-gray-800 dark:text-gray-200 ${dynamicStyles.fontSize.quickAmount}`}
              >
                {item.label}
              </Text>
            </Button>
          </View>
        ))}
      </View>
    </>
  );
}
