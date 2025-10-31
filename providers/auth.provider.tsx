import { PrivyUser, usePrivy, usePrivyClient } from "@privy-io/expo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useToast } from "@/hooks/use-toast";
import { TOKEN_KEY } from "@/libs/constants";
import { storage } from "@/libs/storage";
import { queryClient } from "./query.provider";

interface AuthContextProps {
  isAuthenticated: boolean;
  token: string | undefined;
  isAuthLoading: boolean;
  user?: PrivyUser | null;
  refreshUser: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  token: undefined,
  isAuthLoading: false,
  user: null,
  refreshUser: async () => {},
  getAccessToken: async () => null,
  refreshAccessToken: async () => null,
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const client = usePrivyClient();

  const { user, getAccessToken } = usePrivy();
  const { error: toastError } = useToast();

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [userState, setUserState] = useState<PrivyUser | null>(user);

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

  const refreshUser = useCallback(async () => {
    const fetchedUser = await client.user.get();
    if (fetchedUser) {
      setUserState(fetchedUser.user);
    }
  }, [client]);

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.resetQueries();
    }
  }, [isAuthenticated]);

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
        setUserState(user);
        // Store token as plain string, not JSON
        storage.set(TOKEN_KEY, token);
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (isMounted) {
          toastError("Failed to initialize authentication");
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
  }, [user]);

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
      user: userState,
      getAccessToken,
      refreshUser,
      refreshAccessToken,
    }),
    [
      isAuthenticated,
      accessToken,
      isAuthLoading,
      user,
      getAccessToken,
      refreshUser,
      refreshAccessToken,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
