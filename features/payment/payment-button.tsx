import React from "react";
import { useTranslation } from "react-i18next";

import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";

import { type DynamicStyles } from "./types";

type PaymentButtonProps = {
  isLoading?: boolean;
  isDisabled: boolean;
  dynamicStyles: DynamicStyles;
  onPress: () => void;
};

export function PaymentButton({
  isLoading,
  isDisabled,
  dynamicStyles,
  onPress,
}: PaymentButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      onPress={onPress}
      size={dynamicStyles.size.buttonSize as "sm" | "md" | "lg"}
      isDisabled={isDisabled}
      className="rounded-xl"
      style={{
        marginBottom: 16,
      }}
    >
      {isLoading ? (
        <ButtonSpinner />
      ) : (
        <ButtonText>{t("payment.continueToPayment")}</ButtonText>
      )}
    </Button>
  );
}
