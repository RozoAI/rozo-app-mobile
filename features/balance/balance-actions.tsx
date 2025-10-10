import { ArrowDownIcon, BanknoteArrowDown } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";

interface BalanceActionsProps {
  onReceivePress: () => void;
  onWithdrawPress: () => void;
}

export function BalanceActions({
  onReceivePress,
  onWithdrawPress,
}: BalanceActionsProps) {
  const { t } = useTranslation();

  return (
    <VStack space="md">
      <HStack space="md" className="w-full">
        <Button
          size="sm"
          className="flex-1 rounded-xl"
          variant="solid"
          action="secondary"
          onPress={onReceivePress}
        >
          <ButtonIcon as={ArrowDownIcon} />
          <ButtonText>{t("general.receive")}</ButtonText>
        </Button>

        <Button
          size="sm"
          className="flex-1 rounded-xl"
          variant="solid"
          action="primary"
          onPress={onWithdrawPress}
        >
          <ButtonIcon as={BanknoteArrowDown} />
          <ButtonText>{t("general.withdraw")}</ButtonText>
        </Button>
      </HStack>
    </VStack>
  );
}
