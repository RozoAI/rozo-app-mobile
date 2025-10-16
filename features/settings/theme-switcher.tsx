import { CheckIcon, LaptopIcon, MoonIcon, SunIcon } from "lucide-react-native";
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
import { Pressable } from "@/components/ui/pressable";
import { View } from "@/components/ui/view";
import { VStack } from "@/components/ui/vstack";
import { useSelectedTheme } from "@/hooks/use-selected-theme";
import { cn } from "@/libs/utils";

const themes = [
  { value: "system", icon: LaptopIcon },
  { value: "light", icon: SunIcon },
  { value: "dark", icon: MoonIcon },
];

export function ActionSheetThemeSwitcher({
  className,
  trigger,
}: {
  className?: string;
  trigger: (them: ModeType) => React.ReactNode;
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
      <Pressable
        onPress={() => setShowActionsheet(true)}
        className={cn("w-full", className)}
      >
        <View>{trigger((selectedTheme ?? "system") as ModeType)}</View>
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
                      className={cn("stroke-[#747474]")}
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
