import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({
  id: "rozo-pos",
  encryptionKey: process.env.EXPO_PUBLIC_MMKV_ENCRYPTION_KEY,
});

interface StorageItem<T> {
  data: T;
  expiresAt?: number;
}

export function getItem<T>(key: string): T | null {
  const value = storage.getString(key);
  if (!value) return null;

  try {
    const item: StorageItem<T> = JSON.parse(value);

    // Check if item has expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      // Remove expired item
      storage.delete(key);
      return null;
    }

    return item.data;
  } catch {
    // If parsing fails, return null and clean up
    storage.delete(key);
    return null;
  }
}

export async function setItem<T>(key: string, value: T, expiresInMs?: number) {
  const item: StorageItem<T> = {
    data: value,
    expiresAt: expiresInMs ? Date.now() + expiresInMs : undefined,
  };

  storage.set(key, JSON.stringify(item));
}

export async function removeItem(key: string) {
  storage.delete(key);
}

export function clearExpiredItems() {
  const keys = storage.getAllKeys();
  const now = Date.now();

  keys.forEach((key) => {
    const value = storage.getString(key);
    if (value) {
      try {
        const item: StorageItem<any> = JSON.parse(value);
        if (item.expiresAt && now > item.expiresAt) {
          storage.delete(key);
        }
      } catch {
        // Remove corrupted items
        storage.delete(key);
      }
    }
  });
}

export function isExpired(key: string): boolean {
  const value = storage.getString(key);
  if (!value) return true;

  try {
    const item: StorageItem<any> = JSON.parse(value);
    return item.expiresAt ? Date.now() > item.expiresAt : false;
  } catch {
    return true;
  }
}
