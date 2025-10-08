import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({
  id: "rozo-pos",
  encryptionKey: process.env.EXPO_PUBLIC_MMKV_ENCRYPTION_KEY,
});

export function getItem<T>(key: string): T | null {
  const value = storage.getString(key);
  return value ? (JSON.parse(value) as T) : null;
}

export async function setItem<T>(key: string, value: T) {
  storage.set(key, JSON.stringify(value));
}

export async function removeItem(key: string) {
  storage.delete(key);
}
