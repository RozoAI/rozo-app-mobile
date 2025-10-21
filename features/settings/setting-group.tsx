import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { cn } from "@/libs/utils";
import React from "react";

interface SettingGroupProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingGroup({
  title,
  children,
  className,
}: SettingGroupProps) {
  const childrenArray = React.Children.toArray(children);

  return (
    <Card
      className={cn(
        "rounded-xl border border-background-300 bg-background-0 flex flex-col p-0",
        className
      )}
    >
      {title && (
        <View className="px-4 pt-3 pb-2 bg-background-50 dark:bg-background-900 rounded-xl">
          <Text
            size="sm"
            className="font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            {title}
          </Text>
        </View>
      )}
      <View className="divide-y divide-gray-200 dark:divide-[#2b2b2b]">
        {childrenArray.map((child, index) => (
          <React.Fragment key={index}>{child}</React.Fragment>
        ))}
      </View>
    </Card>
  );
}

