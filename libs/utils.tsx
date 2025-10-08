// eslint-disable-next-line import/no-named-as-default
import clsx, { type ClassValue } from "clsx";
import { t } from "i18next";
import { Dimensions, Linking, Platform } from "react-native";
import Toast from "react-native-toast-message";
import { twMerge } from "tailwind-merge";

import { currencies } from "@/libs/currencies";
import { type MerchantOrder } from "@/resources/schema/order";

// Platform
export const IS_IOS = Platform.OS === "ios";
export const IS_ANDROID = Platform.OS === "android";
export const IS_WEB = Platform.OS === "web";

// Dimensions
const { width, height } = Dimensions.get("screen");

export const WIDTH = width;
export const HEIGHT = height;

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const showToast = ({
  type = "info",
  message = "Something went wrong ",
  duration = 4000,
}: {
  type: "danger" | "success" | "info";
  message: string;
  duration?: number;
}) => {
  // Use different icon based on toast type
  // const iconMap = {
  //   danger: <AlertCircle />,
  //   success: <CheckCircle />,
  //   warning: <AlertTriangle />,
  //   info: <Info />,
  // };

  Toast.show({
    type: type === "danger" ? "error" : type,
    text1: t(`toast.${type}`),
    text2: message,
    visibilityTime: duration,
    swipeable: true,
    autoHide: true,
    position: "top",
    text2Style: {
      fontSize: 14,
      flexShrink: 1,
      flexWrap: "wrap",
      textOverflow: "unset",
      overflow: "visible",
      paddingBottom: 10,
      lineHeight: 18,

      // @ts-ignore
      whiteSpace: "pre-wrap",
      // @ts-ignore
      overflowWrap: "break-word",
    },
    text1Style: {
      paddingTop: 10,
      paddingBottom: 5,
      fontSize: 16,
    },
  });
};

export function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then((canOpen) => canOpen && Linking.openURL(url));
}

export const formatAmount = (
  amountUnits: string,
  tokenSymbol: string
): string => {
  // Convert from smallest unit (wei-like) to readable format
  // This is a simplified conversion - you might need more sophisticated logic
  const amount = Number.parseFloat(amountUnits) / Math.pow(10, 18); // Assuming 18 decimals
  return `${amount.toFixed(4)} ${tokenSymbol}`;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const getChainName = (chainId: number | string): string => {
  const id = typeof chainId === "string" ? Number.parseInt(chainId) : chainId;
  switch (id) {
    case 1:
      return "Ethereum";
    case 137:
      return "Polygon";
    case 56:
      return "BSC";
    case 43114:
      return "Avalanche";
    default:
      return `Chain ${id}`;
  }
};

export function formatCurrency(
  amount: string | number,
  currencyCode: string = "USD"
): string {
  const config = currencies[currencyCode] || currencies.USD;
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return `0 ${config.code}`;

  const toFixed = (n: number, fixed: number) =>
    ~~(Math.pow(10, fixed) * n) / Math.pow(10, fixed);

  const parts = String(toFixed(numAmount, 2)).split(".");
  const integerPart = parts[0].replace(
    /\B(?=(\d{3})+(?!\d))/g,
    config.thousandSeparator
  );
  const decimalPart = parts[1] || "00";

  return `${integerPart}${config.decimalSeparator}${decimalPart} ${config.code}`;
}

export const getStatusActionType = (
  status: MerchantOrder["status"]
): "success" | "error" | "warning" | "info" | "muted" => {
  const statusMap: Record<
    MerchantOrder["status"],
    "success" | "error" | "warning" | "info" | "muted"
  > = {
    COMPLETED: "success",
    PROCESSING: "info",
    PENDING: "warning",
    FAILED: "error",
    DISCREPANCY: "warning",
  };

  return statusMap[status] || "muted";
};

export const getShortId = (
  text: string,
  prefixLength = 4,
  suffixLength: number | null = null
): string => {
  if (!text) return "";
  if (suffixLength === null) {
    if (text.length <= prefixLength) return text;
    return text.slice(0, prefixLength);
  }
  if (text.length <= prefixLength + suffixLength) return text;
  return `${text.slice(0, prefixLength)}...${text.slice(-suffixLength)}`;
};

/**
 * Check if a date is today
 * @param date - The date to check
 * @returns True if the date is today, false otherwise
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const getRedirectUri = (path: string) => {
  if (!process.env.EXPO_PUBLIC_APP_URL || Platform.OS !== "web") return "";

  return `${process.env.EXPO_PUBLIC_APP_URL}${path}`;
};
