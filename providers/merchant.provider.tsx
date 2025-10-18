import { useSelectedLanguage } from "@/hooks/use-selected-language";
import { MERCHANT_KEY, TOKEN_KEY } from "@/libs/constants";
import { currencies, type CurrencyConfig } from "@/libs/currencies";
import type { AppError } from "@/libs/error";
import { privyClient } from "@/libs/privy-client";
import { getItem, removeItem, setItem } from "@/libs/storage";
import { defaultToken, tokens, type Token } from "@/libs/tokens";
import { showToast } from "@/libs/utils";
import {
  useCreateProfile,
  useGetProfile,
  useUpdateProfile,
} from "@/resources/api";
import type { MerchantProfile } from "@/resources/schema/merchant";
import { usePrivy } from "@privy-io/expo";
import type React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  setMerchant: () => { },
});

interface MerchantProviderProps {
  children: React.ReactNode;
}

export const MerchantProvider: React.FC<MerchantProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated, token } = useAuth();
  const { language } = useSelectedLanguage();
  const { logout: logoutPrivy } = usePrivy();

  const [merchant, setMerchant] = useState<MerchantProfile | undefined>(
    undefined,
  );
  const [isMerchantLoading, setIsMerchantLoading] = useState(false);

  // Track initialization to prevent multiple runs
  const hasInitialized = useRef(false);

  // API hooks
  const { refetch: fetchProfile } = useGetProfile();
  const { mutateAsync: createProfile } = useCreateProfile();
  const { mutateAsync: updateProfile } = useUpdateProfile();

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
      // Debug: entry, dependencies
      console.log("[MerchantProvider] initializeMerchant called", {
        isAuthenticated,
        user,
        isMounted,
        hasInitialized: hasInitialized.current,
      });

      // Skip if not authenticated or already initialized
      if (!isAuthenticated || !user || !token || !isMounted) {
        console.log(
          "[MerchantProvider] Skipping: Not authenticated or not mounted or no user or no token.",
          { isAuthenticated, user: !!user, token: !!token, isMounted },
        );
        return;
      }

      // Check if we've already initialized for this user
      if (hasInitialized.current) {
        console.log("[MerchantProvider] Already initialized, skipping.");
        return;
      }

      hasInitialized.current = true;

      try {
        setIsMerchantLoading(true);

        // Check for cached merchant data
        const cachedMerchant = getItem<MerchantProfile>(MERCHANT_KEY);
        if (cachedMerchant && isMounted) {
          console.log(
            "[MerchantProvider] Using cached merchant:",
            cachedMerchant,
          );
          setMerchant(cachedMerchant);
          setIsMerchantLoading(false);
        }

        // Fetch profile
        const profileResult = await fetchProfile();
        console.log("[MerchantProvider] Profile result:", profileResult);

        if (profileResult.data && isMounted) {
          console.log(
            "[MerchantProvider] Profile fetch success, setting merchant.",
          );

          if (!profileResult.data.email) {
            console.log(
              "[MerchantProvider] No email found, creating new profile.",
            );

            const privyUser = await privyClient.user.get();
            const email = privyUser.user.linked_accounts.find(
              (account) => account.type === "email",
            )?.address;

            if (email) {
              profileResult.data.email = email;
              console.log(
                "[MerchantProvider] Updating profile with payload:",
                JSON.stringify(profileResult.data, null, 2),
              );
              const newProfile = await updateProfile({
                email: email,
                display_name: profileResult.data.display_name,
                logo: profileResult.data.logo_url,
              });
              setMerchant(newProfile);
              setItem(MERCHANT_KEY, newProfile);
            } else {
              console.error(
                "[MerchantProvider] No email found, skipping profile creation.",
              );
              setMerchant(profileResult.data);
              setItem(MERCHANT_KEY, profileResult.data);
              setIsMerchantLoading(false);
            }

            showToast({
              type: "success",
              message: "Profile created successfully! Welcome to Rozo POS",
            });
            setIsMerchantLoading(false);
            return;
          }

          setMerchant(profileResult.data);
          setItem(MERCHANT_KEY, profileResult.data);
          setIsMerchantLoading(false);
        } else if (profileResult.error && isMounted) {
          const error = profileResult.error as unknown as AppError;
          if (error.statusCode === 404) {
            console.log(
              "[MerchantProvider] No profile found (404), creating new profile.",
            );

            // Create profile
            const logoUrl = (user as any)?.image || "";

            const privyUser = await privyClient.user.get();
            console.log(
              "[MerchantProvider] privyUser for profile creation:",
              privyUser,
            );

            let email = privyUser.user.id;
            const userEmail = privyUser.user.linked_accounts.find(
              (account) => account.type === "email",
            )?.address;

            if (userEmail) {
              email = userEmail;
            }

            const profilePayload = {
              email: email,
              display_name: email === privyUser.user.id ? null : email,
              description: "",
              logo_url: logoUrl,
              default_currency: "USD",
              default_language: (language ?? "EN").toUpperCase(),
              default_token_id: defaultToken?.key,
            };

            console.log(
              "[MerchantProvider] Creating profile with payload:",
              profilePayload,
            );

            const newProfile = await createProfile(profilePayload);
            if (newProfile && isMounted) {
              console.log("[MerchantProvider] Profile created:", newProfile);
              setMerchant(newProfile);
              setItem(MERCHANT_KEY, newProfile);
              showToast({
                type: "success",
                message: "Profile created successfully! Welcome to Rozo POS",
              });
            }
          } else {
            console.error("Profile fetch error:", error);
            const appError = error as unknown as AppError;

            // Don't show error toast for authentication issues if we have cached data
            if (appError.statusCode === 401 || appError.statusCode === 403) {
              console.warn(
                "Authentication error during profile fetch, using cached data if available",
              );
            } else {
              showToast({
                type: "danger",
                message: "Failed to load merchant profile",
              });
            }
          }
          setIsMerchantLoading(false);
        }
      } catch (error) {
        console.error("Merchant initialization error:", error);
        if (isMounted) {
          const appError = error as unknown as AppError;

          // Don't show error toast for authentication issues
          if (appError.statusCode === 401 || appError.statusCode === 403) {
            console.warn("Authentication error during merchant initialization");
          } else {
            showToast({
              type: "danger",
              message: "Failed to initialize merchant profile",
            });
          }
          hasInitialized.current = false; // Reset on error

          // Logout Privy
          await logoutPrivy();

          // Clear storage
          removeItem(TOKEN_KEY);
          removeItem(MERCHANT_KEY);
        }
      } finally {
        if (isMounted) {
          setIsMerchantLoading(false);
          console.log(
            "[MerchantProvider] Finished initializeMerchant, loading:",
            false,
          );
        }
      }
    };

    initializeMerchant();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, token, language]);

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
    [merchant, defaultCurrency, merchantToken, isMerchantLoading, setMerchant],
  );

  return (
    <MerchantContext.Provider value={contextValue}>
      {children}
    </MerchantContext.Provider>
  );
};

export const useMerchant = () => useContext(MerchantContext);
