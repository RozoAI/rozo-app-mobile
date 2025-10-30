# Backend Requirements for Push Notifications

## Overview

This document outlines the backend requirements for implementing push notification support using **Supabase Functions** and Firebase Cloud Messaging (FCM).

---

## Architecture Overview

```
┌─────────────────┐
│   Mobile App    │
│  (React Native) │
└────────┬────────┘
         │
         │ 1. Register FCM Token
         │ 2. Unregister Token
         │ 3. Update Settings
         │
         ▼
┌─────────────────────────────┐
│   Supabase Edge Functions   │
│  (TypeScript/Deno)          │
└────────┬────────────────────┘
         │
         ├──► Database (Store tokens & settings)
         │
         └──► Firebase Admin SDK (Send notifications)
```

---

## 1. Database Schema

### Table: `merchant_devices`

Stores FCM tokens for each merchant's device.

```sql
CREATE TABLE merchant_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  fcm_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_name TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one token per device
  UNIQUE(device_id, merchant_id),

  -- Index for fast token lookup
  INDEX idx_merchant_devices_merchant_id ON merchant_devices(merchant_id),
  INDEX idx_merchant_devices_fcm_token ON merchant_devices(fcm_token)
);

-- RLS Policies
ALTER TABLE merchant_devices ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own devices
CREATE POLICY "Users can insert their own devices"
  ON merchant_devices FOR INSERT
  WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Users can view their own devices"
  ON merchant_devices FOR SELECT
  USING (auth.uid() = merchant_id);

CREATE POLICY "Users can update their own devices"
  ON merchant_devices FOR UPDATE
  USING (auth.uid() = merchant_id);

CREATE POLICY "Users can delete their own devices"
  ON merchant_devices FOR DELETE
  USING (auth.uid() = merchant_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_merchant_devices_updated_at
  BEFORE UPDATE ON merchant_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Table: `notification_settings`

Stores notification preferences for each merchant.

```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  payment_alerts BOOLEAN DEFAULT true,
  deposit_withdrawals BOOLEAN DEFAULT true,
  merchant_messages BOOLEAN DEFAULT true,
  system_alerts BOOLEAN DEFAULT true,
  sound BOOLEAN DEFAULT true,
  vibration BOOLEAN DEFAULT true,
  badge BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One settings record per merchant
  UNIQUE(merchant_id)
);

-- RLS Policies
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = merchant_id);

CREATE POLICY "Users can insert their own settings"
  ON notification_settings FOR INSERT
  WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Users can update their own settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = merchant_id);

-- Update timestamp trigger
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Table: `notification_logs` (Optional)

Track sent notifications for debugging and analytics.

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  data JSONB,
  fcm_token TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'delivered')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,

  INDEX idx_notification_logs_merchant_id ON notification_logs(merchant_id),
  INDEX idx_notification_logs_sent_at ON notification_logs(sent_at)
);

-- RLS: Only admins can view logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
```

---

## 2. Supabase Edge Functions

### Function 1: `register-device`

**Purpose**: Register a device's FCM token

**Endpoint**: `POST /functions/v1/register-device`

**Request Body**:
```typescript
{
  token: string;           // FCM token from Firebase
  deviceId: string;        // Unique device identifier
  platform: 'ios' | 'android';
  deviceName?: string;     // e.g., "iPhone 14 Pro"
  appVersion?: string;     // e.g., "1.0.5"
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
  deviceId: string;
}
```

**Implementation** (`supabase/functions/register-device/index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Get auth token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client with user JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { token, deviceId, platform, deviceName, appVersion } = await req.json();

    // Validate input
    if (!token || !deviceId || !platform) {
      throw new Error('Missing required fields: token, deviceId, platform');
    }

    if (!['ios', 'android'].includes(platform)) {
      throw new Error('Invalid platform. Must be ios or android');
    }

    // Upsert device record
    const { data, error } = await supabaseClient
      .from('merchant_devices')
      .upsert(
        {
          merchant_id: user.id,
          device_id: deviceId,
          fcm_token: token,
          platform,
          device_name: deviceName,
          app_version: appVersion,
          last_active_at: new Date().toISOString(),
        },
        {
          onConflict: 'device_id,merchant_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('Device registered:', { merchantId: user.id, deviceId, platform });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Device registered successfully',
        deviceId: data.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error registering device:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

### Function 2: `unregister-device`

**Purpose**: Remove a device's FCM token (on logout)

**Endpoint**: `DELETE /functions/v1/unregister-device`

**Request Body**:
```typescript
{
  deviceId: string;
  token: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

**Implementation** (`supabase/functions/unregister-device/index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { deviceId, token } = await req.json();

    if (!deviceId) {
      throw new Error('Missing required field: deviceId');
    }

    // Delete device record
    const { error } = await supabaseClient
      .from('merchant_devices')
      .delete()
      .eq('merchant_id', user.id)
      .eq('device_id', deviceId);

    if (error) {
      throw error;
    }

    console.log('Device unregistered:', { merchantId: user.id, deviceId });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Device unregistered successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error unregistering device:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

### Function 3: `get-notification-settings`

**Purpose**: Get user's notification preferences

**Endpoint**: `GET /functions/v1/notification-settings`

**Response**:
```typescript
{
  enabled: boolean;
  orderUpdates: boolean;
  paymentAlerts: boolean;
  depositWithdrawals: boolean;
  merchantMessages: boolean;
  systemAlerts: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
}
```

**Implementation** (`supabase/functions/notification-settings/index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // GET request - fetch settings
    if (req.method === 'GET') {
      let { data, error } = await supabaseClient
        .from('notification_settings')
        .select('*')
        .eq('merchant_id', user.id)
        .single();

      // Create default settings if not exist
      if (!data) {
        const { data: newSettings, error: insertError } = await supabaseClient
          .from('notification_settings')
          .insert({
            merchant_id: user.id,
            enabled: true,
            order_updates: true,
            payment_alerts: true,
            deposit_withdrawals: true,
            merchant_messages: true,
            system_alerts: true,
            sound: true,
            vibration: true,
            badge: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newSettings;
      }

      // Convert snake_case to camelCase
      const settings = {
        enabled: data.enabled,
        orderUpdates: data.order_updates,
        paymentAlerts: data.payment_alerts,
        depositWithdrawals: data.deposit_withdrawals,
        merchantMessages: data.merchant_messages,
        systemAlerts: data.system_alerts,
        sound: data.sound,
        vibration: data.vibration,
        badge: data.badge,
      };

      return new Response(JSON.stringify(settings), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // PATCH request - update settings
    if (req.method === 'PATCH') {
      const updates = await req.json();

      // Convert camelCase to snake_case
      const dbUpdates: any = {};
      if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;
      if (updates.orderUpdates !== undefined) dbUpdates.order_updates = updates.orderUpdates;
      if (updates.paymentAlerts !== undefined) dbUpdates.payment_alerts = updates.paymentAlerts;
      if (updates.depositWithdrawals !== undefined)
        dbUpdates.deposit_withdrawals = updates.depositWithdrawals;
      if (updates.merchantMessages !== undefined)
        dbUpdates.merchant_messages = updates.merchantMessages;
      if (updates.systemAlerts !== undefined) dbUpdates.system_alerts = updates.systemAlerts;
      if (updates.sound !== undefined) dbUpdates.sound = updates.sound;
      if (updates.vibration !== undefined) dbUpdates.vibration = updates.vibration;
      if (updates.badge !== undefined) dbUpdates.badge = updates.badge;

      const { data, error } = await supabaseClient
        .from('notification_settings')
        .update(dbUpdates)
        .eq('merchant_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Settings updated successfully',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    throw new Error('Method not allowed');
  } catch (error) {
    console.error('Error in notification settings:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
};
```

---

### Function 4: `send-notification` (Backend trigger)

**Purpose**: Send notification to merchant(s) via FCM

**Endpoint**: `POST /functions/v1/send-notification` (internal/admin only)

**Request Body**:
```typescript
{
  merchantId: string;           // Target merchant (or array for multiple)
  notificationType: 'ORDER_UPDATE' | 'DEPOSIT_COMPLETE' | 'WITHDRAWAL_COMPLETE' | 'PAYMENT_REMINDER' | 'MERCHANT_MESSAGE' | 'SYSTEM_ALERT';
  title: string;
  body: string;
  imageUrl?: string;
  data: {
    orderId?: string;
    transactionId?: string;
    depositId?: string;
    amount?: string;
    currency?: string;
    status?: string;
    deepLink?: string;
    action?: string;
    [key: string]: any;
  };
}
```

**Implementation** (`supabase/functions/send-notification/index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as admin from 'npm:firebase-admin@^12.0.0';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: Deno.env.get('FIREBASE_PROJECT_ID'),
      clientEmail: Deno.env.get('FIREBASE_CLIENT_EMAIL'),
      privateKey: Deno.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
    }),
  });
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Verify service role key (internal call only)
    const apiKey = req.headers.get('apikey');
    if (apiKey !== Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      throw new Error('Unauthorized - service role key required');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { merchantId, notificationType, title, body, imageUrl, data } = await req.json();

    if (!merchantId || !notificationType || !title || !body) {
      throw new Error('Missing required fields');
    }

    // Get merchant's devices
    const { data: devices, error: devicesError } = await supabaseAdmin
      .from('merchant_devices')
      .select('fcm_token, platform')
      .eq('merchant_id', merchantId);

    if (devicesError) throw devicesError;

    if (!devices || devices.length === 0) {
      console.log('No devices found for merchant:', merchantId);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No devices to send to',
          sent: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Check notification settings
    const { data: settings } = await supabaseAdmin
      .from('notification_settings')
      .select('*')
      .eq('merchant_id', merchantId)
      .single();

    // Check if notification type is enabled
    if (settings) {
      const typeMap = {
        ORDER_UPDATE: settings.order_updates,
        PAYMENT_REMINDER: settings.payment_alerts,
        DEPOSIT_COMPLETE: settings.deposit_withdrawals,
        WITHDRAWAL_COMPLETE: settings.deposit_withdrawals,
        MERCHANT_MESSAGE: settings.merchant_messages,
        SYSTEM_ALERT: settings.system_alerts,
      };

      if (!settings.enabled || !typeMap[notificationType]) {
        console.log('Notifications disabled for type:', notificationType);
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Notifications disabled for this type',
            sent: 0,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    // Send to all devices
    const tokens = devices.map((d) => d.fcm_token);
    const message = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: {
        type: notificationType,
        timestamp: new Date().toISOString(),
        ...data,
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log('Notification sent:', {
      merchantId,
      type: notificationType,
      success: response.successCount,
      failed: response.failureCount,
    });

    // Log notification (optional)
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const result = response.responses[i];

      await supabaseAdmin.from('notification_logs').insert({
        merchant_id: merchantId,
        notification_type: notificationType,
        title,
        body,
        data,
        fcm_token: token,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error?.message,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent',
        sent: response.successCount,
        failed: response.failureCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending notification:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

## 3. Database Triggers (Auto-send notifications)

### Trigger: Send notification on order status change

```sql
CREATE OR REPLACE FUNCTION notify_order_update()
RETURNS TRIGGER AS $$
DECLARE
  order_status TEXT;
BEGIN
  -- Only send notification if status changed
  IF NEW.status != OLD.status THEN
    order_status := NEW.status;

    -- Call Edge Function to send notification
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'merchantId', NEW.merchant_id,
        'notificationType', 'ORDER_UPDATE',
        'title', 'Order Update',
        'body', 'Your order #' || substring(NEW.id::text, 1, 8) || ' is ' || order_status,
        'data', jsonb_build_object(
          'orderId', NEW.id,
          'status', order_status,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'deepLink', 'rozo://orders/' || NEW.id,
          'action', 'OPEN_ORDER'
        )
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_changed
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_update();
```

### Trigger: Send notification on deposit complete

```sql
CREATE OR REPLACE FUNCTION notify_deposit_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send notification when status becomes 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'merchantId', NEW.merchant_id,
        'notificationType', 'DEPOSIT_COMPLETE',
        'title', 'Deposit Complete',
        'body', 'Your deposit of ' || NEW.amount || ' ' || NEW.currency || ' is complete',
        'data', jsonb_build_object(
          'depositId', NEW.id,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'deepLink', 'rozo://transactions',
          'action', 'OPEN_TRANSACTION'
        )
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deposit_completed
  AFTER UPDATE ON deposits
  FOR EACH ROW
  EXECUTE FUNCTION notify_deposit_complete();
```

---

## 4. Environment Variables

Add to Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Supabase (auto-provided)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Get Firebase Service Account**:
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Extract: `project_id`, `client_email`, `private_key`

---

## 5. Testing

### Test Device Registration

```bash
curl -X POST https://your-project.supabase.co/functions/v1/register-device \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "fcm_token_here",
    "deviceId": "device_123",
    "platform": "ios",
    "deviceName": "iPhone 14",
    "appVersion": "1.0.5"
  }'
```

### Test Send Notification

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-notification \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "user_uuid",
    "notificationType": "ORDER_UPDATE",
    "title": "Test Notification",
    "body": "This is a test",
    "data": {
      "orderId": "12345"
    }
  }'
```

---

## 6. Deployment Checklist

### Database Setup
- [ ] Run migration to create `merchant_devices` table
- [ ] Run migration to create `notification_settings` table
- [ ] Run migration to create `notification_logs` table (optional)
- [ ] Set up RLS policies
- [ ] Create database triggers for auto-notifications

### Edge Functions
- [ ] Deploy `register-device` function
- [ ] Deploy `unregister-device` function
- [ ] Deploy `notification-settings` function
- [ ] Deploy `send-notification` function
- [ ] Set environment variables in Supabase Dashboard

### Firebase Setup
- [ ] Generate Firebase Admin SDK service account
- [ ] Add service account credentials to Supabase secrets
- [ ] Test FCM sending with service account

### Testing
- [ ] Test device registration
- [ ] Test device unregistration
- [ ] Test settings CRUD
- [ ] Test manual notification sending
- [ ] Test auto-notifications (triggers)
- [ ] Test on iOS physical device
- [ ] Test on Android physical device

---

## 7. API Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/functions/v1/register-device` | POST | User JWT | Register FCM token |
| `/functions/v1/unregister-device` | DELETE | User JWT | Remove FCM token |
| `/functions/v1/notification-settings` | GET | User JWT | Get preferences |
| `/functions/v1/notification-settings` | PATCH | User JWT | Update preferences |
| `/functions/v1/send-notification` | POST | Service Role | Send notification (internal) |

---

## 8. Next Steps

1. **Create Supabase migrations** for tables
2. **Deploy Edge Functions** using Supabase CLI
3. **Configure environment variables** in Supabase Dashboard
4. **Test endpoints** with curl or Postman
5. **Integrate with mobile app** (already configured)
6. **Monitor logs** in Supabase Dashboard

---

## 9. Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Supabase Database Triggers](https://supabase.com/docs/guides/database/postgres/triggers)
- [FCM Send Messages](https://firebase.google.com/docs/cloud-messaging/send-message)

---

**Created**: 2024-01-20
**Backend**: Supabase Functions + PostgreSQL
**Status**: Ready for implementation
