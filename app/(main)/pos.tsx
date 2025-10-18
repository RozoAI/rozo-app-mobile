import React from "react";

import { FocusAwareStatusBar } from "@/components/focus-aware-status-bar";
import { PaymentScreen } from "@/features/payment";
import { usePOSToggle } from "@/providers/preferences.provider";
import { Redirect } from "expo-router";

export default function PosPage() {
  const { showPOS } = usePOSToggle();

  // Route Guard: Redirect to balance if POS is disabled
  if (!showPOS) {
    return <Redirect href="/(main)/balance" />;
  }

  return (
    <>
      <FocusAwareStatusBar />
      <PaymentScreen />
    </>
  );
}
