import type { ToastConfig, ToastTheme } from './types';

export const toastConfig: ToastConfig = {
  defaultDuration: 3000,
  defaultPosition: 'top',
  maxToasts: 3,
  enableQueue: true,
};

export const toastThemes: Record<string, ToastTheme> = {
  success: {
    backgroundColor: '#10B981',
    textColor: '#FFFFFF',
    icon: 'check-circle',
    iconColor: '#FFFFFF',
  },
  error: {
    backgroundColor: '#EF4444',
    textColor: '#FFFFFF',
    icon: 'x-circle',
    iconColor: '#FFFFFF',
  },
  warning: {
    backgroundColor: '#F59E0B',
    textColor: '#FFFFFF',
    icon: 'exclamation-triangle',
    iconColor: '#FFFFFF',
  },
  warn: {
    backgroundColor: '#F59E0B',
    textColor: '#FFFFFF',
    icon: 'exclamation-triangle',
    iconColor: '#FFFFFF',
  },
  info: {
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF',
    icon: 'information-circle',
    iconColor: '#FFFFFF',
  },
};
