import { Switch } from "@/components/ui/switch";
import { SettingItem } from "@/features/settings/setting-item";
import { usePOSToggle } from "@/providers/preferences.provider";
import { ShoppingCartIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";

export function POSToggleSetting() {
  const { t } = useTranslation();
  const { showPOS, togglePOS } = usePOSToggle();

  return (
    <SettingItem
      icon={ShoppingCartIcon}
      title={t("settings.pointOfSales.title")}
      description={t("settings.pointOfSales.description")}
      rightElement={
        <Switch value={showPOS} onValueChange={togglePOS} size="md" />
      }
    />
  );
}
