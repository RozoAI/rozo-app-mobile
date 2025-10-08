import React from "react";

import { FocusAwareStatusBar } from "@/components/focus-aware-status-bar";
import { BalanceScreen } from "@/features/balance/balance-screen";

export default function BalancePage() {
  return (
    <>
      <FocusAwareStatusBar />
      <BalanceScreen />
    </>
  );
}
