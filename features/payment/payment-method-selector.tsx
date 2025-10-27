import BaseIcon from "@/components/svg/base-icon";
import PolygonIcon from "@/components/svg/polygon-icon";
import RozoIcon from "@/components/svg/rozo-icon";
import SolanaIcon from "@/components/svg/solana-icon";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import { type OrderResponse } from "@/modules/api/schema/order";
import React, { useEffect, useState } from "react";
import { PAYMENT_METHODS, type PaymentMethodId } from "./payment-method-config";

interface PaymentMethodSelectorProps {
  existingPayment?: OrderResponse; // For Rozo payment
  onPaymentMethodSelected: (
    methodId: PaymentMethodId,
    preferredToken?: string
  ) => void;
  className?: string;
  isLoading?: boolean;
  currentPaymentMethod?: PaymentMethodId;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  existingPayment,
  onPaymentMethodSelected,
  className = "",
  isLoading = false,
  currentPaymentMethod = "rozo",
}) => {
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodId>(currentPaymentMethod);
  const [loadingMethod, setLoadingMethod] = useState<PaymentMethodId | null>(
    null
  );

  // Update selected method when currentPaymentMethod prop changes
  useEffect(() => {
    setSelectedMethod(currentPaymentMethod);
  }, [currentPaymentMethod]);

  const renderIcon = (methodId: PaymentMethodId, size: number = 20) => {
    const iconProps = {
      width: size,
      height: size,
    };

    switch (methodId) {
      case "rozo":
        return <RozoIcon {...iconProps} />;
      case "base":
        return <BaseIcon {...iconProps} />;
      case "solana":
        return <SolanaIcon {...iconProps} />;
      case "polygon":
        return <PolygonIcon {...iconProps} />;
      default:
        return <RozoIcon {...iconProps} />;
    }
  };

  const selectedMethodData = PAYMENT_METHODS.find(
    (m) => m.id === selectedMethod
  );
  const otherMethods = PAYMENT_METHODS.filter(
    (m) => m.id !== selectedMethod
  ).sort((a, b) => a.id.localeCompare(b.id));

  const handleMethodSelect = async (methodId: PaymentMethodId) => {
    if (loadingMethod || isLoading) return; // Prevent multiple calls or when parent is loading

    setLoadingMethod(methodId);
    setSelectedMethod(methodId);

    try {
      // Simple if condition by id for Rozo payment
      if (methodId === "rozo") {
        if (existingPayment) {
          // Use existing payment data for Rozo - call callback immediately
          onPaymentMethodSelected(methodId);
        } else {
          throw new Error("No existing payment found for Rozo");
        }
      } else {
        // For other payment methods, pass the method info to parent
        const method = PAYMENT_METHODS.find((m) => m.id === methodId);
        onPaymentMethodSelected(methodId, method?.preferredToken);
      }
    } catch (error: any) {
      console.error("Payment method selection error:", error);
      setSelectedMethod(currentPaymentMethod); // Reset to current payment method on error
    } finally {
      setLoadingMethod(null);
    }
  };

  return (
    <View
      style={{
        width: "100%",

        ...(className ? { className } : {}),
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          marginBottom: 12,
          textAlign: "center",
          color: "#111827",
        }}
      >
        Payment Method
      </Text>

      {/* Selected Method Display */}
      <View
        style={{
          backgroundColor: "#f8fafc",
          marginBottom: 12,
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {loadingMethod === selectedMethod || isLoading ? (
              <Spinner size="small" />
            ) : (
              renderIcon(selectedMethod, 20)
            )}
            <VStack space="xs">
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {selectedMethodData?.name}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                }}
              >
                {selectedMethodData?.description}
              </Text>
            </VStack>
          </View>
          <View
            style={{
              backgroundColor: "#333",
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: "600",
                color: "white",
              }}
            >
              SELECTED
            </Text>
          </View>
        </View>
      </View>

      {/* Other Options */}
      <Text
        style={{
          fontSize: 12,
          fontWeight: "500",
          marginBottom: 6,
          color: "#6b7280",
        }}
      >
        Other Options (USDC)
      </Text>
      <HStack space="sm" style={{ justifyContent: "center" }}>
        {otherMethods.map((method) => (
          <Pressable
            key={method.id}
            onPress={() => handleMethodSelect(method.id)}
            disabled={loadingMethod === method.id || isLoading}
            style={{
              backgroundColor: "white",
              borderRadius: 6,
              padding: 8,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              minWidth: 60,
              alignItems: "center",
              opacity: loadingMethod === method.id || isLoading ? 0.5 : 1,
            }}
          >
            <VStack space="xs" style={{ alignItems: "center" }}>
              {loadingMethod === method.id ? (
                <Spinner size="small" />
              ) : (
                renderIcon(method.id, 16)
              )}
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "500",
                  color: "#374151",
                  textAlign: "center",
                }}
              >
                {method.name}
              </Text>
            </VStack>
          </Pressable>
        ))}
      </HStack>
    </View>
  );
};

export default PaymentMethodSelector;
