# Push Notification Payload Specification

Complete reference for Firebase Cloud Messaging (FCM) notification payloads in the Rozo app.

---

## Table of Contents

- [Base Payload Structure](#base-payload-structure)
- [Notification Types](#notification-types)
  - [ORDER_UPDATE](#1-order_update)
  - [PAYMENT_RECEIVED](#2-payment_received)
  - [WITHDRAWAL_COMPLETE](#3-withdrawal_complete)
  - [PAYMENT_REMINDER](#4-payment_reminder)
  - [MERCHANT_MESSAGE](#5-merchant_message)
  - [SYSTEM_ALERT](#6-system_alert)
- [Notification Actions](#notification-actions)
- [Backend Implementation](#backend-implementation)
- [Testing](#testing)

---

## Base Payload Structure

All push notifications must follow this FCM payload structure:

```typescript
{
  // FCM notification object (displays in system tray)
  "notification": {
    "title": string,           // Required: Notification title
    "body": string,            // Required: Notification body text
    "image"?: string           // Optional: Image URL for rich notifications
  },

  // Custom data payload (app-specific)
  "data": {
    // Core fields (always include)
    "type": NotificationType,              // Required
    "action": NotificationAction | "",     // Optional, empty string if null
    "timestamp": string,                   // Required: ISO 8601 format
    "deepLink": string | "",              // Optional, empty string if null

    // Context fields (use empty string if not applicable)
    "orderId": string | "",
    "transactionId": string | "",
    "depositId": string | "",
    "withdrawalId": string | "",
    "amount": string | "",                 // String to preserve decimals
    "currency": string | "",               // ISO currency code
    "status": string | "",

    // Optional metadata (JSON string)
    "metadata": string                     // JSON.stringify(object)
  },

  // Platform-specific configs
  "android": {
    "priority": "high",
    "notification": {
      "sound": "default",
      "channelId": "rozo-notifications",
      "color": "#FF6C44",
      "tag"?: string
    }
  },

  "apns": {
    "payload": {
      "aps": {
        "alert": {
          "title": string,
          "body": string
        },
        "sound": "default",
        "badge": number,
        "mutable-content": 1,
        "content-available": 1
      }
    },
    "headers": {
      "apns-priority": "10"
    }
  }
}
```

### Important Notes

1. **All `data` values MUST be strings** (FCM requirement)
2. **Use empty string `""` for null values**, don't omit fields
3. **Timestamp format**: ISO 8601 with timezone (e.g., `"2025-01-31T10:30:00Z"`)
4. **Amount format**: String without currency symbols (e.g., `"150000"` not `150000`)
5. **Metadata**: JSON object stringified (e.g., `JSON.stringify({key: "value"})`)

---

## Notification Types

### 1. ORDER_UPDATE

**Use Case:** Order status changes (new, preparing, ready, completed, cancelled)

**Sample Payload:**

```json
{
  "notification": {
    "title": "Order Update",
    "body": "Order #12345 is now ready for pickup"
  },
  "data": {
    "type": "ORDER_UPDATE",
    "action": "OPEN_ORDER",
    "timestamp": "2025-01-31T10:30:00Z",
    "deepLink": "rozo://orders/12345",
    "orderId": "12345",
    "transactionId": "",
    "depositId": "",
    "withdrawalId": "",
    "amount": "150000",
    "currency": "IDR",
    "status": "ready",
    "metadata": "{\"orderNumber\":\"ORD-2025-001\",\"customerName\":\"John Doe\",\"itemCount\":3}"
  },
  "android": {
    "priority": "high",
    "notification": {
      "sound": "default",
      "channelId": "rozo-notifications",
      "color": "#FF6C44",
      "tag": "order_12345"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "alert": {
          "title": "Order Update",
          "body": "Order #12345 is now ready for pickup"
        },
        "sound": "default",
        "badge": 1
      }
    },
    "headers": {
      "apns-priority": "10"
    }
  }
}
```

**Status Values:**
- `"pending"` - Order received
- `"preparing"` - Being prepared
- `"ready"` - Ready for pickup/delivery
- `"completed"` - Order completed
- `"cancelled"` - Order cancelled

**Recommended Action:** `"OPEN_ORDER"`

**Deep Link:** `rozo://orders/{orderId}`

**Metadata Fields:**
```typescript
{
  "orderNumber": string,      // Display order number
  "customerName": string,     // Customer name
  "itemCount": number         // Number of items
}
```

---

### 2. PAYMENT_RECEIVED

**Use Case:** Merchant receives payment from a customer

**Sample Payload:**

```json
{
  "notification": {
    "title": "Payment Received",
    "body": "You received Rp 500,000 from Order #12345"
  },
  "data": {
    "type": "PAYMENT_RECEIVED",
    "action": "OPEN_TRANSACTION",
    "timestamp": "2025-01-31T10:30:00Z",
    "deepLink": "rozo://transactions/txn_xyz789",
    "orderId": "12345",
    "transactionId": "txn_xyz789",
    "depositId": "",
    "withdrawalId": "",
    "amount": "500000",
    "currency": "IDR",
    "status": "completed",
    "metadata": "{\"paymentMethod\":\"qris\",\"newBalance\":\"1500000\",\"customerName\":\"John Doe\"}"
  },
  "android": {
    "priority": "high",
    "notification": {
      "sound": "default",
      "channelId": "rozo-notifications",
      "color": "#FF6C44"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "alert": {
          "title": "Payment Received",
          "body": "You received Rp 500,000 from Order #12345"
        },
        "sound": "default",
        "badge": 1
      }
    },
    "headers": {
      "apns-priority": "10"
    }
  }
}
```

**Status Values:**
- `"completed"` - Payment successful
- `"pending"` - Awaiting confirmation (if needed)
- `"failed"` - Payment failed

**Recommended Action:** `"OPEN_TRANSACTION"` or `"OPEN_BALANCE"`

**Deep Link:** `rozo://transactions/{transactionId}` or `rozo://balance`

**Metadata Fields:**
```typescript
{
  "paymentMethod": string,    // e.g., "qris", "bank_transfer", "ewallet"
  "newBalance": string,       // Updated balance after payment
  "customerName": string      // Name of payer
}
```

---

### 3. WITHDRAWAL_COMPLETE

**Use Case:** Merchant withdraws funds from their balance

**Sample Payload:**

```json
{
  "notification": {
    "title": "Withdrawal Processed",
    "body": "Your withdrawal of Rp 300,000 has been processed"
  },
  "data": {
    "type": "WITHDRAWAL_COMPLETE",
    "action": "OPEN_TRANSACTION",
    "timestamp": "2025-01-31T10:30:00Z",
    "deepLink": "rozo://transactions/wd_def456",
    "orderId": "",
    "transactionId": "txn_abc456",
    "depositId": "",
    "withdrawalId": "wd_def456",
    "amount": "300000",
    "currency": "IDR",
    "status": "completed",
    "metadata": "{\"withdrawalMethod\":\"bank_account\",\"bankName\":\"BCA\",\"accountNumber\":\"****1234\",\"newBalance\":\"1200000\"}"
  },
  "android": {
    "priority": "high",
    "notification": {
      "sound": "default",
      "channelId": "rozo-notifications",
      "color": "#FF6C44"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "alert": {
          "title": "Withdrawal Processed",
          "body": "Your withdrawal of Rp 300,000 has been processed"
        },
        "sound": "default",
        "badge": 1
      }
    },
    "headers": {
      "apns-priority": "10"
    }
  }
}
```

**Status Values:**
- `"completed"` - Withdrawal successful
- `"pending"` - Being processed
- `"failed"` - Withdrawal failed

**Recommended Action:** `"OPEN_TRANSACTION"` or `"OPEN_BALANCE"`

**Deep Link:** `rozo://transactions/{transactionId}` or `rozo://balance`

**Metadata Fields:**
```typescript
{
  "withdrawalMethod": string,  // e.g., "bank_account", "ewallet"
  "bankName": string,          // Bank name (if applicable)
  "accountNumber": string,     // Masked account number
  "newBalance": string         // Updated balance after withdrawal
}
```

---

### 4. PAYMENT_REMINDER

**Use Case:** Reminder for pending payments or low balance alerts

**Sample Payload:**

```json
{
  "notification": {
    "title": "Payment Reminder",
    "body": "You have a pending payment of Rp 75,000"
  },
  "data": {
    "type": "PAYMENT_REMINDER",
    "action": "OPEN_ORDER",
    "timestamp": "2025-01-31T10:30:00Z",
    "deepLink": "rozo://orders/12345",
    "orderId": "12345",
    "transactionId": "",
    "depositId": "",
    "withdrawalId": "",
    "amount": "75000",
    "currency": "IDR",
    "status": "pending",
    "metadata": "{\"dueDate\":\"2025-02-01T00:00:00Z\",\"reminderType\":\"pending_payment\"}"
  },
  "android": {
    "priority": "high",
    "notification": {
      "sound": "default",
      "channelId": "rozo-notifications",
      "color": "#FF6C44"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "alert": {
          "title": "Payment Reminder",
          "body": "You have a pending payment of Rp 75,000"
        },
        "sound": "default",
        "badge": 1
      }
    },
    "headers": {
      "apns-priority": "10"
    }
  }
}
```

**Reminder Types (in metadata):**
- `"pending_payment"` - Unpaid order
- `"low_balance"` - Balance below threshold
- `"payment_due"` - Payment deadline approaching

**Recommended Action:** `"OPEN_ORDER"` or `"OPEN_BALANCE"`

**Deep Link:** Depends on reminder type

**Metadata Fields:**
```typescript
{
  "dueDate": string,           // ISO 8601 date
  "reminderType": string       // Type of reminder
}
```

---

### 5. MERCHANT_MESSAGE

**Use Case:** Messages from admin/support to merchant

**Sample Payload:**

```json
{
  "notification": {
    "title": "Message from Rozo Support",
    "body": "Your account verification is complete. You can now accept payments!",
    "image": "https://cdn.rozo.app/notifications/welcome.jpg"
  },
  "data": {
    "type": "MERCHANT_MESSAGE",
    "action": "OPEN_SETTINGS",
    "timestamp": "2025-01-31T10:30:00Z",
    "deepLink": "rozo://settings/account",
    "orderId": "",
    "transactionId": "",
    "depositId": "",
    "withdrawalId": "",
    "amount": "",
    "currency": "",
    "status": "",
    "metadata": "{\"messageId\":\"msg_123\",\"category\":\"account\",\"priority\":\"normal\",\"actionUrl\":\"https://rozo.app/account\"}"
  },
  "android": {
    "priority": "default",
    "notification": {
      "sound": "default",
      "channelId": "rozo-notifications",
      "color": "#FF6C44"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "alert": {
          "title": "Message from Rozo Support",
          "body": "Your account verification is complete. You can now accept payments!"
        },
        "sound": "default",
        "badge": 1
      }
    },
    "headers": {
      "apns-priority": "5"
    }
  }
}
```

**Message Categories (in metadata):**
- `"account"` - Account-related messages
- `"promotion"` - Promotional messages
- `"announcement"` - General announcements
- `"support"` - Support messages

**Recommended Action:** Varies (typically `"OPEN_SETTINGS"`)

**Deep Link:** Flexible based on message content

**Metadata Fields:**
```typescript
{
  "messageId": string,         // Unique message ID
  "category": string,          // Message category
  "priority": string,          // "low" | "normal" | "high"
  "actionUrl": string          // Optional web URL
}
```

---

### 6. SYSTEM_ALERT

**Use Case:** System-wide alerts (maintenance, updates, issues)

**Sample Payload:**

```json
{
  "notification": {
    "title": "System Maintenance",
    "body": "Rozo will be under maintenance from 2 AM to 4 AM tonight"
  },
  "data": {
    "type": "SYSTEM_ALERT",
    "action": "",
    "timestamp": "2025-01-31T10:30:00Z",
    "deepLink": "",
    "orderId": "",
    "transactionId": "",
    "depositId": "",
    "withdrawalId": "",
    "amount": "",
    "currency": "",
    "status": "",
    "metadata": "{\"alertType\":\"maintenance\",\"severity\":\"info\",\"startTime\":\"2025-02-01T02:00:00Z\",\"endTime\":\"2025-02-01T04:00:00Z\"}"
  },
  "android": {
    "priority": "default",
    "notification": {
      "sound": "default",
      "channelId": "rozo-notifications",
      "color": "#FF6C44"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "alert": {
          "title": "System Maintenance",
          "body": "Rozo will be under maintenance from 2 AM to 4 AM tonight"
        },
        "sound": "default",
        "badge": 1
      }
    },
    "headers": {
      "apns-priority": "5"
    }
  }
}
```

**Alert Types (in metadata):**
- `"maintenance"` - Scheduled maintenance
- `"outage"` - Service disruption
- `"update"` - App update available
- `"security"` - Security alert

**Severity Levels (in metadata):**
- `"info"` - Informational
- `"warning"` - Warning
- `"critical"` - Critical alert

**Recommended Action:** Usually empty string (informational only)

**Deep Link:** Usually empty or `rozo://settings`

**Metadata Fields:**
```typescript
{
  "alertType": string,         // Type of alert
  "severity": string,          // Severity level
  "startTime": string,         // ISO 8601 (if applicable)
  "endTime": string            // ISO 8601 (if applicable)
}
```

---

## Notification Actions

Actions determine where the app navigates when user taps the notification.

### Action Types

| Action | Route | Description | Use Cases |
|--------|-------|-------------|-----------|
| `OPEN_ORDER` | `/(main)/orders` | Opens orders screen | ORDER_UPDATE, PAYMENT_REMINDER |
| `OPEN_TRANSACTION` | `/(main)/transactions` | Opens transactions screen | PAYMENT_RECEIVED, WITHDRAWAL_COMPLETE |
| `OPEN_SETTINGS` | `/(main)/settings` | Opens settings screen | MERCHANT_MESSAGE |
| `OPEN_BALANCE` | `/(main)/balance` | Opens balance screen | PAYMENT_RECEIVED, WITHDRAWAL_COMPLETE |
| `OPEN_POS` | `/(main)/pos` | Opens POS screen | ORDER_UPDATE (for processing) |

### Deep Link Format

Deep links use the `rozo://` scheme:

```
rozo://orders                  → Orders screen
rozo://orders/12345            → Specific order (if supported)
rozo://transactions            → Transactions screen
rozo://transactions/txn_123    → Specific transaction (if supported)
rozo://balance                 → Balance screen
rozo://settings                → Settings screen
rozo://settings/account        → Settings subsection
rozo://pos                     → POS screen
```

---

## Backend Implementation

### Example: Supabase Edge Function

```typescript
import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: Deno.env.get('FIREBASE_PROJECT_ID'),
      clientEmail: Deno.env.get('FIREBASE_CLIENT_EMAIL'),
      privateKey: Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
    }),
  });
}

// Send notification function
async function sendNotification(
  merchantId: string,
  type: string,
  notificationData: any
) {
  // 1. Get merchant's FCM tokens
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: devices, error } = await supabase
    .from('merchant_devices')
    .select('fcm_token, platform')
    .eq('merchant_id', merchantId);

  if (error || !devices || devices.length === 0) {
    console.error('No devices found for merchant:', merchantId);
    return;
  }

  // 2. Prepare FCM message
  const message = {
    notification: {
      title: notificationData.notification.title,
      body: notificationData.notification.body,
      imageUrl: notificationData.notification.image || undefined,
    },
    data: {
      // IMPORTANT: All values must be strings
      type: notificationData.data.type,
      action: notificationData.data.action || '',
      timestamp: notificationData.data.timestamp,
      deepLink: notificationData.data.deepLink || '',
      orderId: notificationData.data.orderId || '',
      transactionId: notificationData.data.transactionId || '',
      depositId: notificationData.data.depositId || '',
      withdrawalId: notificationData.data.withdrawalId || '',
      amount: notificationData.data.amount || '',
      currency: notificationData.data.currency || '',
      status: notificationData.data.status || '',
      metadata: JSON.stringify(notificationData.data.metadata || {}),
    },
    android: {
      priority: 'high' as const,
      notification: {
        sound: 'default',
        channelId: 'rozo-notifications',
        color: '#FF6C44',
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: notificationData.notification.title,
            body: notificationData.notification.body,
          },
          sound: 'default',
          badge: 1,
        },
      },
      headers: {
        'apns-priority': '10',
      },
    },
    tokens: devices.map(d => d.fcm_token),
  };

  // 3. Send via Firebase Admin SDK
  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} notifications`);

    if (response.failureCount > 0) {
      console.error('Failed to send to some devices:', response.responses);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Example usage
await sendNotification('merchant_123', 'PAYMENT_RECEIVED', {
  notification: {
    title: 'Payment Received',
    body: 'You received Rp 500,000',
  },
  data: {
    type: 'PAYMENT_RECEIVED',
    action: 'OPEN_TRANSACTION',
    timestamp: new Date().toISOString(),
    deepLink: 'rozo://transactions/txn_123',
    orderId: 'order_123',
    transactionId: 'txn_123',
    depositId: '',
    withdrawalId: '',
    amount: '500000',
    currency: 'IDR',
    status: 'completed',
    metadata: {
      paymentMethod: 'qris',
      newBalance: '1500000',
    },
  },
});
```

---

## Testing

### 1. Test via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Cloud Messaging** → **Send test message**
4. Get FCM token from app logs (see QUICKSTART.md)
5. Paste token and send

### 2. Test Payload with cURL

```bash
# Get your FCM Server Key from Firebase Console
SERVER_KEY="your-server-key"
FCM_TOKEN="merchant-fcm-token"

curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=$SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "'$FCM_TOKEN'",
    "notification": {
      "title": "Test Payment Received",
      "body": "You received Rp 100,000"
    },
    "data": {
      "type": "PAYMENT_RECEIVED",
      "action": "OPEN_TRANSACTION",
      "timestamp": "2025-01-31T10:30:00Z",
      "deepLink": "rozo://transactions/test",
      "orderId": "",
      "transactionId": "test_txn",
      "depositId": "",
      "withdrawalId": "",
      "amount": "100000",
      "currency": "IDR",
      "status": "completed",
      "metadata": "{}"
    }
  }'
```

### 3. Verify in App

Check app logs for:
```
✅ Notification system initialized successfully
📱 FCM message received (foreground): {...}
📧 Expo notification received (foreground): {...}
```

Tap notification and verify:
- Correct navigation based on action
- Deep link opens correct screen
- Data is properly parsed

---

## Validation Checklist

Before sending a notification:

- [ ] `type` is one of the 6 valid types
- [ ] `action` is one of the 5 valid actions or empty string
- [ ] `timestamp` is in ISO 8601 format with timezone
- [ ] `amount` is a string (if present)
- [ ] `deepLink` uses `rozo://` scheme (if present)
- [ ] All `data` fields are strings (FCM requirement)
- [ ] `metadata` is JSON stringified
- [ ] Required contextual fields are present (e.g., `orderId` for ORDER_UPDATE)
- [ ] Title and body are concise and clear
- [ ] Platform-specific configs included

---

## Reference

- **Notification Types**: 6 types defined in [types/index.ts](../types/index.ts)
- **Actions**: 5 actions for navigation
- **Deep Links**: `rozo://` scheme with routes
- **Backend Setup**: See [BACKEND.md](./BACKEND.md)
- **Testing Guide**: See [QUICKSTART.md](./QUICKSTART.md)

---

**Last Updated**: 2025-01-31
