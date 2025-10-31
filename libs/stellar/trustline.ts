import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers";
import { useStellar } from "@/providers/stellar.provider";
import { useSignRawHash } from "@privy-io/expo/extended-chains";
import {
  Asset,
  BASE_FEE,
  Networks,
  Operation,
  Transaction,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { useCallback, useState } from "react";
import { getStellarErrorMessage, isTrustlineAlreadyExists } from "./errors";

export function useStellarTrustline() {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const { publicKey, server, refreshAccount, account } = useStellar();
  const { signRawHash } = useSignRawHash();
  const {
    error: toastError,
    success: toastSuccess,
    info: toastInfo,
  } = useToast();

  const [isEnabling, setIsEnabling] = useState(false);
  const [showInsufficientBalanceDialog, setShowInsufficientBalanceDialog] =
    useState(false);
  const [balanceInfo, setBalanceInfo] = useState<{
    current: number;
    required: number;
  }>({ current: 0, required: 1.5 });

  const enableUsdc = useCallback(async () => {
    // Check authentication state before proceeding
    if (!isAuthenticated || !user || !publicKey) {
      toastError("Please ensure you are logged in and try again");
      return;
    }

    // Check XLM balance before enabling USDC trustline
    if (account?.balances) {
      const nativeBalance = account.balances.find(
        (balance) => balance.asset_type === "native"
      );
      const xlmBalance = nativeBalance ? parseFloat(nativeBalance.balance) : 0;

      if (xlmBalance < 1.5) {
        setBalanceInfo({ current: xlmBalance, required: 1.5 });
        toastError(
          "Insuficient XLM Balance, please make sure at least 1.5 XLM"
        );
        setShowInsufficientBalanceDialog(true);
        return;
      }
    }

    setIsEnabling(true);
    try {
      if (!server) return;

      // Refresh account info to get latest sequence number
      const freshAccount = await server.loadAccount(publicKey);

      // Create changeTrust operation for USDC
      const changeTrustOp = Operation.changeTrust({
        asset: new Asset(
          "USDC",
          "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
        ),
      });

      // Build transaction with fresh account data
      const transaction = new TransactionBuilder(freshAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.PUBLIC,
      })
        .addOperation(changeTrustOp)
        .setTimeout(300)
        .build();

      const xdr = transaction.toXDR();
      console.log("Transaction XDR:", xdr);

      // // Parse the transaction from XDR
      const tx = new Transaction(xdr, Networks.PUBLIC);

      // Get the transaction hash for signing
      const transactionHash = tx.hash();
      console.log("Transaction hash:", transactionHash.toString("hex"));

      // Sign the transaction hash with Privy
      try {
        const { signature } = await signRawHash({
          address: publicKey,
          chainType: "stellar",
          hash: `0x${transactionHash.toString("hex")}`,
        });

        console.log("Signature:", signature);

        // Apply the signature to the transaction
        // Privy returns signature as hex string, convert to Buffer for Stellar
        const signatureBuffer = Buffer.from(signature.replace("0x", ""), "hex");
        tx.addSignature(publicKey, signatureBuffer.toString("base64"));
      } catch (signError: any) {
        console.error("Signing error:", signError);
        if (
          signError.message?.includes("authenticated") ||
          signError.message?.includes("User must be authenticated")
        ) {
          // Try to refresh user state first
          try {
            await refreshUser();
            toastError("Authentication expired. Please try again.");
          } catch {
            toastError(
              "Authentication expired. Please refresh the page and log in again."
            );
          }
          return;
        }
        throw signError;
      }

      // Submit the signed transaction to Stellar network
      if (server) {
        try {
          const result = await server.submitTransaction(tx);
          console.log("Transaction result:", result);

          if (result.successful) {
            toastSuccess("USDC trustline enabled successfully!");
            // Refresh account info to show the new trustline
            await refreshAccount();
          } else {
            console.log("Transaction failed result:", result);

            // Check if trustline already exists
            if (isTrustlineAlreadyExists(result)) {
              toastInfo("USDC trustline already exists on your account");
              await refreshAccount(); // Refresh to show existing trustline
              return; // Don't throw error for this case
            }

            // Get user-friendly error message
            const errorMessage = getStellarErrorMessage(result);
            console.log(errorMessage);
            throw new Error(errorMessage);
          }
        } catch (errors: any) {
          console.log(errors);
          const errorMessage = getStellarErrorMessage(errors?.response?.data);
          console.log(errorMessage);
          throw new Error(errorMessage);
        }
      } else {
        throw new Error("Stellar server not available");
      }
    } catch (error: any) {
      console.error("Error enabling USDC:", error);
      toastError(error.message || "Failed to enable USDC");
    } finally {
      setIsEnabling(false);
    }
  }, [isAuthenticated, user, publicKey, account, server]);

  return {
    isEnabling,
    enableUsdc,
    showInsufficientBalanceDialog,
    setShowInsufficientBalanceDialog,
    balanceInfo,
  };
}
