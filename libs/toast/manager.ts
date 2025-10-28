import { Toast } from 'toastify-react-native';
import { toastConfig } from './config';
import type { ToastOptions, ToastType } from './types';

export class ToastManager {
  private static instance: ToastManager;

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  private showToast(
    type: ToastType,
    message: string,
    options: ToastOptions = {}
  ): void {
    const {
      duration = toastConfig.defaultDuration,
      position = toastConfig.defaultPosition,
      onPress,
      onHide,
    } = options;

    Toast.show({
      type: type === 'warning' ? 'warn' : type === 'custom' ? 'info' : type,
      text1: message,
      visibilityTime: duration,
      position,
      onPress,
      onHide,
    });
  }

  success(message: string, options?: ToastOptions): void {
    this.showToast('success', message, options);
  }

  error(message: string, options?: ToastOptions): void {
    this.showToast('error', message, options);
  }

  warning(message: string, options?: ToastOptions): void {
    this.showToast('warning', message, options);
  }

  info(message: string, options?: ToastOptions): void {
    this.showToast('info', message, options);
  }

  custom(type: ToastType, message: string, options?: ToastOptions): void {
    this.showToast(type, message, options);
  }

  hide(): void {
    Toast.hide();
  }
}
