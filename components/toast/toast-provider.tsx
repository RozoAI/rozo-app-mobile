import React from 'react';
import ToastProviderNative from 'toastify-react-native';

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <ToastProviderNative />
    </>
  );
};
