/**
 * Notification API Endpoints
 * API endpoints for device token registration and notification settings
 */

import { createMutation, createQuery } from 'react-query-kit';
import { client as apiClient } from '@/modules/axios/client';
import type { DeviceInfo, NotificationSettings } from '@/modules/notifications';

/**
 * Register device token with backend
 */
export const useRegisterDeviceToken = createMutation({
  mutationKey: ['merchant', 'notifications', 'register'],
  mutationFn: async (variables: DeviceInfo) => {
    const response = await apiClient.post('/merchant/devices', variables);
    return response.data;
  },
});

/**
 * Unregister device token from backend
 */
export const useUnregisterDeviceToken = createMutation({
  mutationKey: ['merchant', 'notifications', 'unregister'],
  mutationFn: async (variables: { deviceId: string; token: string }) => {
    const response = await apiClient.delete('/merchant/devices', {
      data: variables,
    });
    return response.data;
  },
});

/**
 * Update device token (used when token refreshes)
 */
export const useUpdateDeviceToken = createMutation({
  mutationKey: ['merchant', 'notifications', 'update'],
  mutationFn: async (variables: {
    deviceId: string;
    oldToken: string;
    newToken: string;
  }) => {
    const response = await apiClient.patch('/merchant/devices', variables);
    return response.data;
  },
});

/**
 * Get notification settings
 */
export const useGetNotificationSettings = createQuery({
  queryKey: ['merchant', 'notifications', 'settings'],
  fetcher: async () => {
    const response = await apiClient.get<NotificationSettings>(
      '/merchant/notifications/settings'
    );
    return response.data;
  },
});

/**
 * Update notification settings
 */
export const useUpdateNotificationSettings = createMutation({
  mutationKey: ['merchant', 'notifications', 'settings', 'update'],
  mutationFn: async (variables: Partial<NotificationSettings>) => {
    const response = await apiClient.patch(
      '/merchant/notifications/settings',
      variables
    );
    return response.data;
  },
});

/**
 * Get notification history
 */
export const useGetNotificationHistory = createQuery({
  queryKey: ['merchant', 'notifications', 'history'],
  fetcher: async (variables: { page?: number; limit?: number }) => {
    const response = await apiClient.get('/merchant/notifications/history', {
      params: variables,
    });
    return response.data;
  },
});

/**
 * Mark notification as read (on backend)
 */
export const useMarkNotificationAsRead = createMutation({
  mutationKey: ['merchant', 'notifications', 'read'],
  mutationFn: async (variables: { notificationId: string }) => {
    const response = await apiClient.patch(
      `/merchant/notifications/${variables.notificationId}/read`
    );
    return response.data;
  },
});

/**
 * Test notification (for testing purposes)
 */
export const useSendTestNotification = createMutation({
  mutationKey: ['merchant', 'notifications', 'test'],
  mutationFn: async (variables: { type: string; data?: any }) => {
    const response = await apiClient.post('/merchant/notifications/test', variables);
    return response.data;
  },
});
