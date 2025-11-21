import { ChevronRightIcon } from "lucide-react-native";
import React, { useRef } from "react";

import { ThemedText } from "@/components/themed-text";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import { VStack } from "@/components/ui/vstack";
import {
  ProfileSheet,
  type ProfileSheetRefType,
} from "@/features/settings/profile-sheet";
import { useApp } from "@/providers/app.provider";

export function AccountSection() {
  const { merchant } = useApp();
  const profileSheetRef = useRef<ProfileSheetRefType>(null);

  return (
    <VStack space="sm" className="w-full">
      <Pressable
        onPress={() => profileSheetRef.current?.open()}
        className="flex flex-row items-center justify-between"
      >
        <HStack space="sm" className="items-center">
          <Avatar className="mr-2" size="sm">
            <AvatarFallbackText>
              {merchant?.display_name?.slice(0, 2) || "-"}
            </AvatarFallbackText>
            <AvatarImage
              source={{
                uri: merchant?.logo_url || undefined,
              }}
              alt="image"
            />
          </Avatar>
          <Box className="flex flex-col">
            <Heading size="sm">{merchant?.display_name ?? "-"}</Heading>
            {merchant?.display_name !== merchant?.email ? (
              <ThemedText
                style={{ fontSize: 12, color: "#6B7280" }}
                type="default"
              >
                {merchant?.email ?? "-"}
              </ThemedText>
            ) : (
              <ThemedText style={{ fontSize: 12 }} type="default">
                {"-"}
              </ThemedText>
            )}
          </Box>
        </HStack>
        <Icon as={ChevronRightIcon} />
      </Pressable>

      <ProfileSheet ref={profileSheetRef} />
    </VStack>
  );
}
