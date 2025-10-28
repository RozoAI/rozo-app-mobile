export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'custom' | 'warn';

export interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
  hideOnPress?: boolean;
  onPress?: () => void;
  onHide?: () => void;
  icon?: React.ReactNode;
  customStyle?: any;
  customTextStyle?: any;
}

export interface ToastConfig {
  defaultDuration: number;
  defaultPosition: 'top' | 'bottom' | 'center';
  maxToasts: number;
  enableQueue: boolean;
}

export interface ToastTheme {
  backgroundColor: string;
  textColor: string;
  icon?: string;
  iconColor?: string;
}
