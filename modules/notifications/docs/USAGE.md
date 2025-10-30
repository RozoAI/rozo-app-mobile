# Push Notifications - Usage Guide

Complete guide for using the notification module in your React Native app.

---

## Table of Contents

- [Basic Usage](#basic-usage)
- [Permission Management](#permission-management)
- [Handling Notifications](#handling-notifications)
- [FCM Token Management](#fcm-token-management)
- [Settings UI](#settings-ui)
- [Advanced Usage](#advanced-usage)

---

## Basic Usage

### Import the Hook

```typescript
import { useNotifications } from '@/modules/notifications';
```

### Access Notification State

```typescript
function MyComponent() {
  const {
    notifications,      // Array of received notifications
    unreadCount,        // Number of unread notifications
    permissionStatus,   // 'granted' | 'denied' | 'undetermined'
    fcmToken,          // Firebase Cloud Messaging token
    isTokenRegistered, // Whether token is registered with backend
  } = useNotifications();

  return (
    <View>
      <Text>Unread: {unreadCount}</Text>
      <Text>Permission: {permissionStatus}</Text>
    </View>
  );
}
```

---

## Permission Management

### Request Notification Permission

```typescript
import { useNotifications } from '@/modules/notifications';

function PermissionScreen() {
  const { permissionStatus, requestPermission } = useNotifications();

  const handleEnable = async () => {
    const granted = await requestPermission();

    if (granted) {
      console.log('✅ Notifications enabled');
    } else {
      console.log('❌ Permission denied');
    }
  };

  if (permissionStatus === 'granted') {
    return <Text>Notifications enabled ✓</Text>;
  }

  return (
    <Button onPress={handleEnable}>
      Enable Notifications
    </Button>
  );
}
```

### Use Permission Hook

```typescript
import { useNotificationPermissions } from '@/modules/notifications';

function PermissionFlow() {
  const {
    permissionStatus,
    isGranted,
    isDenied,
    isUndetermined,
    requestPermission,
    openSettings,
  } = useNotificationPermissions();

  // User hasn't been asked yet
  if (isUndetermined) {
    return (
      <Button onPress={requestPermission}>
        Enable Notifications
      </Button>
    );
  }

  // User denied permission
  if (isDenied) {
    return (
      <View>
        <Text>Notifications are disabled</Text>
        <Button onPress={openSettings}>
          Open Settings
        </Button>
      </View>
    );
  }

  // Permission granted
  return <Text>Notifications enabled ✓</Text>;
}
```

---

## Handling Notifications

### Listen for Incoming Notifications

```typescript
import { useNotifications } from '@/modules/notifications';
import { useEffect } from 'react';

function NotificationListener() {
  const { onNotificationReceived, onNotificationTapped } = useNotifications();

  useEffect(() => {
    // Subscribe to received notifications
    const unsubscribe = onNotificationReceived((notification) => {
      console.log('New notification:', notification);

      // Show toast
      toast.show({
        title: notification.title,
        description: notification.body,
      });

      // Play sound, vibrate, etc.
    });

    return unsubscribe; // Cleanup on unmount
  }, []);

  return null; // This is a listener component
}
```

### Handle Notification Taps

```typescript
import { useNotifications } from '@/modules/notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

function NotificationNavigator() {
  const { onNotificationTapped } = useNotifications();

  useEffect(() => {
    const unsubscribe = onNotificationTapped((notification) => {
      const { type, orderId, deepLink } = notification.data;

      // Navigate based on notification type
      if (deepLink) {
        router.push(deepLink);
      } else if (type === 'ORDER_UPDATE' && orderId) {
        router.push(`/(main)/orders`);
      } else if (type === 'DEPOSIT_COMPLETE') {
        router.push(`/(main)/transactions`);
      }
    });

    return unsubscribe;
  }, []);

  return null;
}
```

### Mark Notifications as Read

```typescript
function NotificationList() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  return (
    <View>
      <Button onPress={markAllAsRead}>
        Mark All as Read
      </Button>

      {notifications.map((notif) => (
        <TouchableOpacity
          key={notif.id}
          onPress={() => markAsRead(notif.id)}
        >
          <View style={{ opacity: notif.isRead ? 0.5 : 1 }}>
            <Text>{notif.title}</Text>
            <Text>{notif.body}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### Clear Notifications

```typescript
function NotificationManager() {
  const {
    notifications,
    clearNotification,
    clearAll,
  } = useNotifications();

  return (
    <View>
      <Button onPress={clearAll}>
        Clear All
      </Button>

      {notifications.map((notif) => (
        <View key={notif.id}>
          <Text>{notif.title}</Text>
          <Button onPress={() => clearNotification(notif.id)}>
            Delete
          </Button>
        </View>
      ))}
    </View>
  );
}
```

---

## FCM Token Management

### Get FCM Token

```typescript
import { useFCMToken } from '@/modules/notifications';

function TokenDisplay() {
  const { token, isLoading, isRegistered } = useFCMToken();

  if (isLoading) {
    return <Text>Loading token...</Text>;
  }

  return (
    <View>
      <Text>Token: {token}</Text>
      <Text>Registered: {isRegistered ? '✅' : '❌'}</Text>
    </View>
  );
}
```

### Manual Token Registration

```typescript
function TokenManager() {
  const { registerToken, unregisterToken } = useFCMToken();
  const { user } = useAuth();

  const handleRegister = async () => {
    await registerToken(user?.id);
    console.log('Token registered with backend');
  };

  const handleUnregister = async () => {
    await unregisterToken();
    console.log('Token removed from backend');
  };

  return (
    <View>
      <Button onPress={handleRegister}>Register Token</Button>
      <Button onPress={handleUnregister}>Unregister Token</Button>
    </View>
  );
}
```

**Note**: Token registration/unregistration happens automatically on login/logout. Manual registration is usually not needed.

### Refresh Token

```typescript
function TokenRefresh() {
  const { refreshToken } = useFCMToken();

  const handleRefresh = async () => {
    const newToken = await refreshToken();
    console.log('New token:', newToken);
  };

  return (
    <Button onPress={handleRefresh}>
      Refresh Token
    </Button>
  );
}
```

---

## Settings UI

### Use Built-in Settings Component

```typescript
import { NotificationSettingsSheet } from '@/features/settings/notification-settings-sheet';
import { Actionsheet } from '@/components/ui/actionsheet';

function SettingsScreen() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <Button onPress={() => setIsOpen(true)}>
        Notification Settings
      </Button>

      <Actionsheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <NotificationSettingsSheet onClose={() => setIsOpen(false)} />
      </Actionsheet>
    </View>
  );
}
```

### Custom Settings Implementation

```typescript
import { useGetNotificationSettings, useUpdateNotificationSettings } from '@/modules/api/api';

function CustomSettings() {
  const { data: settings, isLoading } = useGetNotificationSettings();
  const updateMutation = useUpdateNotificationSettings();

  const handleToggle = async (key: string, value: boolean) => {
    await updateMutation.mutateAsync({ [key]: value });
  };

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <View>
      <Switch
        value={settings?.orderUpdates}
        onValueChange={(value) => handleToggle('orderUpdates', value)}
      />
      <Text>Order Updates</Text>

      <Switch
        value={settings?.paymentAlerts}
        onValueChange={(value) => handleToggle('paymentAlerts', value)}
      />
      <Text>Payment Alerts</Text>
    </View>
  );
}
```

---

## Advanced Usage

### Custom Notification Handler

```typescript
import { handlerRegistry } from '@/modules/notifications/services/handler.service';

// Register custom handler
function MyComponent() {
  useEffect(() => {
    const unsubscribe = handlerRegistry.onReceived((notification) => {
      // Custom logic
      if (notification.data.type === 'ORDER_UPDATE') {
        // Refresh orders
        queryClient.invalidateQueries(['orders']);
      }
    });

    return unsubscribe;
  }, []);
}
```

### Send Test Notification (Development)

```typescript
import { useSendTestNotification } from '@/modules/api/api';

function DevTools() {
  const sendTest = useSendTestNotification();

  const handleTest = async () => {
    await sendTest.mutateAsync({
      type: 'ORDER_UPDATE',
      data: { orderId: '12345' },
    });
  };

  return (
    <Button onPress={handleTest}>
      Send Test Notification
    </Button>
  );
}
```

### Badge Count (iOS)

```typescript
import { setBadgeCount, clearBadgeCount } from '@/modules/notifications/services/firebase.service';

function BadgeManager() {
  const { unreadCount } = useNotifications();

  useEffect(() => {
    // Update badge when unread count changes
    setBadgeCount(unreadCount);
  }, [unreadCount]);

  const handleClear = () => {
    clearBadgeCount();
  };

  return <Button onPress={handleClear}>Clear Badge</Button>;
}
```

### Platform-Specific Behavior

```typescript
import { Platform } from 'react-native';

function PlatformNotifications() {
  const { permissionStatus } = useNotifications();

  if (Platform.OS === 'ios') {
    // iOS-specific behavior
    return <Text>iOS notifications enabled</Text>;
  }

  if (Platform.OS === 'android') {
    // Android-specific behavior
    return <Text>Android notifications enabled</Text>;
  }

  return null;
}
```

---

## Complete Example

Here's a complete example combining multiple features:

```typescript
import { useNotifications } from '@/modules/notifications';
import { useEffect } from 'react';
import { router } from 'expo-router';

function NotificationManager() {
  const {
    notifications,
    unreadCount,
    permissionStatus,
    requestPermission,
    markAsRead,
    markAllAsRead,
    onNotificationReceived,
    onNotificationTapped,
  } = useNotifications();

  // Request permission on mount
  useEffect(() => {
    if (permissionStatus === 'undetermined') {
      requestPermission();
    }
  }, [permissionStatus]);

  // Listen for notifications
  useEffect(() => {
    const unsubscribeReceived = onNotificationReceived((notification) => {
      console.log('📬 New notification:', notification.title);

      // Show toast
      toast.show({
        title: notification.title,
        description: notification.body,
      });
    });

    const unsubscribeTapped = onNotificationTapped((notification) => {
      console.log('👆 Notification tapped:', notification.id);

      // Navigate based on type
      const { type, orderId, deepLink } = notification.data;

      if (deepLink) {
        router.push(deepLink);
      } else if (type === 'ORDER_UPDATE') {
        router.push('/(main)/orders');
      }

      // Mark as read
      markAsRead(notification.id);
    });

    return () => {
      unsubscribeReceived();
      unsubscribeTapped();
    };
  }, []);

  return (
    <View>
      {/* Header */}
      <View>
        <Text>Notifications ({unreadCount} unread)</Text>
        {unreadCount > 0 && (
          <Button onPress={markAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </View>

      {/* Notification List */}
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => markAsRead(item.id)}>
            <View opacity={item.isRead ? 0.5 : 1}>
              <Text fontWeight={item.isRead ? 'normal' : 'bold'}>
                {item.title}
              </Text>
              <Text>{item.body}</Text>
              <Text fontSize="xs">{getTimeAgo(item.timestamp)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
```

---

## Best Practices

### 1. Permission Timing
✅ Request permission at appropriate time (after user understands value)
❌ Don't request on app launch immediately

### 2. Handler Cleanup
✅ Always return unsubscribe function from useEffect
❌ Don't forget to cleanup listeners

### 3. Token Management
✅ Let the system handle automatic registration/unregistration
❌ Don't manually register/unregister unless needed

### 4. Error Handling
✅ Handle permission denials gracefully
✅ Guide users to settings if needed
❌ Don't spam permission requests

### 5. User Experience
✅ Show unread badge count
✅ Clear notifications when viewed
✅ Deep link to relevant content
❌ Don't show notifications for every minor event

---

## Common Patterns

### Pattern 1: Onboarding Permission Request

```typescript
function OnboardingScreen() {
  const { requestPermission } = useNotifications();
  const [step, setStep] = useState(1);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      setStep(step + 1); // Move to next onboarding step
    }
  };

  return (
    <View>
      <Text>Get notified about your orders</Text>
      <Button onPress={handleEnableNotifications}>
        Enable Notifications
      </Button>
      <Button variant="link" onPress={() => setStep(step + 1)}>
        Skip
      </Button>
    </View>
  );
}
```

### Pattern 2: Notification Center

```typescript
function NotificationCenter() {
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotifications();

  return (
    <Screen>
      <Header>
        <Text>Notifications</Text>
        <Badge>{unreadCount}</Badge>
      </Header>

      <Actions>
        <Button onPress={markAllAsRead}>Mark All Read</Button>
        <Button onPress={clearAll}>Clear All</Button>
      </Actions>

      <NotificationList data={notifications} />
    </Screen>
  );
}
```

### Pattern 3: In-App Notification Banner

```typescript
function InAppNotificationBanner() {
  const { onNotificationReceived } = useNotifications();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    return onNotificationReceived((notification) => {
      setCurrent(notification);
      setVisible(true);

      // Auto-hide after 3 seconds
      setTimeout(() => setVisible(false), 3000);
    });
  }, []);

  if (!visible || !current) return null;

  return (
    <View position="absolute" top={0} left={0} right={0}>
      <TouchableOpacity onPress={() => handleTap(current)}>
        <View bg="primary" p="4">
          <Text color="white" fontWeight="bold">
            {current.title}
          </Text>
          <Text color="white">{current.body}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
```

---

## Next Steps

- Review **[API.md](API.md)** for complete API reference
- Check **[FAQ.md](FAQ.md)** for common questions
- See **[BACKEND.md](BACKEND.md)** for backend implementation

---

**Need help?** Check the [FAQ](FAQ.md) or open an issue on GitHub.
