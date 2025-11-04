/**
 * Notification Settings Sheet
 * Settings UI for managing push notification preferences
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, Platform } from 'react-native';
import { useNotifications, useNotificationPermissions } from '@/modules/notifications';
import { useGetNotificationSettings, useUpdateNotificationSettings } from '@/modules/api/api';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Switch } from '@/components/ui/switch';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Divider } from '@/components/ui/divider';
import { AlertCircle, Bell, BellOff, Settings } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettingsSheetProps {
  onClose?: () => void;
}

export const NotificationSettingsSheet: React.FC<NotificationSettingsSheetProps> = ({
  onClose,
}) => {
  const toast = useToast();
  const { permissionStatus, requestPermission, openSettings: openDeviceSettings } =
    useNotificationPermissions();
  const { fcmToken, isTokenRegistered } = useNotifications();

  // Fetch settings from backend
  const { data: settings, isLoading, refetch } = useGetNotificationSettings();
  const updateSettingsMutation = useUpdateNotificationSettings();

  // Local state for toggle switches
  const [localSettings, setLocalSettings] = useState({
    enabled: true,
    orderUpdates: true,
    paymentAlerts: true,
    depositWithdrawals: true,
    merchantMessages: true,
    systemAlerts: true,
    sound: true,
    vibration: true,
    badge: true,
  });

  // Sync with backend settings
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  /**
   * Handle settings change
   */
  const handleToggle = async (key: keyof typeof localSettings) => {
    const newValue = !localSettings[key];

    // Update local state immediately for UI responsiveness
    setLocalSettings((prev) => ({ ...prev, [key]: newValue }));

    try {
      // Update backend
      await updateSettingsMutation.mutateAsync({ [key]: newValue });

      toast.show({
        title: 'Settings updated',
        description: 'Your notification preferences have been saved.',
        type: 'success',
      });
    } catch (error) {
      // Revert on error
      setLocalSettings((prev) => ({ ...prev, [key]: !newValue }));

      toast.show({
        title: 'Update failed',
        description: 'Could not save notification settings. Please try again.',
        type: 'error',
      });
    }
  };

  /**
   * Handle permission request
   */
  const handleRequestPermission = async () => {
    const granted = await requestPermission();

    if (granted) {
      toast.show({
        title: 'Permission granted',
        description: 'You will now receive push notifications.',
        type: 'success',
      });
    } else {
      toast.show({
        title: 'Permission denied',
        description: 'Please enable notifications in your device settings.',
        type: 'warning',
      });
    }
  };

  /**
   * Render permission status banner
   */
  const renderPermissionBanner = () => {
    if (permissionStatus === 'granted') {
      return null;
    }

    return (
      <Box className="bg-warning-50 dark:bg-warning-900 p-4 rounded-lg mb-4">
        <HStack space="md" className="items-center">
          <Icon as={AlertCircle} size="lg" className="text-warning-700 dark:text-warning-300" />
          <VStack className="flex-1">
            <Text className="font-semibold text-warning-700 dark:text-warning-300">
              Notifications disabled
            </Text>
            <Text className="text-sm text-warning-600 dark:text-warning-400">
              {permissionStatus === 'denied'
                ? 'Enable notifications in your device settings to receive updates.'
                : 'Grant permission to receive order updates and payment alerts.'}
            </Text>
          </VStack>
        </HStack>

        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onPress={
            permissionStatus === 'denied' ? openDeviceSettings : handleRequestPermission
          }
        >
          <ButtonText>
            {permissionStatus === 'denied' ? 'Open Settings' : 'Enable Notifications'}
          </ButtonText>
        </Button>
      </Box>
    );
  };

  /**
   * Render token status
   */
  const renderTokenStatus = () => {
    if (!fcmToken) {
      return null;
    }

    return (
      <Box className="bg-background-50 dark:bg-background-900 p-3 rounded-lg mb-4">
        <HStack space="sm" className="items-center">
          <Icon
            as={isTokenRegistered ? Bell : BellOff}
            size="sm"
            className="text-typography-500"
          />
          <Text className="text-xs text-typography-500">
            Status: {isTokenRegistered ? 'Active' : 'Inactive'}
          </Text>
        </HStack>
      </Box>
    );
  };

  return (
    <ScrollView className="flex-1 bg-background-0">
      <Box className="p-6">
        <HStack className="items-center justify-between mb-6">
          <HStack space="md" className="items-center">
            <Icon as={Bell} size="xl" className="text-primary-500" />
            <Heading size="xl">Notifications</Heading>
          </HStack>
        </HStack>

        {renderPermissionBanner()}
        {renderTokenStatus()}

        {/* Main toggle */}
        <Box className="mb-6">
          <HStack className="items-center justify-between py-4">
            <VStack className="flex-1 mr-4">
              <Text className="font-semibold text-typography-900 dark:text-typography-100">
                Enable Notifications
              </Text>
              <Text className="text-sm text-typography-500 dark:text-typography-400">
                Receive push notifications for important updates
              </Text>
            </VStack>
            <Switch
              value={localSettings.enabled}
              onValueChange={() => handleToggle('enabled')}
              disabled={permissionStatus !== 'granted' || isLoading}
            />
          </HStack>
        </Box>

        <Divider className="my-2" />

        {/* Notification types */}
        <VStack space="md" className="mt-4">
          <Text className="font-semibold text-typography-700 dark:text-typography-300 mb-2">
            Notification Types
          </Text>

          <HStack className="items-center justify-between py-3">
            <VStack className="flex-1 mr-4">
              <Text className="text-typography-900 dark:text-typography-100">
                Order Updates
              </Text>
              <Text className="text-sm text-typography-500 dark:text-typography-400">
                Status changes and confirmations
              </Text>
            </VStack>
            <Switch
              value={localSettings.orderUpdates}
              onValueChange={() => handleToggle('orderUpdates')}
              disabled={!localSettings.enabled || permissionStatus !== 'granted'}
            />
          </HStack>

          <HStack className="items-center justify-between py-3">
            <VStack className="flex-1 mr-4">
              <Text className="text-typography-900 dark:text-typography-100">
                Payment Alerts
              </Text>
              <Text className="text-sm text-typography-500 dark:text-typography-400">
                Payment reminders and confirmations
              </Text>
            </VStack>
            <Switch
              value={localSettings.paymentAlerts}
              onValueChange={() => handleToggle('paymentAlerts')}
              disabled={!localSettings.enabled || permissionStatus !== 'granted'}
            />
          </HStack>

          <HStack className="items-center justify-between py-3">
            <VStack className="flex-1 mr-4">
              <Text className="text-typography-900 dark:text-typography-100">
                Deposits & Withdrawals
              </Text>
              <Text className="text-sm text-typography-500 dark:text-typography-400">
                Transaction completion notifications
              </Text>
            </VStack>
            <Switch
              value={localSettings.depositWithdrawals}
              onValueChange={() => handleToggle('depositWithdrawals')}
              disabled={!localSettings.enabled || permissionStatus !== 'granted'}
            />
          </HStack>

          <HStack className="items-center justify-between py-3">
            <VStack className="flex-1 mr-4">
              <Text className="text-typography-900 dark:text-typography-100">
                Merchant Messages
              </Text>
              <Text className="text-sm text-typography-500 dark:text-typography-400">
                Important messages and announcements
              </Text>
            </VStack>
            <Switch
              value={localSettings.merchantMessages}
              onValueChange={() => handleToggle('merchantMessages')}
              disabled={!localSettings.enabled || permissionStatus !== 'granted'}
            />
          </HStack>

          <HStack className="items-center justify-between py-3">
            <VStack className="flex-1 mr-4">
              <Text className="text-typography-900 dark:text-typography-100">
                System Alerts
              </Text>
              <Text className="text-sm text-typography-500 dark:text-typography-400">
                Important system notifications
              </Text>
            </VStack>
            <Switch
              value={localSettings.systemAlerts}
              onValueChange={() => handleToggle('systemAlerts')}
              disabled={!localSettings.enabled || permissionStatus !== 'granted'}
            />
          </HStack>
        </VStack>

        <Divider className="my-4" />

        {/* Notification behavior */}
        <VStack space="md" className="mt-4">
          <Text className="font-semibold text-typography-700 dark:text-typography-300 mb-2">
            Notification Behavior
          </Text>

          <HStack className="items-center justify-between py-3">
            <VStack className="flex-1 mr-4">
              <Text className="text-typography-900 dark:text-typography-100">Sound</Text>
              <Text className="text-sm text-typography-500 dark:text-typography-400">
                Play sound for notifications
              </Text>
            </VStack>
            <Switch
              value={localSettings.sound}
              onValueChange={() => handleToggle('sound')}
              disabled={!localSettings.enabled || permissionStatus !== 'granted'}
            />
          </HStack>

          {Platform.OS === 'android' && (
            <HStack className="items-center justify-between py-3">
              <VStack className="flex-1 mr-4">
                <Text className="text-typography-900 dark:text-typography-100">
                  Vibration
                </Text>
                <Text className="text-sm text-typography-500 dark:text-typography-400">
                  Vibrate on notification
                </Text>
              </VStack>
              <Switch
                value={localSettings.vibration}
                onValueChange={() => handleToggle('vibration')}
                disabled={!localSettings.enabled || permissionStatus !== 'granted'}
              />
            </HStack>
          )}

          {Platform.OS === 'ios' && (
            <HStack className="items-center justify-between py-3">
              <VStack className="flex-1 mr-4">
                <Text className="text-typography-900 dark:text-typography-100">Badge</Text>
                <Text className="text-sm text-typography-500 dark:text-typography-400">
                  Show unread count on app icon
                </Text>
              </VStack>
              <Switch
                value={localSettings.badge}
                onValueChange={() => handleToggle('badge')}
                disabled={!localSettings.enabled || permissionStatus !== 'granted'}
              />
            </HStack>
          )}
        </VStack>

        {/* Advanced settings link */}
        <Button
          variant="link"
          size="sm"
          className="mt-6"
          onPress={openDeviceSettings}
        >
          <Icon as={Settings} size="sm" className="mr-2" />
          <ButtonText>Advanced Notification Settings</ButtonText>
        </Button>
      </Box>
    </ScrollView>
  );
};
