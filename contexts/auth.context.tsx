import React, { createContext, useContext } from "react";

// Define a generic wallet type that can work with both Dynamic and Privy
export interface GenericWallet {
  address: string;
  chain?: "ethereum" | "stellar";
  isConnected: boolean;
}

// Generic auth context interface that both Dynamic and Privy providers will implement
export interface AuthContextValue {
  // Auth state
  token: string | undefined;
  isAuthenticated: boolean;
  isAuthLoading: boolean;

  // User data (available from auth providers)
  user?: any; // Generic user object from auth provider

  // Wallet state
  wallets: GenericWallet[];
  primaryWallet: GenericWallet | null;

  // Auth actions
  showAuthModal: () => void;
  logout: () => Promise<void>;

  // Merchant actions (will be called by auth providers when user is created/authenticated)
  onUserAuthenticated: (token: string) => void;

  // Optional provider-specific functions
  getAccessToken?: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Provider wrapper that auth providers will use
export const AuthContextProvider: React.FC<{
  children: React.ReactNode;
  value: AuthContextValue;
}> = ({ children, value }) => {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
