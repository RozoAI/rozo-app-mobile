declare module 'toastify-react-native' {
  import { ReactNode } from 'react';
  
  type ToastPosition = 'top' | 'bottom' | 'center';
  type ToastType = 'success' | 'error' | 'info' | 'warn';
  type IconFamily = 'AntDesign' | 'Entypo' | 'EvilIcons' | 'Feather' | 'FontAwesome' | 'FontAwesome5' | 'Foundation' | 'Ionicons' | 'MaterialIcons' | 'MaterialCommunityIcons' | 'SimpleLineIcons' | 'Octicons' | 'Zocial';
  
  interface ToastShowParams {
    type?: ToastType;
    text1?: string;
    text2?: string;
    position?: ToastPosition;
    visibilityTime?: number;
    autoHide?: boolean;
    topOffset?: number;
    bottomOffset?: number;
    keyboardOffset?: number;
    onShow?: () => void;
    onHide?: () => void;
    onPress?: () => void;
    icon?: string | ReactNode;
    iconFamily?: IconFamily;
    useModal?: boolean;
    props?: any;
  }
  
  interface ToastRef {
    show: (options: ToastShowParams) => void;
    hide: () => void;
  }
  
  interface ToastStatic {
    show: (options: ToastShowParams) => void;
    hide: () => void;
    success: (text: string, position?: ToastPosition, icon?: string | ReactNode, iconFamily?: IconFamily, useModal?: boolean) => void;
    error: (text: string, position?: ToastPosition, icon?: string | ReactNode, iconFamily?: IconFamily, useModal?: boolean) => void;
    info: (text: string, position?: ToastPosition, icon?: string | ReactNode, iconFamily?: IconFamily, useModal?: boolean) => void;
    warn: (text: string, position?: ToastPosition, icon?: string | ReactNode, iconFamily?: IconFamily, useModal?: boolean) => void;
  }
  
  export const Toast: ToastStatic;
  export default function ToastProvider(props: any): JSX.Element;
}
