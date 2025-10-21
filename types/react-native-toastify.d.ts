declare module 'toastify-react-native' {
  import { ComponentType } from 'react';
  
  interface ToastOptions {
    type?: 'success' | 'error' | 'warning' | 'info';
    text1?: string;
    text2?: string;
    visibilityTime?: number;
    position?: 'top' | 'bottom' | 'center';
    hideOnPress?: boolean;
    onPress?: () => void;
    onHide?: () => void;
    props?: any;
  }
  
  interface ToastStatic {
    show: (options: ToastOptions) => void;
    hide: () => void;
  }
  
  const Toast: ComponentType<any> & ToastStatic;
  
  export default Toast;
}
