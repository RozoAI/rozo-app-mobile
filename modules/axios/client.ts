import axios from "axios";
import axiosRetry from "axios-retry";

import { TOKEN_KEY } from "@/libs/constants";
import { AppError } from "@/libs/error/error";
import { storage } from "@/libs/storage";

export const client = axios.create({
  timeout: 2 * 60 * 1000,
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

axiosRetry(client, { retries: 1 });

client.interceptors.request.use(async (config) => {
  const token = storage.getString(TOKEN_KEY);

  if (token) {
    // Token is now stored as plain string, no need to remove quotes
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Content-Type"] = "application/json";

  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const statusCode = error.response?.status || 500;
    const errorMessage =
      error.response?.data?.error || error.message || "Something went wrong";
    const errorData = error.response?.data;

    // Don't wrap merchant status errors (403 with PIN_BLOCKED/INACTIVE codes)
    // Let the profile API handle them directly
    if (statusCode === 403 && errorData?.code && ['PIN_BLOCKED', 'INACTIVE'].includes(errorData.code)) {
      return Promise.reject(error); // Preserve original error
    }

    // Don't wrap PIN validation errors (401 with attempts_remaining)
    // Preserve the validation response data for PIN operations
    if (statusCode === 401 && errorData && 'attempts_remaining' in errorData) {
      return Promise.reject(error); // Preserve original error
    }

    throw new AppError(errorMessage, statusCode, errorData);
  }
);
