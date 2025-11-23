/**
 * Key Manager - Secure key storage for app encryption
 *
 * This module centralises generation and retrieval of the app-wide AES-256
 * encryption key. The key itself is stored in the platform-provided secure
 * keystore/keychain via `expo-secure-store`. Large data (images, DB fields)
 * are encrypted with this key by other helpers; the key is never exported in
 * plaintext except within the running process.
 *
 * Exports:
 * - getOrCreateKey(): Promise<string>  — returns a base64-encoded 32-byte key
 * - clearKey(): Promise<void>           — delete the stored key from keystore
 */
import * as SecureStore from 'expo-secure-store';
import { generateKeyBase64 } from '@/utils/crypto';

const KEY_NAME = 'stocklens_encryption_key_v1';

/**
 * getOrCreateKey
 *
 * Retrieves the base64-encoded AES key from SecureStore or generates a new
 * one if none exists. The key is generated with a secure RNG and encoded as
 * base64 for storage. The function guarantees a non-null string result.
 *
 * @returns Promise<string> - base64 encoded 32-byte AES key
 */
export async function getOrCreateKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(KEY_NAME);
  if (!key) {
    key = generateKeyBase64();
    try {
      await SecureStore.setItemAsync(KEY_NAME, key as string, { keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY });
    } catch (e) {
      // ignore store errors; fall back to in-memory (not ideal)
    }
  }
  return key as string;
}

/**
 * clearKey
 *
 * Removes the stored encryption key from SecureStore. Use with caution — once
 * removed, previously encrypted data cannot be decrypted unless a backup exists.
 */
export async function clearKey(): Promise<void> {
  try { await SecureStore.deleteItemAsync(KEY_NAME); } catch (e) {}
}

export default { getOrCreateKey, clearKey };
