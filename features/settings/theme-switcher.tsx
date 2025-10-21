import { CheckIcon, LaptopIcon, MoonIcon, Palette, SunIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper,
    ActionsheetIcon,
    ActionsheetItem,
    ActionsheetItemText,
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { type ModeType } from "@/components/ui/gluestack-ui-provider";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { SettingItem } from "@/features/settings/setting-item";
import { useSelectedTheme } from "@/hooks/use-selected-theme";

const themes = [
  { value: "system", icon: LaptopIcon },
  { value: "light", icon: SunIcon },
  { value: "dark", icon: MoonIcon },
];

export function ActionSheetThemeSwitcher({
  className,
}: {
  className?: string;
}) {
  const { t } = useTranslation();
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const [showActionsheet, setShowActionsheet] = useState(false);
  const handleClose = () => setShowActionsheet(false);

  function handleColorMode(value: ModeType) {
    setSelectedTheme(value);
    handleClose();
  }

  const itemRefs = React.useRef<{ [key: string]: React.RefObject<any> }>({});

  useEffect(() => {
    themes.forEach((theme) => {
      if (!itemRefs.current[theme.value]) {
        itemRefs.current[theme.value] = React.createRef();
      }
    });

    if (colorScheme !== selectedTheme && colorScheme) {
      setSelectedTheme(colorScheme);
    }
  }, []);

  const initialFocusRef = useMemo(() => {
    const currentTheme = selectedTheme ?? "system";
    return itemRefs.current[currentTheme];
  }, [selectedTheme]);

  return (
    <>
      <SettingItem
        icon={Palette}
        title={t("settings.theme.title")}
        value={t(`settings.theme.${selectedTheme ?? "system"}`)}
        onPress={() => setShowActionsheet(true)}
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
                {t("settings.theme.title")}
              </Heading>
            </Box>
            <Box>
              {themes.map((th) => {
                const isActive = th.value === selectedTheme;

                return (
                  <ActionsheetItem
                    key={th.value}
                    ref={itemRefs.current[th.value]}
                    onPress={() => handleColorMode(th.value as ModeType)}
                    data-active={isActive}
                  >
                    <ActionsheetIcon
                      className="stroke-[#747474]"
                      as={th.icon}
                    />
                    <ActionsheetItemText className="flex w-full items-center justify-between">
                      {t(`settings.theme.${th.value}`)}
                      {isActive && <CheckIcon />}
                    </ActionsheetItemText>
                  </ActionsheetItem>
                );
              })}
            </Box>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
