import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getItem, removeItem, setItem } from "@/libs/storage";
import { useWallet } from "./wallet.provider";

const POS_TOGGLE_BASE_KEY = "show_pos_toggle";

interface PreferencesContextProps {
  showPOS: boolean;
  togglePOS: (value: boolean) => Promise<void>;
  deleteTogglePOS: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextProps>({
  showPOS: false,
  togglePOS: async () => { },
  deleteTogglePOS: async () => { },
});

interface PreferencesProviderProps {
  children: React.ReactNode;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({
  children,
}) => {
  const { primaryWallet } = useWallet();

  const [showPOS, setShowPOS] = useState<boolean>(false);

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

  const deleteTogglePOS = useCallback(async () => {
    await removeItem(userPOSToggleKey);
    setShowPOS(false);
  }, [userPOSToggleKey]);

  // Load POS toggle state from storage on mount or when key changes
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
      showPOS,
      togglePOS,
      deleteTogglePOS,
    }),
    [showPOS, togglePOS, deleteTogglePOS]
  );

  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);

// Specialized hook for POS toggle
export const usePOSToggle = () => {
  const { showPOS, togglePOS } = usePreferences();
  return { showPOS, togglePOS };
};

