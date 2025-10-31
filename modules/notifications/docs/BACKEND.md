# Backend Implementation for Push Notifications

## Overview

This document outlines the complete backend implementation for push notifications with **order flow integration**, using **Supabase Functions** and Firebase Cloud Messaging (FCM).

---

## Architecture Overview

```
┌─────────────────┐
│   Mobile App    │
│  (React Native) │
└────────┬────────┘
         │
         │ 1. Register FCM Token (per device)
         │ 2. Unregister FCM Token (on logout)
         │
         ▼
┌─────────────────────────────────────┐
│     Supabase Edge Functions         │
│        (TypeScript/Deno)            │
├─────────────────────────────────────┤
│ • devices/register                  │
│ • devices/unregister                │
└────────┬────────────────────────────┘
         │
         └──► PostgreSQL Database
              • merchant_devices (FCM tokens)
```

---

## Key Concepts

### Multi-Device Token Management

**Design Principle**: One merchant can use multiple devices simultaneously.

**How it works**:
1. Merchant logs in on Device A (iPhone) → FCM token registered via `devices/register`
2. Merchant logs in on Device B (iPad) → FCM token registered via `devices/register`
3. Both devices are now registered and ready to receive notifications
4. When merchant logs out from Device A → Token removed via `devices/unregister`
5. Device B continues to receive notifications

**Implementation**:
- `merchant_devices` table has **multiple rows** per `merchant_id`
- `UNIQUE(device_id, merchant_id)` prevents duplicate tokens from same device
- Tokens are persisted until explicitly removed (logout) or become invalid

### Automatic Registration

Token registration/unregistration is **fully automatic**:

- User logs in → `NotificationProvider` detects auth change → Calls `registerDeviceToken()`
- User logs out → `NotificationProvider` detects auth change → Calls `unregisterDeviceToken()`
- No manual intervention needed in your app code

---

## 1. Database Schema

### Table: `merchant_devices`

Stores FCM tokens for each merchant's device. **One merchant can have multiple devices.**

```sql
CREATE TABLE merchant_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(merchant_id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,           -- Unique device identifier
  fcm_token TEXT NOT NULL,           -- Firebase Cloud Messaging token
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_name TEXT,                  -- e.g., "iPhone 14 Pro"
  app_version TEXT,                  -- e.g., "1.0.5"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),

  -- One device can only be registered once per merchant
  UNIQUE(device_id, merchant_id)
);

-- Indexes
CREATE INDEX idx_merchant_devices_merchant_id ON merchant_devices(merchant_id);
CREATE INDEX idx_merchant_devices_last_active ON merchant_devices(last_active_at);
```

**Example Data**:
```
| merchant_id | device_id  | fcm_token | platform | device_name    |
|-------------|------------|-----------|----------|----------------|
| merchant-1  | device-abc | token-123 | ios      | iPhone 14 Pro  |
| merchant-1  | device-xyz | token-456 | android  | Pixel 7        |
| merchant-2  | device-def | token-789 | ios      | iPad Air       |
```

---

## 2. Supabase Edge Functions

### Function 1: `devices/register`

**Endpoint**: `POST /functions/v1/devices/register`

**Purpose**: Register a device's FCM token for a merchant.

**Request Body**:
```json
{
  "device_id": "unique-device-id",
  "fcm_token": "firebase-token-here",
  "platform": "ios",
  "device_name": "iPhone 14 Pro",
  "app_version": "1.0.5"
}
```

**Implementation**:
```typescript
// supabase/functions/devices/register/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { device_id, fcm_token, platform, device_name, app_version } = await req.json()

    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Get merchant_id from user
    const merchant_id = user.id

    // Upsert device token (updates if exists, inserts if new)
    const { data, error } = await supabase
      .from('merchant_devices')
      .upsert({
        merchant_id,
        device_id,
        fcm_token,
        platform,
        device_name,
        app_version,
        updated_at: new Date().toISOString(),
        last_active_at: new Date().toISOString()
      }, {
        onConflict: 'device_id,merchant_id'
      })
      .select()
      .single()

    if (error) throw error

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
```

---

### Function 2: `devices/unregister`

**Endpoint**: `DELETE /functions/v1/devices/unregister`

**Purpose**: Remove device token when user logs out.

**Request Body**:
```json
{
  "device_id": "unique-device-id"
}
```

**Implementation**:
```typescript
// supabase/functions/devices/unregister/index.ts
serve(async (req) => {
  try {
    const { device_id } = await req.json()

    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const merchant_id = user.id

    // Delete device
    const { error } = await supabase
      .from('merchant_devices')
      .delete()
      .match({ merchant_id, device_id })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
```

---

## 3. Environment Variables

**Supabase Dashboard → Project Settings → Edge Functions → Secrets**

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 4. Deployment

### Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy devices/register
supabase functions deploy devices/unregister
```

### Run Database Migrations

```bash
# Create migration file
supabase migration new notification_system

# Add SQL from this document to the migration file

# Apply migration
supabase db push
```

---

## 5. Testing

### Test Device Registration

```bash
curl -X POST https://your-project.supabase.co/functions/v1/devices/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device-123",
    "fcm_token": "your-fcm-token",
    "platform": "ios",
    "device_name": "iPhone Test",
    "app_version": "1.0.0"
  }'
```

### Test Device Unregistration

```bash
curl -X DELETE https://your-project.supabase.co/functions/v1/devices/unregister \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test-device-123"
  }'
```

### Test Multi-Device Scenario

1. Register 2 devices for same merchant
2. Verify both devices appear in database

```sql
-- Check registered devices
SELECT device_id, device_name, platform, created_at
FROM merchant_devices
WHERE merchant_id = 'your-merchant-id';
```

---

## 6. Monitoring & Maintenance

### View Registered Devices

```sql
-- All devices for a merchant
SELECT
  device_id,
  device_name,
  platform,
  app_version,
  created_at,
  last_active_at
FROM merchant_devices
WHERE merchant_id = 'merchant-uuid'
ORDER BY last_active_at DESC;
```

### Clean Up Inactive Devices

```sql
-- Remove devices not active in 90 days
DELETE FROM merchant_devices
WHERE last_active_at < NOW() - INTERVAL '90 days';
```

### Monitor Active Merchants

```sql
-- Count devices per merchant
SELECT
  m.merchant_id,
  COUNT(md.id) as device_count,
  MAX(md.last_active_at) as last_device_activity
FROM merchants m
LEFT JOIN merchant_devices md ON m.merchant_id = md.merchant_id
GROUP BY m.merchant_id
ORDER BY device_count DESC;
```

---

## 7. Security & Best Practices

### Row Level Security (RLS)

```sql
-- Enable RLS on merchant_devices table
ALTER TABLE merchant_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Merchants can only see their own devices
CREATE POLICY "Merchants can view own devices"
ON merchant_devices FOR SELECT
USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can insert own devices"
ON merchant_devices FOR INSERT
WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Merchants can update own devices"
ON merchant_devices FOR UPDATE
USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can delete own devices"
ON merchant_devices FOR DELETE
USING (merchant_id = auth.uid());
```

### Token Security

1. **Never log FCM tokens** in plain text
2. **Rotate tokens** on app update or re-login
3. **Clean up stale tokens** regularly (90-day cleanup recommended)
4. **Use HTTPS** for all API calls
5. **Validate JWT tokens** in Edge Functions

---

## Summary

This backend implementation provides:

- **Multi-device support** - One merchant can register multiple devices
- **Device management** - Register and unregister FCM tokens
- **Secure architecture** - RLS policies protect merchant data
- **Simple setup** - No configuration needed, notifications always enabled
- **Easy testing** - Complete test procedures for all endpoints

**Next Steps**:

1. Deploy edge functions to Supabase
2. Run database migrations
3. Configure EXPO_PUBLIC_API_URL to point to Supabase
4. Mobile app integration is already implemented (see INTEGRATION.md)
