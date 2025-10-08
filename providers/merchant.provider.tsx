import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSelectedLanguage } from "@/hooks/use-selected-language";
import { MERCHANT_KEY } from "@/libs/constants";
import { currencies, type CurrencyConfig } from "@/libs/currencies";
import { AppError } from "@/libs/error";
import { getItem, setItem } from "@/libs/storage";
import { defaultToken, type Token, tokens } from "@/libs/tokens";
import { showToast } from "@/libs/utils";
import { useCreateProfile, useGetProfile } from "@/resources/api";
import { type MerchantProfile } from "@/resources/schema/merchant";
import { useAuth } from "./auth.provider";

interface MerchantContextProps {
  merchant: MerchantProfile | undefined;
  defaultCurrency: CurrencyConfig | undefined;
  merchantToken: Token | undefined;
  isMerchantLoading: boolean;
  setMerchant: (merchant: MerchantProfile | undefined) => void;
}

const MerchantContext = createContext<MerchantContextProps>({
  merchant: undefined,
  defaultCurrency: undefined,
  merchantToken: undefined,
  isMerchantLoading: false,
  setMerchant: () => {},
});

interface MerchantProviderProps {
  children: React.ReactNode;
}

export const MerchantProvider: React.FC<MerchantProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { language } = useSelectedLanguage();

  const [merchant, setMerchant] = useState<MerchantProfile | undefined>(
    undefined
  );
  const [isMerchantLoading, setIsMerchantLoading] = useState(false);

  // Track initialization to prevent multiple runs
  const hasInitialized = useRef(false);

  // API hooks
  const { refetch: fetchProfile } = useGetProfile();
  const { mutateAsync: createProfile } = useCreateProfile();

  // Computed values
  const merchantToken = useMemo(() => {
    if (merchant?.default_token_id) {
      return tokens.find((token) => token.key === merchant?.default_token_id);
    }
    return defaultToken;
  }, [merchant]);

  const defaultCurrency = useMemo(() => {
    const currency = merchant?.default_currency ?? "USD";
    return currencies[currency];
  }, [merchant]);

  // Main merchant initialization effect
  useEffect(() => {
    let isMounted = true;

    const initializeMerchant = async () => {
      // Skip if not authenticated or already initialized
      if (!isAuthenticated || !user || !isMounted) return;

      // Check if we've already initialized for this user
      if (hasInitialized.current) return;

      hasInitialized.current = true;

      try {
        setIsMerchantLoading(true);

        // Check for cached merchant data
        const cachedMerchant = getItem<MerchantProfile>(MERCHANT_KEY);
        if (cachedMerchant && isMounted) {
          setMerchant(cachedMerchant);
          setIsMerchantLoading(false);
        }

        // Fetch profile
        const profileResult = await fetchProfile();
        if (profileResult.data && isMounted) {
          setMerchant(profileResult.data);
          setItem(MERCHANT_KEY, profileResult.data);
          setIsMerchantLoading(false);
        } else if (profileResult.error && isMounted) {
          const error = profileResult.error as unknown as AppError;
          if (error.statusCode === 404) {
            // Create profile
            const email = (user as any)?.email?.address || "";
            const displayName =
              (user as any)?.email?.address || user?.id || "User";
            const logoUrl = (user as any)?.image || "";

            const profilePayload = {
              email,
              display_name: displayName,
              description: "",
              logo_url: logoUrl,
              default_currency: "USD",
              default_language: (language ?? "EN").toUpperCase(),
              default_token_id: defaultToken?.key,
            };

            const newProfile = await createProfile(profilePayload);
            if (newProfile && isMounted) {
              setMerchant(newProfile);
              setItem(MERCHANT_KEY, newProfile);
              showToast({
                type: "success",
                message: "Profile created successfully! Welcome to Rozo POS",
              });
            }
          } else {
            console.error("Profile fetch error:", error);
            showToast({
              type: "danger",
              message: "Failed to load merchant profile",
            });
          }
          setIsMerchantLoading(false);
        }
      } catch (error) {
        console.error("Merchant initialization error:", error);
        if (isMounted) {
          showToast({
            type: "danger",
            message: "Failed to initialize merchant profile",
          });
          hasInitialized.current = false; // Reset on error
        }
      } finally {
        if (isMounted) {
          setIsMerchantLoading(false);
        }
      }
    };

    initializeMerchant();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, fetchProfile, createProfile, language]);

  // Reset initialization when user changes
  useEffect(() => {
    if (!user) {
      hasInitialized.current = false;
      setMerchant(undefined);
    }
  }, [user]);

  const contextValue = useMemo(
    () => ({
      merchant,
      defaultCurrency,
      merchantToken,
      isMerchantLoading,
      setMerchant,
    }),
    [merchant, defaultCurrency, merchantToken, isMerchantLoading, setMerchant]
  );

  return (
    <MerchantContext.Provider value={contextValue}>
      {children}
    </MerchantContext.Provider>
  );
};

export const useMerchant = () => useContext(MerchantContext);
