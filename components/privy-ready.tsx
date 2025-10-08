import { usePrivy } from "@privy-io/expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

export function PrivyReady({ children }: { children: React.ReactNode }) {
  const { isReady, user } = usePrivy();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    try {
      if (isReady && !user && !hasRedirected && isMounted) {
        // Only redirect once to prevent infinite loops
        setHasRedirected(true);
        router.replace("/login");
      }
    } catch (error) {
      console.error("Error in PrivyReady:", error);
    }

    return () => {
      isMounted = false;
    };
  }, [isReady, user, router, hasRedirected]);

  if (!isReady) {
    return null;
  }

  // Now it's safe to use other Privy hooks and state
  return children;
}
