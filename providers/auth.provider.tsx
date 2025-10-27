import { PrivyUser, usePrivy } from "@privy-io/expo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { TOKEN_KEY } from "@/libs/constants";
import { storage } from "@/libs/storage";

interface AuthContextProps {
  isAuthenticated: boolean;
  token: string | undefined;
  isAuthLoading: boolean;
  user?: PrivyUser | null;
  getAccessToken?: () => Promise<string | null>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  token: undefined,
  isAuthLoading: false,
  user: undefined,
  getAccessToken: undefined,
  refreshAccessToken: async () => null,
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, getAccessToken } = usePrivy();

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);

  // Track initialization to prevent multiple runs
  const hasInitialized = useRef(false);

  // Computed values
  const isAuthenticated = useMemo(() => {
    return !!(user && accessToken);
  }, [user, accessToken]);

  const refreshAccessToken = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        setAccessToken(token);
        // Store token as plain string, not JSON
        storage.set(TOKEN_KEY, token);
        return token;
      }
      return null;
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      return null;
    }
  }, [getAccessToken]);

  // Main authentication effect
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // Skip if not ready or already initialized
      if (!user || !isMounted) return;

      // Check if we've already initialized for this user
      if (hasInitialized.current) return;

      hasInitialized.current = true;

      try {
        setIsAuthLoading(true);

        // Get access token
        const token = await getAccessToken();
        if (!token || !isMounted) {
          hasInitialized.current = false; // Reset on failure
          return;
        }

        setAccessToken(token);
        // Store token as plain string, not JSON
        storage.set(TOKEN_KEY, token);
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (isMounted) {
          error("Failed to initialize authentication");
          hasInitialized.current = false; // Reset on error
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [user, getAccessToken]);

  // Reset initialization when user changes
  useEffect(() => {
    if (!user) {
      hasInitialized.current = false;
      setAccessToken(undefined);
    }
  }, [user]);

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      token: accessToken,
      isAuthLoading,
      user,
      getAccessToken,
      refreshAccessToken,
    }),
    [
      isAuthenticated,
      accessToken,
      isAuthLoading,
      user,
      getAccessToken,
      refreshAccessToken,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
