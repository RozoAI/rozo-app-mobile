import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { type GenericWallet } from "@/contexts/auth.context";
import { getItem, setItem } from "@/libs/storage";
import { useAuth } from "./auth.provider";

const POS_TOGGLE_BASE_KEY = "show_pos_toggle";

interface WalletContextProps {
  wallets: GenericWallet[];
  primaryWallet: GenericWallet | null;
  showPOS: boolean;
  togglePOS: (value: boolean) => Promise<void>;
}

const WalletContext = createContext<WalletContextProps>({
  wallets: [],
  primaryWallet: null,
  showPOS: false,
  togglePOS: async () => {},
});

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { user } = useAuth();

  const [showPOS, setShowPOS] = useState<boolean>(false);

  // Computed values
  const wallets = useMemo(() => {
    if (!user?.linked_accounts) return [];
    return user.linked_accounts
      .filter((account: any) => account.type === "wallet")
      .map((wallet: any) => ({
        address: wallet.address,
        chain: wallet.chainType || "ethereum",
        isConnected: true,
      }));
  }, [user?.linked_accounts]);

  const primaryWallet = useMemo(() => {
    return wallets.length > 0
      ? wallets[0]
      : wallets.length > 1
      ? wallets[1]
      : null;
  }, [wallets]);

  // POS Toggle key based on primary wallet
  const userPOSToggleKey = useMemo(() => {
    const walletAddress = primaryWallet?.address;
    return walletAddress
      ? `${POS_TOGGLE_BASE_KEY}_${walletAddress}`
      : POS_TOGGLE_BASE_KEY;
  }, [primaryWallet?.address]);

  const togglePOS = useCallback(
    async (value: boolean) => {
      setShowPOS(value);
      await setItem(userPOSToggleKey, value);
    },
    [userPOSToggleKey]
  );

  // Effect for POS toggle state
  useEffect(() => {
    if (userPOSToggleKey && primaryWallet) {
      const saved = getItem<boolean>(userPOSToggleKey);
      if (saved !== null) {
        setShowPOS(saved);
      }
    }
  }, [userPOSToggleKey, primaryWallet]);

  const contextValue = useMemo(
    () => ({
      wallets,
      primaryWallet,
      showPOS,
      togglePOS,
    }),
    [wallets, primaryWallet, showPOS, togglePOS]
  );

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);

// Export usePOSToggle for backward compatibility
export const usePOSToggle = () => {
  const { showPOS, togglePOS } = useWallet();
  return { showPOS, togglePOS };
};
