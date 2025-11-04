/**
 * useNotifications Hook
 * Main hook for accessing notification context
 */

import { useContext } from 'react';
import { NotificationContext } from '../provider';
import { NotificationContextState } from '../types';

/**
 * Hook to access notification context
 * Must be used within NotificationProvider
 */
export const useNotifications = (): NotificationContextState => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }

  return context;
};
