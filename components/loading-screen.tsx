import { Spinner } from "@/components/ui/spinner";
import { useSelectedTheme } from "@/hooks/use-selected-theme";
import { MerchantProfile } from "@/modules/api/schema/merchant";
import { Image } from "react-native";
import LogoSvg from "./svg/logo";
import LogoWhiteSvg from "./svg/logo-white";
import { View } from "./ui/view";

type PageLoaderProps = {
  merchant?: MerchantProfile;
};

export function LoadingScreen({ merchant }: PageLoaderProps) {
  const { selectedTheme } = useSelectedTheme();

  return (
    <View className="flex-1 items-center justify-center">
      <View className="items-center justify-center gap-4">
        {merchant?.logo_url ? (
          <Image
            source={{ uri: merchant.logo_url }}
            className="size-16 rounded-full"
            resizeMode="contain"
          />
        ) : selectedTheme === "dark" ? (
          <LogoWhiteSvg width={64} height={64} />
        ) : (
          <LogoSvg width={64} height={64} />
        )}
        <Spinner size="small" />
      </View>
    </View>
  );
}
