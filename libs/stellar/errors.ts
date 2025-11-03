/**
 * Stellar transaction result codes and their user-friendly messages
 */
export const STELLAR_ERROR_MESSAGES: Record<string, string> = {
  // Transaction-level errors
  tx_failed: "Transaction failed to execute",
  tx_too_early: "Transaction submitted too early",
  tx_too_late: "Transaction submitted too late",
  tx_missing_operation: "Transaction is missing operations",
  tx_bad_seq: "Transaction sequence number is incorrect",
  tx_bad_auth: "Transaction authentication failed",
  tx_insufficient_balance: "Insufficient balance to pay transaction fee",
  tx_no_source_account: "Source account not found",
  tx_insufficient_fee: "Transaction fee is too low",
  tx_bad_auth_extra: "Too many signatures or invalid signature",
  tx_internal_error: "Internal server error occurred",
  tx_not_supported: "Transaction type not supported",
  tx_fee_bump_inner_failed: "Fee bump inner transaction failed",
  tx_bad_sponsorship: "Invalid sponsorship",

  // Operation-level errors - Change Trust specific
  op_malformed: "Operation is malformed",
  op_underfunded: "Insufficient funds for operation",
  op_cross_self: "Cannot perform operation on self",
  op_not_supported: "Operation not supported",
  op_too_many_subentries: "Too many trustlines (maximum 1000 reached)",
  op_no_account: "Account does not exist",
  op_not_auth: "Operation not authorized",
  op_line_full: "Trustline limit would be exceeded",
  op_no_issuer: "Asset issuer does not exist",
  op_too_many_sponsors: "Too many sponsoring entries",
  op_bad_auth: "Invalid authorization",
  op_no_trust: "Trustline does not exist",
  op_low_reserve: "Account would go below minimum balance",

  // Change Trust specific errors
  change_trust_malformed: "Change trust operation is malformed",
  change_trust_no_issuer: "Asset issuer account does not exist",
  change_trust_invalid_limit: "Trust limit is invalid",
  change_trust_low_reserve:
    "Account would go below minimum balance after creating trustline",
  change_trust_self_not_allowed: "Cannot create trustline to self",
  change_trust_trust_line_missing: "Trustline does not exist",
  change_trust_cannot_delete: "Cannot delete trustline with non-zero balance",
  change_trust_not_auth_maintain_liabilities:
    "Not authorized to maintain liabilities",
};

/**
 * Get user-friendly error message from Stellar transaction result
 */
export function getStellarErrorMessage(result: any): string {
  try {
    // Check for transaction-level error
    if (result.result_code) {
      const txError = STELLAR_ERROR_MESSAGES[result.result_code];
      if (txError) {
        return txError;
      }
    }

    // Check for operation-level errors
    if (result.operations && Array.isArray(result.operations)) {
      for (const op of result.operations) {
        if (op.result_code && op.result_code !== "op_success") {
          const opError = STELLAR_ERROR_MESSAGES[op.result_code];
          if (opError) {
            return opError;
          }
        }
      }
    }

    // Check for extras with result_codes
    if (result.extras?.result_codes) {
      const codes = result.extras.result_codes;

      // Transaction result code
      if (codes.transaction) {
        const txError = STELLAR_ERROR_MESSAGES[codes.transaction];
        if (txError) {
          return txError;
        }
      }

      // Operation result codes
      if (codes.operations && Array.isArray(codes.operations)) {
        for (const opCode of codes.operations) {
          if (opCode !== "op_success") {
            const opError = STELLAR_ERROR_MESSAGES[opCode];
            if (opError) {
              return opError;
            }
          }
        }
      }
    }

    // Fallback to title or detail if available
    if (result.title) {
      return result.title;
    }

    if (result.detail) {
      return result.detail;
    }

    // Generic fallback
    return "Transaction failed for unknown reason";
  } catch (error) {
    console.error("Error parsing Stellar result:", error);
    return "Transaction failed - unable to parse error details";
  }
}

/**
 * Check if error is related to trustline already existing
 */
export function isTrustlineAlreadyExists(result: any): boolean {
  try {
    const codes = result.extras?.result_codes;
    if (codes?.operations) {
      return (
        codes.operations.includes("change_trust_already_exists") ||
        codes.operations.includes("op_line_full")
      );
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if error is related to insufficient balance
 */
export function isInsufficientBalance(result: any): boolean {
  try {
    const codes = result.extras?.result_codes;
    if (codes?.transaction) {
      return codes.transaction === "tx_insufficient_balance";
    }
    if (codes?.operations) {
      return (
        codes.operations.includes("op_underfunded") ||
        codes.operations.includes("change_trust_low_reserve")
      );
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if error is a 404 account not found error
 */
export function isAccountNotFound(error: any): boolean {
  try {
    // Check HTTP response status
    if (error.response?.status === 404) {
      return true;
    }

    // Check error message for 404 patterns
    if (
      error.message &&
      (error.message.includes("404") ||
        error.message.includes("not found") ||
        error.message.includes("Resource Missing"))
    ) {
      return true;
    }

    // Check error type for Horizon's specific 404 type
    if (error.type === "https://stellar.org/horizon-errors/not_found") {
      return true;
    }

    // Check status field
    if (error.status === 404) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
