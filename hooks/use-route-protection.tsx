import { usePathname, useRouter } from "expo-router";
import { useEffect } from "react";

export interface RouteProtectionRule {
  /**
   * Route path(s) to protect
   * Can be a string or array of strings
   * @example "/pos" or ["/(main)/pos", "/pos"]
   */
  paths: string | string[];

  /**
   * Condition function that returns true if access is allowed
   * @example () => showPOS
   */
  condition: () => boolean;

  /**
   * Fallback route to redirect to if condition fails
   * @example "/(main)/balance"
   */
  redirectTo: string;

  /**
   * Optional: Reason for protection (for logging/debugging)
   * @example "POS feature is disabled"
   */
  reason?: string;

  /**
   * Optional: Match mode - "exact" or "contains"
   * @default "contains"
   */
  matchMode?: "exact" | "contains";

  /**
   * Optional: Callback when protection is triggered
   * Useful for analytics or custom logic
   */
  onProtected?: (pathname: string) => void;
}

/**
 * Flexible route protection hook
 * Automatically redirects users based on protection rules
 *
 * @param rules - Array of protection rules to enforce
 *
 * @example
 * ```tsx
 * const rules: RouteProtectionRule[] = [
 *   {
 *     paths: ["/(main)/pos", "/pos"],
 *     condition: () => showPOS,
 *     redirectTo: "/(main)/balance",
 *     reason: "POS feature is disabled",
 *   },
 * ];
 * useRouteProtection(rules);
 * ```
 */
export function useRouteProtection(rules: RouteProtectionRule[]) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    for (const rule of rules) {
      // Normalize paths to array
      const paths = Array.isArray(rule.paths) ? rule.paths : [rule.paths];
      const matchMode = rule.matchMode || "contains";

      // Check if current path matches any protected paths
      const isProtectedPath = paths.some((path) => {
        if (matchMode === "exact") {
          return pathname === path;
        }
        // Default: contains mode
        return pathname.includes(path) || pathname === path;
      });

      // If path is protected and condition fails, redirect
      if (isProtectedPath && !rule.condition()) {
        const logMessage = rule.reason
          ? `[Route Protection] ${rule.reason}`
          : `[Route Protection] Access denied to ${pathname}`;

        console.log(
          `${logMessage} - Redirecting from ${pathname} to ${rule.redirectTo}`
        );

        // Call optional callback for analytics or custom logic
        rule.onProtected?.(pathname);

        // Redirect to fallback route
        router.replace(rule.redirectTo as any);

        // Stop checking other rules after first match
        break;
      }
    }
  }, [pathname, router, rules]);
}
