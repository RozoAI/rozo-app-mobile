import React from "react";

import { FocusAwareStatusBar } from "@/components/focus-aware-status-bar";
import { DiscoveryScreen } from "@/features/discovery/discovery-screen";

export default function DiscoveryPage() {
  return (
    <>
      <FocusAwareStatusBar />
      <DiscoveryScreen />
    </>
  );
}

