import { t } from "i18next";
import { CheckIcon, Languages } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { VStack } from "@/components/ui/vstack";
import { SettingItem } from "@/features/settings/setting-item";
import { useSelectedLanguage } from "@/hooks/use-selected-language";
import { useToast } from "@/hooks/use-toast";
import { useCreateProfile } from "@/modules/api/api";
import { type Language } from "@/modules/i18n/resources";
import { useApp } from "@/providers/app.provider";

// Define a display language type that's different from the actual Language type
type DisplayLanguageCode = string;

type LanguageOption = {
  label: string;
  key: DisplayLanguageCode;
  flag: string;
  value: Language; // The actual language value used in the app
};

export const languages: readonly LanguageOption[] = [
  {
    label: "Arabic (العربية)",
    key: "AR",
    flag: "🇸🇦",
    value: "ar",
  },
  {
    label: "Bengali (বাংলা)",
    key: "BN",
    flag: "🇧🇩",
    value: "bn",
  },
  {
    label: "Chinese (中文)",
    key: "ZH",
    flag: "🇨🇳",
    value: "zh",
  },
  {
    label: "English (English)",
    key: "EN",
    flag: "🇺🇸",
    value: "en",
  },
  {
    label: "French (Français)",
    key: "FR",
    flag: "🇫🇷",
    value: "fr",
  },
  {
    label: "Hindi (हिन्दी)",
    key: "HI",
    flag: "🇮🇳",
    value: "hi",
  },
  {
    label: "Indonesian (Bahasa Indonesia)",
    key: "ID",
    flag: "🇮🇩",
    value: "id",
  },
  {
    label: "Portuguese (Português)",
    key: "PT",
    flag: "🇵🇹",
    value: "pt",
  },
  {
    label: "Russian (Русский)",
    key: "RU",
    flag: "🇷🇺",
    value: "ru",
  },
  {
    label: "Spanish (Español)",
    key: "ES",
    flag: "🇪🇸",
    value: "es",
  },
] as const;

type ActionSheetLanguageSwitcherProps = {
  className?: string;
  /**
   * Whether to update the API when language changes
   * @default true
   */
  updateApi?: boolean;
  /**
   * Callback when language changes
   */
  onChange?: (language: Language) => void;
  /**
   * Initial language value
   * @default from useSelectedLanguage
   */
  initialLanguage?: Language;
};

export function ActionSheetLanguageSwitcher({
  className,
  updateApi = true,
  onChange,
  initialLanguage,
}: ActionSheetLanguageSwitcherProps): React.ReactElement {
  const { language: contextLanguage, setLanguage } = useSelectedLanguage();
  const language = initialLanguage || contextLanguage;
  // Find the display language code based on the current language
  const findDisplayLanguage = useCallback(
    (lang: Language): DisplayLanguageCode => {
      const found = languages.find((lg) => lg.value === lang);
      return found ? found.key : "EN";
    },
    []
  );

  const [selectedValue, setSelectedValue] = useState<DisplayLanguageCode>(
    findDisplayLanguage(language || "en")
  );
  const [showActionsheet, setShowActionsheet] = useState<boolean>(false);

  const {
    mutateAsync: updateProfile,
    data,
    isPending,
    error,
  } = useCreateProfile();
  const { merchant, setMerchant } = useApp();
  const { success, error: showError } = useToast();
  const insets = useSafeAreaInsets();

  // Create refs once and store them
  const itemRefs = useRef<Record<string, React.RefObject<any>>>({});

  // Initialize refs only once
  useEffect(() => {
    languages.forEach((lg) => {
      if (!itemRefs.current[lg.key]) {
        itemRefs.current[lg.key] = React.createRef();
      }
    });
  }, []);

  // Update selected value when merchant data or initialLanguage changes
  useEffect(() => {
    if (initialLanguage) {
      // If initialLanguage is provided, use that
      const displayLang = findDisplayLanguage(initialLanguage);
      setSelectedValue(displayLang);
    } else if (merchant?.default_language) {
      // Otherwise use merchant's language if available
      // Convert the merchant's language to our display language code
      const displayLang =
        languages.find(
          (lg) =>
            lg.value === (merchant.default_language.toLowerCase() as Language)
        )?.key || "EN";
      setSelectedValue(displayLang);
    }
  }, [merchant?.default_language, initialLanguage, findDisplayLanguage]);

  // Handle API response - only when updateApi is true
  useEffect(() => {
    if (!updateApi) return;

    if (data) {
      setMerchant(data);
      // Find the corresponding language value for the display language code
      const languageValue =
        languages.find((lg) => lg.key === data.default_language.toUpperCase())
          ?.value || "en";
      success("Language updated successfully");

      setLanguage(languageValue);

      // Call onChange callback if provided
      if (onChange) {
        onChange(languageValue);
      }
    } else if (error) {
      showError("Failed to update language");
    }
  }, [
    data,
    error,
    updateApi,
    onChange,
    setLanguage,
    setMerchant,
    success,
    showError,
  ]);

  // Memoized values
  const initialLabel = useMemo(() => {
    // Find display language that matches the current language value
    const lg = languages.find((lg) => lg.value === language);
    return lg ? `${lg.flag} ${lg.label}` : "-";
  }, [language]);

  const selectedLabel = useMemo(() => {
    const lg = languages.find((lg) => lg.key === selectedValue);
    return lg ? `${lg.flag} ${lg.label}` : "-";
  }, [selectedValue]);

  const initialFocusRef = useMemo(() => {
    // Use the display language code for the ref
    const displayLanguage = findDisplayLanguage(language || "en");
    return itemRefs.current[selectedValue] || itemRefs.current[displayLanguage];
  }, [selectedValue, language, findDisplayLanguage]);

  // Callbacks
  const handleClose = useCallback(() => setShowActionsheet(false), []);
  const handleOpen = useCallback(() => setShowActionsheet(true), []);

  const handleLanguageChange = useCallback(
    (displayCode: DisplayLanguageCode) => {
      // Find the language option that matches the display code
      const languageOption = languages.find((lg) => lg.key === displayCode);
      if (!languageOption) return;

      // Set selected value immediately for UI feedback
      setSelectedValue(displayCode);

      // Update API if enabled and merchant exists
      if (updateApi && merchant?.email) {
        const { created_at, ...rest } = merchant;
        updateProfile({
          ...rest,
          default_language: displayCode,
        });
      } else {
        // If not updating API, still update language immediately
        setLanguage(languageOption.value);

        // Call onChange callback if provided
        if (onChange) {
          onChange(languageOption.value);
        }
      }

      handleClose();
    },
    [updateApi, updateProfile, handleClose, merchant, onChange, setLanguage]
  );

  // Memoized language item renderer
  const renderLanguageItem = useCallback(
    (lg: LanguageOption) => {
      const isActive = lg.key === selectedValue;
      return (
        <ActionsheetItem
          key={lg.key}
          ref={itemRefs.current[lg.key]}
          onPress={() => handleLanguageChange(lg.key)}
          data-active={isActive}
        >
          <ActionsheetItemText className="flex w-full items-center justify-between">
            {`${lg.flag} ${lg.label}`}
            {isActive && <CheckIcon />}
          </ActionsheetItemText>
        </ActionsheetItem>
      );
    },
    [selectedValue, handleLanguageChange]
  );

  return (
    <>
      <SettingItem
        icon={Languages}
        title={t("settings.language.title")}
        value={selectedLabel ?? initialLabel}
        onPress={handleOpen}
        loading={updateApi && isPending}
        className={className}
      />

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
                {t("settings.language.title")}
              </Heading>
            </Box>
            <Box className="w-full">{languages.map(renderLanguageItem)}</Box>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
