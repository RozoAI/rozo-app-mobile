import React from "react";

import { FocusAwareStatusBar } from "@/components/focus-aware-status-bar";
import { OrdersScreen } from "@/features/orders/orders-screen";

export default function OrdersPage() {
  return (
    <>
      <FocusAwareStatusBar />
      <OrdersScreen />
    </>
  );
}
