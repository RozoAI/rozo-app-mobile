# Toast System Documentation

## Overview

The Rozo App uses a centralized toast system built on `toastify-react-native` for displaying user notifications across the application. This system provides a clean, maintainable, and mobile-optimized approach to toast notifications.

## Architecture

### Core Components

```
libs/toast/
├── types.ts          # TypeScript type definitions
├── config.ts         # Configuration and themes
└── manager.ts        # Centralized toast management

hooks/
└── use-toast.tsx     # React hook for components

components/toast/
└── toast-provider.tsx # Provider wrapper component
```

### Key Features

- **Centralized Management**: Single source of truth for all toast behavior
- **Type Safety**: Full TypeScript support with proper type definitions
- **Mobile Optimized**: Built on `toastify-react-native` for reliable mobile performance
- **Consistent UX**: Unified styling and behavior across the app
- **Easy Maintenance**: Simple API for adding/modifying toast functionality

## Installation & Setup

### Dependencies

```bash
bun add toastify-react-native
```

### Provider Setup

The toast system is automatically integrated into the app through the `AppProvider`:

```typescript
// providers/app.provider.tsx
export const AppProvider: React.FC<IProviderProps> = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        <MerchantProvider>
          <WalletProvider>
            <PreferencesProvider>
              <AppProviderInternal>{children}</AppProviderInternal>
            </PreferencesProvider>
          </WalletProvider>
        </MerchantProvider>
      </AuthProvider>
    </ToastProvider>
  );
};
```

## Usage

### Basic Usage

```typescript
import { useToast } from '@/hooks/use-toast';

const MyComponent = () => {
  const { success, error, warning, info } = useToast();

  const handleSuccess = () => {
    success("Operation completed successfully!");
  };

  const handleError = () => {
    error("Something went wrong");
  };

  const handleWarning = () => {
    warning("Please check your connection");
  };

  const handleInfo = () => {
    info("Synchronizing data...");
  };

  return (
    // Your component JSX
  );
};
```

### Advanced Usage

```typescript
const { custom } = useToast();

// Custom toast with options
custom('success', 'Payment completed!', {
  duration: 5000,
  position: 'top',
  onPress: () => navigateToOrders(),
  onHide: () => console.log('Toast hidden'),
});
```

### Toast Options

```typescript
interface ToastOptions {
  duration?: number;           // Display duration in ms (default: 3000)
  position?: 'top' | 'bottom' | 'center'; // Toast position (default: 'top')
  hideOnPress?: boolean;       // Hide when pressed (default: true)
  onPress?: () => void;        // Callback when pressed
  onHide?: () => void;         // Callback when hidden
  icon?: React.ReactNode;      // Custom icon
  customStyle?: any;          // Custom styling
  customTextStyle?: any;      // Custom text styling
}
```

## Toast Types

### Available Types

- **`success`**: Green background, check icon - for successful operations
- **`error`**: Red background, X icon - for errors and failures
- **`warning`**: Orange background, warning icon - for warnings
- **`info`**: Blue background, info icon - for informational messages

### Theme Configuration

```typescript
// libs/toast/config.ts
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
  info: {
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF',
    icon: 'information-circle',
    iconColor: '#FFFFFF',
  },
};
```

## Integration Examples

### Merchant Status Error Handling

The toast system is integrated with merchant status error handling:

```typescript
// hooks/use-merchant-status-error-handler.tsx
const handleMerchantStatusError = useCallback(async (
  error: MerchantStatusError,
  onLogout?: () => Promise<void>
) => {
  const { config } = error;
  
  // Show appropriate toast message
  if (config.toastType === 'danger') {
    error(config.message, { duration: config.shouldLogout ? 5000 : 3000 });
  } else if (config.toastType === 'warning') {
    warning(config.message, { duration: config.shouldLogout ? 5000 : 3000 });
  } else {
    success(config.message, { duration: config.shouldLogout ? 5000 : 3000 });
  }

  // Trigger logout if required
  if (config.shouldLogout && onLogout) {
    setTimeout(async () => {
      try {
        await onLogout();
      } catch (logoutError) {
        error('Failed to logout. Please try again.');
      }
    }, 1000);
  }
}, [success, error, warning]);
```

### Payment Flow Integration

```typescript
// features/payment/payment.tsx
const { error } = useToast();

const handleCreateOrder = async () => {
  try {
    const response = await createOrder({
      amount: parseFloat(amount),
      currency: defaultCurrency.code,
      description: description || undefined,
    });
    
    setCreatedOrder(response);
    setIsPaymentModalOpen(true);
  } catch (err: any) {
    console.error("Error creating order:", err);
    error(err.message as string);
  }
};
```

### Authentication Flow Integration

```typescript
// providers/auth.provider.tsx
const { error } = useToast();

const initializeAuth = async () => {
  try {
    const token = await getAccessToken();
    if (token) {
      setAccessToken(token);
      storage.set(TOKEN_KEY, token);
    }
  } catch (err) {
    console.error("Auth initialization error:", err);
    if (isMounted) {
      error("Failed to initialize authentication");
      hasInitialized.current = false;
    }
  }
};
```

## Best Practices

### 1. Use Appropriate Toast Types

```typescript
// ✅ Good - Clear intent
success("Profile updated successfully!");
error("Failed to save changes");
warning("Please check your internet connection");
info("Synchronizing data...");

// ❌ Avoid - Misleading types
success("Error occurred"); // Should be error()
error("Success message");  // Should be success()
```

### 2. Keep Messages Concise

```typescript
// ✅ Good - Clear and concise
success("Payment completed!");
error("Network connection failed");

// ❌ Avoid - Too verbose
success("Your payment has been successfully processed and the transaction has been completed without any issues!");
```

### 3. Use Appropriate Duration

```typescript
// ✅ Good - Context-appropriate duration
error("Critical error", { duration: 5000 }); // Longer for important errors
success("Quick action", { duration: 2000 }); // Shorter for quick confirmations
```

### 4. Handle User Interactions

```typescript
// ✅ Good - Provide actionable feedback
error("Payment failed", {
  duration: 5000,
  onPress: () => navigateToPaymentRetry(),
});
```

### 5. Avoid Toast Spam

```typescript
// ✅ Good - Debounce rapid actions
const debouncedToast = useMemo(
  () => debounce((message: string) => error(message), 1000),
  [error]
);

// ❌ Avoid - Multiple toasts for same action
const handleRapidClicks = () => {
  error("Error 1");
  error("Error 2"); // This will show multiple toasts
  error("Error 3");
};
```

## Migration from Gluestack Toast

### Before (Gluestack)

```typescript
import { showToast } from '@/libs/utils';

showToast({
  type: "success",
  message: "Profile created successfully!",
  duration: 4000,
});
```

### After (Centralized Toast)

```typescript
import { useToast } from '@/hooks/use-toast';

const { success } = useToast();
success("Profile created successfully!", { duration: 4000 });
```

### Migration Checklist

- [ ] Replace `import { showToast } from '@/libs/utils'` with `import { useToast } from '@/hooks/use-toast'`
- [ ] Add `const { success, error, warning, info } = useToast()` to component
- [ ] Replace `showToast({ type: "success", message: "..." })` with `success("...")`
- [ ] Replace `showToast({ type: "danger", message: "..." })` with `error("...")`
- [ ] Replace `showToast({ type: "warning", message: "..." })` with `warning("...")`
- [ ] Replace `showToast({ type: "info", message: "..." })` with `info("...")`

## Configuration

### Global Configuration

```typescript
// libs/toast/config.ts
export const toastConfig: ToastConfig = {
  defaultDuration: 3000,        // Default display duration
  defaultPosition: 'top',       // Default position
  maxToasts: 3,                // Maximum concurrent toasts
  enableQueue: true,           // Enable toast queuing
};
```

### Custom Themes

To add custom themes, extend the `toastThemes` object:

```typescript
export const toastThemes: Record<string, ToastTheme> = {
  // ... existing themes
  
  custom: {
    backgroundColor: '#8B5CF6',
    textColor: '#FFFFFF',
    icon: 'star',
    iconColor: '#FFFFFF',
  },
};
```

## Troubleshooting

### Common Issues

1. **Toast not showing**
   - Ensure `ToastProvider` is wrapped around your app
   - Check that `useToast` hook is called within a component

2. **Type errors**
   - Ensure TypeScript declarations are properly imported
   - Check that all toast types are properly defined

3. **Styling issues**
   - Verify theme configuration in `config.ts`
   - Check custom styling options

### Debug Mode

Enable debug logging by adding console logs to the toast manager:

```typescript
// libs/toast/manager.ts
private showToast(type: ToastType, message: string, options: ToastOptions = {}) {
  console.log(`[Toast] Showing ${type}: ${message}`, options);
  // ... rest of implementation
}
```

## Performance Considerations

- **Memory Usage**: Toast manager uses singleton pattern to minimize memory footprint
- **Rendering**: `react-native-toastify` is optimized for mobile performance
- **Queue Management**: Built-in queue prevents toast spam and memory leaks
- **Cleanup**: Automatic cleanup when components unmount

## Future Enhancements

Potential improvements for the toast system:

1. **Toast Persistence**: Save critical toasts across app restarts
2. **Custom Animations**: Add custom entrance/exit animations
3. **Toast Analytics**: Track toast interactions for UX insights
4. **Accessibility**: Enhanced screen reader support
5. **Queue Management**: Advanced queue with priority levels

## API Reference

### ToastManager Class

```typescript
class ToastManager {
  static getInstance(): ToastManager;
  success(message: string, options?: ToastOptions): void;
  error(message: string, options?: ToastOptions): void;
  warning(message: string, options?: ToastOptions): void;
  info(message: string, options?: ToastOptions): void;
  custom(type: ToastType, message: string, options?: ToastOptions): void;
  hide(): void;
}
```

### useToast Hook

```typescript
const useToast = () => {
  return {
    success: (message: string, options?: ToastOptions) => void;
    error: (message: string, options?: ToastOptions) => void;
    warning: (message: string, options?: ToastOptions) => void;
    info: (message: string, options?: ToastOptions) => void;
    custom: (type: ToastType, message: string, options?: ToastOptions) => void;
    hide: () => void;
  };
};
```

---

This documentation provides a comprehensive guide to using the centralized toast system in the Rozo App. For additional support or questions, refer to the implementation files or contact the development team.
