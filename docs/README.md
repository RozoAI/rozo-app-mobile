# Documentation

Welcome to the Rozo App Mobile documentation! This directory contains comprehensive guides for various features and systems.

---

## 📚 Available Documentation

### Toast System

A centralized toast notification system built on `react-native-toastify` for displaying user notifications across the application.

#### **[TOAST_SYSTEM.md](./TOAST_SYSTEM.md)**

Complete guide to the centralized toast system implementation and usage.

**Topics Covered:**

- 🏗️ Architecture overview and core components
- 📦 Installation and setup
- 🚀 Usage examples (basic to advanced)
- 🎨 Toast types and themes
- 🔄 Integration examples (merchant status, payment, auth)
- 📋 Best practices and migration guide
- 🐛 Troubleshooting and performance considerations
- 📚 API reference

**Best for:** Understanding and implementing toast notifications throughout the app.

---

### Route Protection System

A comprehensive guide to the flexible route protection system that guards routes based on user permissions, feature flags, and preferences.

#### 1. **[ROUTE_PROTECTION.md](./ROUTE_PROTECTION.md)**

Complete implementation guide for the three-layer defense system (Option 5 - Combined Approach).

**Topics Covered:**

- 🏗️ Architecture overview (UI, Route, Global layers)
- 📁 Files modified and created
- 🎯 How it works (scenarios and flow)
- 🔒 Protection coverage matrix
- 🧪 Testing checklist
- 📊 Performance impact
- 🔧 Extending protection
- 🐛 Troubleshooting

**Best for:** Understanding the overall architecture and defense-in-depth strategy.

---

#### 2. **[FLEXIBLE_ROUTE_PROTECTION.md](./FLEXIBLE_ROUTE_PROTECTION.md)**

Technical reference for the flexible, configuration-based route protection system.

**Topics Covered:**

- 🎯 Key features
- 📚 API reference (`RouteProtectionRule` interface)
- 🚀 Usage examples (basic to advanced)
- 🏗️ Integration with app
- 🎯 Common patterns (feature flags, auth, roles, subscriptions)
- 🔧 Advanced usage (centralized config, dynamic rules)
- 🐛 Troubleshooting
- 📊 Performance considerations
- 🧪 Testing examples
- 🎓 Migration guide

**Best for:** Learning how to use and extend the flexible route protection system.

---

#### 3. **[ROUTE_PROTECTION_EXAMPLES.md](./ROUTE_PROTECTION_EXAMPLES.md)**

Quick reference guide with real-world examples and code snippets.

**Topics Covered:**

- 🚀 Quick start
- 📚 10+ common scenarios:
  - Multiple paths, same rule
  - Multiple features
  - With analytics
  - Authentication required
  - Role-based access
  - Subscription tiers
  - Complex conditions
  - Exact match only
  - Beta features
  - Time-based access
- 🔧 Real-world complete example
- 💡 Pro tips

**Best for:** Copy-paste examples and quick implementation reference.

---

## 🗺️ Documentation Map

```
docs/
├── README.md (you are here)
│
├── Toast System
│   └── TOAST_SYSTEM.md                  ← Complete Toast Guide
│
└── Route Protection System
    ├── ROUTE_PROTECTION.md              ← Overview & Architecture
    ├── FLEXIBLE_ROUTE_PROTECTION.md     ← Technical Reference
    └── ROUTE_PROTECTION_EXAMPLES.md     ← Quick Examples
```

---

## 🚀 Quick Start Guides

### For Toast Notifications

**Start here:** [TOAST_SYSTEM.md](./TOAST_SYSTEM.md)

1. Read the architecture overview
2. Understand the centralized system
3. See integration examples

**Quick implementation:**
```typescript
import { useToast } from '@/hooks/use-toast';

const { success, error } = useToast();
success("Operation completed!");
error("Something went wrong");
```

---

### For New Developers

**Start here:** [ROUTE_PROTECTION.md](./ROUTE_PROTECTION.md)

1. Read the architecture overview
2. Understand the three-layer protection system
3. Review how it's currently implemented

**Then:** [ROUTE_PROTECTION_EXAMPLES.md](./ROUTE_PROTECTION_EXAMPLES.md)

1. See real-world examples
2. Copy-paste patterns that fit your use case

---

### For Adding New Protected Routes

**Go to:** [ROUTE_PROTECTION_EXAMPLES.md](./ROUTE_PROTECTION_EXAMPLES.md)

1. Find a similar example
2. Copy the pattern
3. Adjust for your needs

**Need help?** [FLEXIBLE_ROUTE_PROTECTION.md](./FLEXIBLE_ROUTE_PROTECTION.md)

1. Check the API reference
2. Review troubleshooting section
3. See advanced patterns

---

### For Understanding Implementation Details

**Read:** [FLEXIBLE_ROUTE_PROTECTION.md](./FLEXIBLE_ROUTE_PROTECTION.md)

1. Study the `RouteProtectionRule` interface
2. Review integration patterns
3. Understand performance implications
4. Check testing strategies

---

## 📖 Reading Order by Role

### Product Manager / Designer

1. **[ROUTE_PROTECTION.md](./ROUTE_PROTECTION.md)** - Understand what's protected and why
2. **[ROUTE_PROTECTION_EXAMPLES.md](./ROUTE_PROTECTION_EXAMPLES.md)** - See real-world scenarios

### Frontend Developer (New to Project)

1. **[ROUTE_PROTECTION.md](./ROUTE_PROTECTION.md)** - Architecture overview
2. **[ROUTE_PROTECTION_EXAMPLES.md](./ROUTE_PROTECTION_EXAMPLES.md)** - Quick examples
3. **[FLEXIBLE_ROUTE_PROTECTION.md](./FLEXIBLE_ROUTE_PROTECTION.md)** - Deep dive when needed

### Senior Developer / Architect

1. **[FLEXIBLE_ROUTE_PROTECTION.md](./FLEXIBLE_ROUTE_PROTECTION.md)** - Technical reference
2. **[ROUTE_PROTECTION.md](./ROUTE_PROTECTION.md)** - Implementation details
3. **[ROUTE_PROTECTION_EXAMPLES.md](./ROUTE_PROTECTION_EXAMPLES.md)** - Patterns

---

## 🎯 Common Tasks

### Task: Add toast notifications

**File:** Any component file

```typescript
// 1. Import the hook
import { useToast } from '@/hooks/use-toast';

// 2. Use in component
const MyComponent = () => {
  const { success, error, warning, info } = useToast();
  
  const handleAction = () => {
    try {
      // Your logic here
      success("Action completed!");
    } catch (err) {
      error("Action failed");
    }
  };
};
```

**Reference:** [TOAST_SYSTEM.md#basic-usage](./TOAST_SYSTEM.md#basic-usage)

---

### Task: Add a new protected route

**File:** `app/_layout.tsx`

```typescript
// 1. Get your condition
const { showNewFeature } = usePreferences();

// 2. Add to rules array
const protectionRules: RouteProtectionRule[] = [
  // ... existing rules
  {
    paths: "/new-feature",
    condition: () => showNewFeature,
    redirectTo: "/(main)/balance",
    reason: "New feature is disabled",
  },
];
```

**Reference:** [ROUTE_PROTECTION_EXAMPLES.md#quick-start](./ROUTE_PROTECTION_EXAMPLES.md#-quick-start)

---

### Task: Add analytics tracking

```typescript
{
  paths: "/premium",
  condition: () => isPremium,
  redirectTo: "/upgrade",
  onProtected: (path) => {
    analytics.track("premium_access_blocked", { from: path });
  },
}
```

**Reference:** [ROUTE_PROTECTION_EXAMPLES.md#3-with-analytics](./ROUTE_PROTECTION_EXAMPLES.md#3-with-analytics)

---

### Task: Protect multiple routes with same condition

```typescript
{
  paths: ["/admin", "/(main)/admin", "/admin/settings"],
  condition: () => isAdmin,
  redirectTo: "/",
  reason: "Admin access required",
}
```

**Reference:** [ROUTE_PROTECTION_EXAMPLES.md#1-multiple-paths-same-rule](./ROUTE_PROTECTION_EXAMPLES.md#1-multiple-paths-same-rule)

---

## 🔍 Finding Information

| I want to...                    | Go to...                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Add toast notifications         | [TOAST_SYSTEM.md](./TOAST_SYSTEM.md)                                                                 |
| Understand toast architecture  | [TOAST_SYSTEM.md#architecture](./TOAST_SYSTEM.md#architecture)                                        |
| See toast examples              | [TOAST_SYSTEM.md#usage](./TOAST_SYSTEM.md#usage)                                                      |
| Understand overall architecture | [ROUTE_PROTECTION.md](./ROUTE_PROTECTION.md)                                                           |
| See code examples               | [ROUTE_PROTECTION_EXAMPLES.md](./ROUTE_PROTECTION_EXAMPLES.md)                                         |
| Learn the API                   | [FLEXIBLE_ROUTE_PROTECTION.md](./FLEXIBLE_ROUTE_PROTECTION.md)                                         |
| Add a new protected route       | [ROUTE_PROTECTION_EXAMPLES.md](./ROUTE_PROTECTION_EXAMPLES.md)                                         |
| Debug an issue                  | [FLEXIBLE_ROUTE_PROTECTION.md#troubleshooting](./FLEXIBLE_ROUTE_PROTECTION.md#-troubleshooting)        |
| Optimize performance            | [FLEXIBLE_ROUTE_PROTECTION.md#performance](./FLEXIBLE_ROUTE_PROTECTION.md#-performance-considerations) |
| Write tests                     | [FLEXIBLE_ROUTE_PROTECTION.md#testing](./FLEXIBLE_ROUTE_PROTECTION.md#-testing)                        |

---

## 📝 Contributing to Documentation

When adding new features or making changes:

1. **Update existing docs** if the change affects current features
2. **Add examples** to `ROUTE_PROTECTION_EXAMPLES.md` for new patterns
3. **Update API reference** in `FLEXIBLE_ROUTE_PROTECTION.md` if interfaces change
4. **Keep this README** in sync with new documents

---

## 🤝 Getting Help

1. **Check the docs first** - Most questions are answered here
2. **Look at examples** - See if a similar pattern exists
3. **Review troubleshooting** - Common issues and solutions
4. **Ask the team** - If docs don't help, reach out!

---

## 📅 Last Updated

December 19, 2024 - Added Toast System documentation

---

**Happy coding! 🚀**
