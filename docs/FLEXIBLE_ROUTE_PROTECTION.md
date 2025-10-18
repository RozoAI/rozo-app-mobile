# Flexible Route Protection System

## Overview

A dynamic, configuration-based route protection system that makes it easy to guard multiple routes with different conditions and fallback behaviors.

**Date:** October 18, 2025  
**Status:** ✅ Production Ready

---

## 🎯 Key Features

- ✅ **Multiple Routes**: Protect as many routes as you need
- ✅ **Dynamic Conditions**: Each route can have its own access condition
- ✅ **Custom Fallbacks**: Redirect to different routes per rule
- ✅ **Match Modes**: Support exact or contains matching
- ✅ **Analytics Ready**: Optional callbacks for tracking
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Zero Dependencies**: Uses only Expo Router primitives
- ✅ **Extensible**: Easy to add new rules without modifying the hook

---

## 📚 API Reference

### `RouteProtectionRule` Interface

```typescript
interface RouteProtectionRule {
  /**
   * Route path(s) to protect
   * Can be a string or array of strings
   */
  paths: string | string[];

  /**
   * Condition function that returns true if access is allowed
   */
  condition: () => boolean;

  /**
   * Fallback route to redirect to if condition fails
   */
  redirectTo: string;

  /**
   * Optional: Reason for protection (for logging/debugging)
   */
  reason?: string;

  /**
   * Optional: Match mode - "exact" or "contains"
   * @default "contains"
   */
  matchMode?: "exact" | "contains";

  /**
   * Optional: Callback when protection is triggered
   */
  onProtected?: (pathname: string) => void;
}
```

### `useRouteProtection` Hook

```typescript
function useRouteProtection(rules: RouteProtectionRule[]): void;
```

**Parameters:**

- `rules` - Array of `RouteProtectionRule` objects

**Returns:** `void` (side effects only)

---

## 🚀 Usage Examples

### Basic Example: Single Protected Route

```typescript
import {
  useRouteProtection,
  type RouteProtectionRule,
} from "@/hooks/use-route-protection";
import { usePOSToggle } from "@/providers/preferences.provider";

function MyComponent() {
  const { showPOS } = usePOSToggle();

  const rules: RouteProtectionRule[] = [
    {
      paths: "/pos",
      condition: () => showPOS,
      redirectTo: "/balance",
      reason: "POS feature is disabled",
    },
  ];

  useRouteProtection(rules);

  return <>{/* Your component */}</>;
}
```

---

### Multiple Paths (Same Rule)

```typescript
const rules: RouteProtectionRule[] = [
  {
    paths: ["/(main)/pos", "/pos", "/point-of-sale"],
    condition: () => showPOS,
    redirectTo: "/(main)/balance",
    reason: "POS feature is disabled",
  },
];
```

---

### Multiple Rules (Different Conditions)

```typescript
function RouteProtectionWrapper({ children }) {
  const { showPOS } = usePOSToggle();
  const { isAdmin, isPremium } = useAuth();

  const rules: RouteProtectionRule[] = [
    // POS Protection
    {
      paths: ["/(main)/pos", "/pos"],
      condition: () => showPOS,
      redirectTo: "/(main)/balance",
      reason: "POS feature is disabled",
    },

    // Admin Protection
    {
      paths: ["/admin", "/(main)/admin"],
      condition: () => isAdmin,
      redirectTo: "/(main)/balance",
      reason: "Admin access required",
    },

    // Premium Features Protection
    {
      paths: ["/premium", "/advanced"],
      condition: () => isPremium,
      redirectTo: "/(main)/balance",
      reason: "Premium subscription required",
    },
  ];

  useRouteProtection(rules);
  return <>{children}</>;
}
```

---

### With Analytics Tracking

```typescript
const rules: RouteProtectionRule[] = [
  {
    paths: "/pos",
    condition: () => showPOS,
    redirectTo: "/balance",
    reason: "POS feature disabled",
    onProtected: (pathname) => {
      // Track blocked access attempts
      analytics.track("feature_access_blocked", {
        feature: "pos",
        from: pathname,
        timestamp: Date.now(),
      });

      // Show user feedback
      showToast({
        type: "info",
        message: "Enable POS in settings to access this feature",
      });
    },
  },
];
```

---

### Exact vs Contains Matching

```typescript
const rules: RouteProtectionRule[] = [
  // Exact match: Only blocks exactly "/pos"
  {
    paths: "/pos",
    condition: () => showPOS,
    redirectTo: "/balance",
    matchMode: "exact",
  },

  // Contains match (default): Blocks "/pos", "/pos/settings", etc.
  {
    paths: "/pos",
    condition: () => showPOS,
    redirectTo: "/balance",
    matchMode: "contains", // or omit (default)
  },
];
```

---

### Complex Conditions

```typescript
const rules: RouteProtectionRule[] = [
  {
    paths: "/premium-analytics",
    condition: () => {
      // Multiple conditions
      return isPremium && hasAnalyticsEnabled && !isTrialExpired;
    },
    redirectTo: "/upgrade",
    reason: "Premium subscription with analytics required",
  },

  {
    paths: "/beta-features",
    condition: () => {
      // Check feature flags
      return featureFlags.betaEnabled && user.betaOptIn;
    },
    redirectTo: "/settings",
    reason: "Beta features not enabled",
  },
];
```

---

## 🏗️ Integration with App

### Current Implementation

```typescript
// app/_layout.tsx
import { usePOSToggle } from "@/providers/preferences.provider";
import {
  useRouteProtection,
  type RouteProtectionRule,
} from "@/hooks/use-route-protection";

function RouteProtectionWrapper({ children }: { children: ReactNode }) {
  const { showPOS } = usePOSToggle();

  const protectionRules: RouteProtectionRule[] = [
    {
      paths: ["/(main)/pos", "/pos"],
      condition: () => showPOS,
      redirectTo: "/(main)/balance",
      reason: "POS feature is disabled",
      onProtected: (pathname) => {
        console.log(
          `[Analytics] User attempted to access POS from: ${pathname}`
        );
      },
    },
  ];

  useRouteProtection(protectionRules);

  return <>{children}</>;
}

// Used in app layout
<AppProvider>
  <KeyboardProvider>
    <RouteProtectionWrapper>
      <Stack>{/* Screens */}</Stack>
    </RouteProtectionWrapper>
  </KeyboardProvider>
</AppProvider>;
```

---

## 🎯 Common Patterns

### Pattern 1: Feature Flags

```typescript
const { features } = useFeatureFlags();

const rules: RouteProtectionRule[] = [
  {
    paths: "/new-feature",
    condition: () => features.newFeature,
    redirectTo: "/",
    reason: "Feature not yet available",
  },
];
```

---

### Pattern 2: Authentication

```typescript
const { isAuthenticated, isVerified } = useAuth();

const rules: RouteProtectionRule[] = [
  {
    paths: ["/profile", "/settings", "/orders"],
    condition: () => isAuthenticated,
    redirectTo: "/login",
    reason: "Authentication required",
  },
  {
    paths: "/payment",
    condition: () => isAuthenticated && isVerified,
    redirectTo: "/verify-email",
    reason: "Email verification required",
  },
];
```

---

### Pattern 3: Role-Based Access

```typescript
const { userRole } = useAuth();

const rules: RouteProtectionRule[] = [
  {
    paths: "/admin",
    condition: () => userRole === "admin",
    redirectTo: "/",
    reason: "Admin role required",
  },
  {
    paths: "/merchant-dashboard",
    condition: () => ["admin", "merchant"].includes(userRole),
    redirectTo: "/",
    reason: "Merchant access required",
  },
];
```

---

### Pattern 4: Subscription Tiers

```typescript
const { subscription } = useUser();

const rules: RouteProtectionRule[] = [
  {
    paths: "/premium",
    condition: () => ["premium", "enterprise"].includes(subscription.tier),
    redirectTo: "/upgrade",
    reason: "Premium subscription required",
  },
  {
    paths: "/enterprise",
    condition: () => subscription.tier === "enterprise",
    redirectTo: "/upgrade?plan=enterprise",
    reason: "Enterprise subscription required",
  },
];
```

---

## 🔧 Advanced Usage

### Centralized Configuration

For large apps, create a centralized config file:

```typescript
// config/route-protection.config.ts
import { type RouteProtectionRule } from "@/hooks/use-route-protection";

export function createProtectionRules(context: {
  showPOS: boolean;
  isAdmin: boolean;
  isPremium: boolean;
}): RouteProtectionRule[] {
  return [
    {
      paths: ["/(main)/pos", "/pos"],
      condition: () => context.showPOS,
      redirectTo: "/(main)/balance",
      reason: "POS feature is disabled",
    },
    {
      paths: ["/admin"],
      condition: () => context.isAdmin,
      redirectTo: "/(main)/balance",
      reason: "Admin access required",
    },
    {
      paths: ["/premium"],
      condition: () => context.isPremium,
      redirectTo: "/upgrade",
      reason: "Premium subscription required",
    },
  ];
}

// Usage
function RouteProtectionWrapper({ children }) {
  const { showPOS } = usePOSToggle();
  const { isAdmin, isPremium } = useAuth();

  const rules = createProtectionRules({ showPOS, isAdmin, isPremium });
  useRouteProtection(rules);

  return <>{children}</>;
}
```

---

### Dynamic Rules from API

```typescript
function RouteProtectionWrapper({ children }) {
  const { data: permissions } = usePermissions();

  const rules: RouteProtectionRule[] = useMemo(() => {
    if (!permissions) return [];

    return permissions.protectedRoutes.map((route) => ({
      paths: route.path,
      condition: () => route.hasAccess,
      redirectTo: route.fallback,
      reason: route.reason,
    }));
  }, [permissions]);

  useRouteProtection(rules);
  return <>{children}</>;
}
```

---

## 🐛 Troubleshooting

### Issue: Rule not triggering

**Check:**

1. Is the `condition` function returning the correct value?
2. Is the path matching correctly? Try logging `pathname` in the component.
3. Is the hook being called inside the router context?

**Solution:**

```typescript
// Add debug logging
const rules: RouteProtectionRule[] = [
  {
    paths: "/pos",
    condition: () => {
      console.log("[Debug] showPOS:", showPOS);
      return showPOS;
    },
    redirectTo: "/balance",
  },
];
```

---

### Issue: Infinite redirect loop

**Cause:** The fallback route also has a guard that fails.

**Solution:** Ensure fallback routes are always accessible:

```typescript
// ❌ Bad: Balance also requires condition
{
  paths: "/pos",
  condition: () => showPOS,
  redirectTo: "/balance", // But balance also requires something!
}

// ✅ Good: Balance is always accessible
{
  paths: "/pos",
  condition: () => showPOS,
  redirectTo: "/balance", // Balance has no guards
}
```

---

### Issue: Callback not firing

**Check:** Are you using arrow function syntax?

```typescript
// ❌ Bad: Function reference (loses context)
onProtected: trackAccess;

// ✅ Good: Arrow function
onProtected: (pathname) => trackAccess(pathname);
```

---

## 📊 Performance Considerations

### Hook Performance

- **O(n)** where n = number of rules
- Stops at first matching rule
- Effect only runs when pathname or rules change
- No additional re-renders

### Best Practices

1. **Define rules outside component when possible:**

   ```typescript
   // ✅ Good: Memoized
   const rules = useMemo(() => [...], [dependencies]);

   // ❌ Bad: New array every render
   const rules = [...];
   ```

2. **Keep conditions simple:**

   ```typescript
   // ✅ Good: Simple boolean check
   condition: () => showPOS;

   // ⚠️ Okay but careful: Complex logic
   condition: () => {
     // Keep this fast, it runs on every navigation
     return checkComplexCondition();
   };
   ```

3. **Order rules by frequency:**
   ```typescript
   // Put most frequently checked rules first
   const rules = [
     { paths: "/pos", ... },        // Checked often
     { paths: "/admin", ... },      // Checked less
     { paths: "/rare-page", ... },  // Almost never
   ];
   ```

---

## 🧪 Testing

### Unit Test Example

```typescript
import { renderHook } from "@testing-library/react-hooks";
import { useRouteProtection } from "@/hooks/use-route-protection";

describe("useRouteProtection", () => {
  it("should redirect when condition fails", () => {
    const rules = [
      {
        paths: "/pos",
        condition: () => false,
        redirectTo: "/balance",
      },
    ];

    // Mock usePathname to return "/pos"
    jest.mock("expo-router", () => ({
      usePathname: () => "/pos",
      useRouter: () => ({ replace: jest.fn() }),
    }));

    const { result } = renderHook(() => useRouteProtection(rules));

    // Assert router.replace was called
    expect(mockRouter.replace).toHaveBeenCalledWith("/balance");
  });
});
```

---

## 🎓 Migration from Old System

### Before (Hardcoded)

```typescript
export function useRouteProtection() {
  const pathname = usePathname();
  const router = useRouter();
  const { showPOS } = usePOSToggle();

  useEffect(() => {
    if (!showPOS && pathname.includes("/pos")) {
      router.replace("/(main)/balance");
    }
  }, [pathname, showPOS, router]);
}
```

### After (Flexible)

```typescript
export function useRouteProtection(rules: RouteProtectionRule[]) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    for (const rule of rules) {
      const paths = Array.isArray(rule.paths) ? rule.paths : [rule.paths];
      const isProtected = paths.some((p) => pathname.includes(p));

      if (isProtected && !rule.condition()) {
        router.replace(rule.redirectTo as any);
        break;
      }
    }
  }, [pathname, router, rules]);
}

// Usage
const rules = [
  {
    paths: "/pos",
    condition: () => showPOS,
    redirectTo: "/(main)/balance",
  },
];
useRouteProtection(rules);
```

---

## ✅ Summary

### What You Get

- 🎯 **Flexible**: Configure any route with any condition
- 🔒 **Secure**: Multiple protection layers
- 📊 **Observable**: Built-in analytics hooks
- 🚀 **Performant**: Minimal overhead
- 🧹 **Maintainable**: Easy to add/remove rules
- 📚 **Well-Typed**: Full TypeScript support

### Key Takeaways

1. Define protection rules as configuration objects
2. Each rule can have its own condition and fallback
3. Support for multiple paths per rule
4. Optional callbacks for analytics/custom logic
5. Easy to extend without modifying the hook

---

**The flexible route protection system is ready for production use!** 🎉
