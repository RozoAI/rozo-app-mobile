# Route Protection - Quick Examples

Quick reference guide for common route protection scenarios.

---

## 🚀 Quick Start

### Single Route Protection

```typescript
const rules: RouteProtectionRule[] = [
  {
    paths: "/pos",
    condition: () => showPOS,
    redirectTo: "/balance",
  },
];
useRouteProtection(rules);
```

---

## 📚 Common Scenarios

### 1. Multiple Paths, Same Rule

Protect multiple path variations with one rule:

```typescript
{
  paths: ["/(main)/pos", "/pos", "/point-of-sale"],
  condition: () => showPOS,
  redirectTo: "/(main)/balance",
  reason: "POS feature is disabled",
}
```

---

### 2. Multiple Features

Different features, different conditions:

```typescript
const rules: RouteProtectionRule[] = [
  // POS Feature
  {
    paths: "/pos",
    condition: () => showPOS,
    redirectTo: "/balance",
  },
  // Admin Panel
  {
    paths: "/admin",
    condition: () => isAdmin,
    redirectTo: "/",
  },
  // Premium Features
  {
    paths: "/premium",
    condition: () => isPremium,
    redirectTo: "/upgrade",
  },
];
```

---

### 3. With Analytics

Track blocked access attempts:

```typescript
{
  paths: "/pos",
  condition: () => showPOS,
  redirectTo: "/balance",
  onProtected: (path) => {
    analytics.track("pos_access_blocked", { from: path });
    showToast({ message: "Enable POS in settings" });
  },
}
```

---

### 4. Authentication Required

```typescript
{
  paths: ["/profile", "/orders", "/settings"],
  condition: () => isAuthenticated,
  redirectTo: "/login",
  reason: "Authentication required",
}
```

---

### 5. Role-Based Access

```typescript
const rules: RouteProtectionRule[] = [
  {
    paths: "/admin",
    condition: () => role === "admin",
    redirectTo: "/",
  },
  {
    paths: "/merchant",
    condition: () => ["admin", "merchant"].includes(role),
    redirectTo: "/",
  },
];
```

---

### 6. Subscription Tiers

```typescript
{
  paths: "/premium-features",
  condition: () => subscription === "premium" || subscription === "enterprise",
  redirectTo: "/upgrade",
  reason: "Premium subscription required",
  onProtected: () => {
    showUpgradeModal();
  },
}
```

---

### 7. Complex Conditions

```typescript
{
  paths: "/advanced-analytics",
  condition: () => {
    return isPremium &&
           hasAnalyticsEnabled &&
           !isTrialExpired &&
           user.permissions.includes("analytics");
  },
  redirectTo: "/upgrade",
}
```

---

### 8. Exact Match Only

```typescript
{
  paths: "/pos",
  condition: () => showPOS,
  redirectTo: "/balance",
  matchMode: "exact", // Only blocks exactly "/pos", not "/pos/settings"
}
```

---

### 9. Beta Features

```typescript
{
  paths: ["/beta", "/experimental"],
  condition: () => featureFlags.betaEnabled && user.betaOptIn,
  redirectTo: "/settings",
  reason: "Beta features not enabled",
  onProtected: () => {
    showToast({ message: "Enable beta features in settings" });
  },
}
```

---

### 10. Time-Based Access

```typescript
{
  paths: "/limited-time-offer",
  condition: () => {
    const now = Date.now();
    return now >= startDate && now <= endDate;
  },
  redirectTo: "/",
  reason: "Offer expired",
}
```

---

## 🔧 Real-World Example

Complete implementation with multiple rules:

```typescript
function RouteProtectionWrapper({ children }: { children: ReactNode }) {
  // Get all necessary context
  const { showPOS } = usePOSToggle();
  const { isAuthenticated, isAdmin, isPremium, role } = useAuth();
  const { features } = useFeatureFlags();

  // Define all protection rules
  const protectionRules: RouteProtectionRule[] = [
    // Authentication required
    {
      paths: ["/profile", "/orders", "/settings"],
      condition: () => isAuthenticated,
      redirectTo: "/login",
      reason: "Authentication required",
    },

    // POS feature toggle
    {
      paths: ["/(main)/pos", "/pos"],
      condition: () => showPOS && isAuthenticated,
      redirectTo: "/(main)/balance",
      reason: "POS feature is disabled",
      onProtected: (path) => {
        analytics.track("pos_access_blocked", { from: path });
      },
    },

    // Admin only
    {
      paths: ["/admin", "/(main)/admin"],
      condition: () => isAdmin,
      redirectTo: "/(main)/balance",
      reason: "Admin access required",
    },

    // Premium features
    {
      paths: ["/premium", "/advanced"],
      condition: () => isPremium,
      redirectTo: "/upgrade",
      reason: "Premium subscription required",
      onProtected: () => {
        showToast({ message: "Upgrade to access premium features" });
      },
    },

    // Beta features
    {
      paths: ["/beta"],
      condition: () => features.beta && role === "tester",
      redirectTo: "/settings",
      reason: "Beta features not enabled",
    },
  ];

  useRouteProtection(protectionRules);

  return <>{children}</>;
}
```

---

## 💡 Pro Tips

### 1. Order Matters

Rules are checked in order. Put most common checks first:

```typescript
const rules = [
  // High traffic - check first
  { paths: "/pos", ... },

  // Medium traffic
  { paths: "/orders", ... },

  // Low traffic - check last
  { paths: "/admin", ... },
];
```

### 2. Memoize Rules

For better performance:

```typescript
const rules = useMemo(
  () => [
    {
      paths: "/pos",
      condition: () => showPOS,
      redirectTo: "/balance",
    },
  ],
  [showPOS]
); // Only recreate when dependencies change
```

### 3. Centralize Config

For large apps:

```typescript
// config/routes.ts
export const PROTECTED_ROUTES = {
  POS: ["/(main)/pos", "/pos"],
  ADMIN: ["/admin"],
  PREMIUM: ["/premium", "/advanced"],
};

// Usage
const rules = [
  {
    paths: PROTECTED_ROUTES.POS,
    condition: () => showPOS,
    redirectTo: "/balance",
  },
];
```

### 4. Combine with Screen Guards

Use both for defense in depth:

```typescript
// Global protection (app/_layout.tsx)
useRouteProtection(rules);

// Screen-level protection (app/(main)/pos.tsx)
if (!showPOS) {
  return <Redirect href="/balance" />;
}
```

---

## 🎯 Summary

The flexible route protection system allows you to:

✅ Protect multiple routes easily  
✅ Custom conditions per route  
✅ Different fallbacks per route  
✅ Track blocked access for analytics  
✅ Scale from simple to complex scenarios

**All with a simple, declarative configuration!**
