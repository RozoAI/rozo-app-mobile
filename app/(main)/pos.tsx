import React from "react";

import { FocusAwareStatusBar } from "@/components/focus-aware-status-bar";
import { PaymentScreen } from "@/features/payment";

export default function PosPage() {
  return (
    <>
      <FocusAwareStatusBar />
      <PaymentScreen />
    </>
  );
}
