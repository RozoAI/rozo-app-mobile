import { useSelectedTheme } from "@/hooks/use-selected-theme";
import { useMemo } from "react";
import { Dimensions, Image, View } from "react-native";

export function ProtectedByPrivyLogo() {
  const { selectedTheme } = useSelectedTheme();
  const screenWidth = Dimensions.get("window").width;

  const logoUrl = useMemo(() => {
    return selectedTheme === "dark"
      ? require("@/assets/images/Privy_ProtectedLockup_White.png")
      : require("@/assets/images/Privy_ProtectedLockup_Black.png");
  }, [selectedTheme]);

  // Calculate responsive dimensions for landscape logo
  const logoWidth = Math.min(screenWidth * 0.35, 200); // Max 60% of screen width or 200px
  const logoHeight = logoWidth * 0.3; // Maintain aspect ratio for landscape logo

  return (
    <View className="flex-row items-center justify-center">
      <Image
        source={logoUrl}
        style={{
          width: logoWidth,
          height: logoHeight,
          resizeMode: "contain",
        }}
      />
    </View>
  );
}
