import { ToastManager } from '@/libs/toast/manager';
import type { ToastOptions, ToastType } from '@/libs/toast/types';
import { useCallback } from 'react';

export const useToast = () => {
  const toastManager = ToastManager.getInstance();

  const success = useCallback(
    (message: string, options?: ToastOptions) => {
      toastManager.success(message, options);
    },
    [toastManager]
  );

  const error = useCallback(
    (message: string, options?: ToastOptions) => {
      toastManager.error(message, options);
    },
    [toastManager]
  );

  const warning = useCallback(
    (message: string, options?: ToastOptions) => {
      toastManager.warning(message, options);
    },
    [toastManager]
  );

  const info = useCallback(
    (message: string, options?: ToastOptions) => {
      toastManager.info(message, options);
    },
    [toastManager]
  );

  const custom = useCallback(
    (type: ToastType, message: string, options?: ToastOptions) => {
      toastManager.custom(type, message, options);
    },
    [toastManager]
  );

  const hide = useCallback(() => {
    toastManager.hide();
  }, [toastManager]);

  return {
    success,
    error,
    warning,
    info,
    custom,
    hide,
  };
};
