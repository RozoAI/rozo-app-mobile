import { SettingItem } from '@/features/settings/setting-item';
import { useApp } from '@/providers/app.provider';
import { Shield } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PINActionSheet } from './pin-action-sheet';

export const PINSettings: React.FC = () => {
  const { t } = useTranslation();
  const { merchant } = useApp();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [statusColor, setStatusColor] = useState('#6B7280');

  // Update status text and color when merchant data changes
  useEffect(() => {
    if (merchant?.has_pin) {
      setStatusText(t('settings.pin.enabled'));
      setStatusColor('#10B981'); // Green for enabled
    } else {
      setStatusText(t('settings.pin.disabled'));
      setStatusColor('#6B7280'); // Gray for disabled
    }
  }, [merchant?.has_pin, t]);

  return (
    <>
      <SettingItem
        icon={Shield}
        title={t('settings.pin.title')}
        value={statusText}
        onPress={() => setIsSheetOpen(true)}
        iconColor={statusColor}
      />

      <PINActionSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        hasPin={merchant?.has_pin || false}
      />
    </>
  );
};
