import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { useStellar } from "@/providers/stellar.provider";
import { InfoIcon } from "lucide-react-native";
import React from "react";

export const StellarWalletStatusInformation: React.FC = () => {
  const { account, hasUsdcTrustline } = useStellar();

  if (account && hasUsdcTrustline) return null;

  return (
    <Alert action="error" variant="solid" className="rounded-xl">
      <AlertIcon as={InfoIcon} />
      <AlertText className="text-xs" style={{ paddingRight: 20 }}>
        {account === null
          ? "Your Stellar wallet is not activated yet. Please send at least 1.5 XLM to this address to activate it. After activation, we will also add a USDC trustline for you."
          : `Your Stellar wallet needs a USDC trustline to receive USDC payments. Please click "Activate" button above.`}
      </AlertText>
    </Alert>
  );
};
