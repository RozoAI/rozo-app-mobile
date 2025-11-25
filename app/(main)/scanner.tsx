import { FocusAwareStatusBar } from "@/components/focus-aware-status-bar";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { type DeeplinkData } from "@rozoai/deeplink-core";
import { ScanQrNative } from "@rozoai/deeplink-react-native";
import { CheckCircle, ScanLine } from "lucide-react-native";
import React, { useState } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

export default function ScannerScreen() {
  const colorScheme = useColorScheme();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<DeeplinkData | null>(null);

  // Handle QR code scan
  const handleScan = (data: DeeplinkData) => {
    console.log("Scanned QR Code:", data);
    setScannedData(data);
    setIsScanning(false);
  };

  // Handle scan error
  const handleError = (error: Error) => {
    console.error("QR Scan Error:", error);
    setIsScanning(false);
  };

  // Handle permission denied
  const handlePermissionDenied = () => {
    console.log("Camera permission denied");
    setIsScanning(false);
  };

  // Reset scanner
  const handleReset = () => {
    setScannedData(null);
    setIsScanning(true);
  };

  // Format scanned data for display
  const formatScannedData = (data: DeeplinkData) => {
    const formatted: Record<string, any> = {
      type: data.type,
    };

    if ("address" in data && data.address) {
      formatted.address = data.address;
    }

    if ("amount" in data && data.amount) {
      formatted.amount = data.amount;
    }

    if ("operation" in data && data.operation) {
      formatted.operation = data.operation;
    }

    if ("message" in data) {
      formatted.message = data.message;
    }

    if ("asset" in data && data.asset) {
      formatted.asset = data.asset;
    }

    if ("chain_id" in data && data.chain_id) {
      formatted.chain_id = data.chain_id;
    }

    if ("url" in data && data.url) {
      formatted.url = data.url;
    }

    return formatted;
  };

  return (
    <Box className="flex-1 bg-background-0">
      <FocusAwareStatusBar />

      {/* Start Screen / Result Screen */}
      {!scannedData ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={{ flex: 1 }}
        >
          <VStack
            className="flex-1 px-6 items-center justify-center"
            space="xl"
          >
            <Box className="w-24 h-24 bg-primary-500/10 rounded-full items-center justify-center">
              <ScanLine
                size={48}
                color={colorScheme === "dark" ? "#fff" : "#000"}
              />
            </Box>

            <VStack space="sm" className="items-center">
              <Heading size="xl" className="text-center">
                QR Code Scanner
              </Heading>
              <Text className="text-center text-typography-500 max-w-sm">
                Scan blockchain QR codes including Ethereum, Solana, and Stellar
                payment links
              </Text>
            </VStack>

            <Button
              onPress={() => setIsScanning(true)}
              className="w-full max-w-sm"
              size="lg"
            >
              <ButtonText>Start Scanning</ButtonText>
            </Button>
          </VStack>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={{ flex: 1 }}
        >
          <VStack
            className="flex-1 px-6 items-center justify-center"
            space="xl"
          >
            <Animated.View entering={FadeIn.delay(100).duration(400)}>
              <Box className="w-24 h-24 bg-success-500/10 rounded-full items-center justify-center">
                <CheckCircle size={48} color="#10b981" />
              </Box>
            </Animated.View>

            <VStack space="md" className="items-center">
              <Heading size="xl" className="text-center">
                Scan Successful!
              </Heading>
              <Text className="text-center text-typography-500">
                QR code data received
              </Text>
            </VStack>

            {/* Scanned Data Display */}
            <Box className="w-full max-w-sm bg-background-50 p-6 rounded-2xl border border-outline-200">
              <Text className="text-typography-400 text-xs uppercase font-semibold mb-3">
                Scanned Data
              </Text>
              <Text
                className="text-typography-900 font-mono text-sm break-words"
                selectable
              >
                {JSON.stringify(formatScannedData(scannedData), null, 2)}
              </Text>
            </Box>

            <VStack space="md" className="w-full max-w-sm">
              <Button onPress={handleReset} className="w-full" size="lg">
                <ButtonText>Scan Another</ButtonText>
              </Button>

              <Button
                onPress={() => setScannedData(null)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ButtonText>Clear</ButtonText>
              </Button>
            </VStack>
          </VStack>
        </Animated.View>
      )}

      {/* QR Scanner Modal */}
      <ScanQrNative
        isVisible={isScanning}
        onScan={handleScan}
        onError={handleError}
        onPermissionDenied={handlePermissionDenied}
        headerText="Scan QR Code"
        instructionText="Position the QR code within the frame to scan"
        retryButtonText="Scan Again"
      />
    </Box>
  );
}
