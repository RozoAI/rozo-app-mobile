import axios from "axios";
import axiosRetry from "axios-retry";

import { TOKEN_KEY } from "@/libs/constants";
import { AppError } from "@/libs/error";
import { storage } from "@/libs/storage";

export const client = axios.create({
  timeout: 20 * 1000,
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

    throw new AppError(errorMessage, statusCode, errorData);
  }
);
