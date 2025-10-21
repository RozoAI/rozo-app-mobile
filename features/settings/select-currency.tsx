import { t } from "i18next";
import { CheckIcon, ChevronRightIcon, DollarSign } from "lucide-react-native";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper,
    ActionsheetItem,
    ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import { currencies as currencyList, defaultCurrency } from "@/libs/currencies";
import { showToast } from "@/libs/utils";
import { useCreateProfile } from "@/modules/api/api";
import { useApp } from "@/providers/app.provider";

type CurrencyOption = {
  code: string;
  label: string;
};

export function ActionSheetCurrencySwitcher(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { mutate: updateProfile, data, error } = useCreateProfile();
  const { merchant, setMerchant } = useApp();

  const [showActionsheet, setShowActionsheet] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Store the current currency code in state
  const [currentCurrency, setCurrentCurrency] = useState<string | undefined>(
    undefined
  );

  // Memoize currencies to prevent unnecessary re-renders
  const currencies = useMemo<CurrencyOption[]>(() => {
    return Object.values(currencyList);
  }, []);

  // Create refs once and store them
  const itemRefs = useRef<Record<string, React.RefObject<any>>>({});

  // Initialize refs only once
  useEffect(() => {
    currencies.forEach((cur) => {
      if (!itemRefs.current[cur.code]) {
        itemRefs.current[cur.code] = React.createRef();
      }
    });
  }, [currencies]);

  // Update current currency when merchant data changes
  useEffect(() => {
    if (merchant?.default_currency) {
      setCurrentCurrency(merchant.default_currency.toUpperCase());
      setIsLoading(false);
    }
  }, [merchant]);

  // Handle API response
  useEffect(() => {
    if (data) {
      setMerchant(data);
      // Update the current currency from the API response
      if (data.default_currency) {
        setCurrentCurrency(data.default_currency.toUpperCase());
      }

      showToast({
        message: "Currency updated successfully",
        type: "success",
      });
      setIsLoading(false);
    } else if (error) {
      showToast({
        message: "Failed to update currency",
        type: "danger",
      });
      setIsLoading(false);
    }
  }, [data, error, setMerchant]);

  // Get the currency label based on the current code
  const currencyLabel = useMemo(() => {
    return (
      currencies.find((curr) => curr.code === currentCurrency)?.label || "-"
    );
  }, [currencies, currentCurrency]);

  // Set the initial focus reference for the actionsheet
  const initialFocusRef = useMemo(() => {
    const code = currentCurrency || defaultCurrency?.code;
    return itemRefs.current[code];
  }, [currentCurrency]);

  // Callbacks
  const handleClose = useCallback(() => setShowActionsheet(false), []);
  const handleOpen = useCallback(() => setShowActionsheet(true), []);

  const handleCurrencyChange = useCallback(
    (value: string) => {
      if (!merchant?.email) return;

      const { created_at, ...rest } = merchant;
      setIsLoading(true);
      // Optimistically update the UI
      setCurrentCurrency(value.toUpperCase());

      updateProfile({
        ...rest,
        default_currency: value.toUpperCase(),
      });

      handleClose();
    },
    [updateProfile, merchant, handleClose]
  );

  // Memoized currency item renderer
  const renderCurrencyItem = useCallback(
    (curr: CurrencyOption) => {
      const isActive = curr.code === currentCurrency;
      return (
        <ActionsheetItem
          key={curr.code}
          ref={itemRefs.current[curr.code]}
          onPress={() => handleCurrencyChange(curr.code)}
          data-active={isActive}
          className="w-full"
        >
          <ActionsheetItemText className="flex w-full items-center justify-between">
            {curr.label}
            {isActive && <CheckIcon />}
          </ActionsheetItemText>
        </ActionsheetItem>
      );
    },
    [currentCurrency, handleCurrencyChange]
  );

  return (
    <>
      <Pressable onPress={handleOpen} className="relative w-full">
        <View>
          <View className="w-full flex-1 flex-row items-center justify-between gap-4 px-2 py-3">
            <View className="flex-row items-center gap-2">
              <Icon as={DollarSign} className="mb-auto mt-1 stroke-[#747474]" />
              <View className="flex-col items-start gap-1">
                <Text size="md">{t("settings.currency.title")}</Text>
                <ThemedText style={{ fontSize: 14 }} type="default">
                  {currencyLabel}
                </ThemedText>
              </View>
            </View>
            <Icon as={ChevronRightIcon} />
          </View>
          {isLoading && (
            <View className="absolute inset-x-0 top-0 z-10 flex size-full items-center justify-center bg-white/50 py-2">
              <Spinner />
            </View>
          )}
        </View>
      </Pressable>

      <Actionsheet
        isOpen={showActionsheet}
        onClose={handleClose}
        trapFocus={false}
        initialFocusRef={initialFocusRef}
      >
        <ActionsheetBackdrop />
        <ActionsheetContent style={{ paddingBottom: insets.bottom }}>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <VStack space="lg" className="w-full">
            <Box className="items-center">
              <Heading size="lg" className="text-typography-950">
                {t("settings.currency.title")}
              </Heading>
            </Box>
            <Box className="w-full">{currencies.map(renderCurrencyItem)}</Box>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
