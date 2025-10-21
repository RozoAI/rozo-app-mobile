import { ThemedText } from "@/components/themed-text";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { cn } from "@/libs/utils";
import { ChevronRightIcon } from "lucide-react-native";
import type React from "react";

interface SettingItemProps {
  icon: React.ComponentType<any>;
  title: string;
  description?: string;
  value?: string | React.ReactNode;
  onPress?: () => void;
  loading?: boolean;
  rightElement?: React.ReactNode;
  iconColor?: string;
  disabled?: boolean;
  className?: string;
}

export function SettingItem({
  icon,
  title,
  description,
  value,
  onPress,
  loading = false,
  rightElement,
  iconColor = "#747474",
  disabled = false,
  className,
}: SettingItemProps) {
  const content = (
    <View className="w-full flex-1 flex-row items-center justify-between gap-4 px-4 py-3">
      <View className="flex-row items-center gap-3 flex-1">
        <Icon
          as={icon}
          className="mt-1 shrink-0"
          style={{ stroke: iconColor }}
        />
        <View className="flex-col items-start gap-1 flex-1">
          <Text size="md" className="shrink">
            {title}
          </Text>
          {description && (
            <Text size="sm" className="shrink text-gray-600 dark:text-gray-400">
              {description}
            </Text>
          )}
          {value && typeof value === "string" ? (
            <ThemedText style={{ fontSize: 14 }} type="default">
              {value}
            </ThemedText>
          ) : (
            value
          )}
        </View>
      </View>

      <View className="shrink-0">
        {rightElement || (onPress && !disabled && <Icon as={ChevronRightIcon} />)}
      </View>

      {loading && (
        <View className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 py-2 dark:bg-white/20">
          <Spinner />
        </View>
      )}
    </View>
  );

  // If there's an onPress handler, wrap in Pressable; otherwise use plain View
  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        className={cn("relative w-full", className)}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View className={cn("relative w-full", className)}>
      {content}
    </View>
  );
}

