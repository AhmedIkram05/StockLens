/**
 * useDeviceAuth Hook/Utility
 * 
 * Provides device authentication (passcode/PIN) functionality using expo-local-authentication.
 * Credentials are securely stored in iOS Keychain/Android Keystore via expo-secure-store.
 * 
 * Features:
 * - Device authentication checks
 * - Device passcode authentication prompts
 * - Secure credential storage (email/password)
 * - Enable/disable device lock
 * 
 * Storage Keys:
 * - DEVICE_ENABLED_KEY: '1' if device auth is enabled
 * - DEVICE_CREDENTIALS_KEY: JSON string with { email, password }
 * 
 * Security:
 * - Credentials stored with ALWAYS_THIS_DEVICE_ONLY accessibility
 * - Data never leaves the secure keychain/keystore
 * - All methods handle errors gracefully with fallback returns
 * 
 * Functions exported:
 * - isDeviceAuthAvailable(): Checks if device supports authentication
 * - authenticateDevice(): Prompts device passcode dialog
 * - saveDeviceCredentials(): Stores email/password securely
 * - getDeviceCredentials(): Retrieves stored credentials
 * - clearDeviceCredentials(): Deletes stored credentials
 * - setDeviceEnabled/isDeviceEnabled(): Manages enabled state
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ENABLED_KEY = 'device_enabled';
const DEVICE_CREDENTIALS_KEY = 'device_credentials';

/**
 * Checks if device authentication is available on the device.
 * Requires device to have authentication capability (passcode/PIN).
 * 
 * @returns True if device has authentication capability
 */
export async function isDeviceAuthAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    return !!hasHardware;
  } catch (e) {
    return false;
  }
}

/**
 * Prompts the user to authenticate using device passcode.
 * Shows a native authentication dialog with the provided message.
 * 
 * @param promptMessage - Message displayed in the authentication dialog. Default: 'Authenticate'
 * @returns Object with success boolean and optional error string
 */
export async function authenticateDevice(promptMessage = 'Authenticate'): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await LocalAuthentication.authenticateAsync({ promptMessage, disableDeviceFallback: false });
    if (res.success) return { success: true };
    return { success: false, error: res.error ?? 'Authentication failed, please try again.' };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Unknown error' };
  }
}

/**
 * Securely stores user credentials for device unlock.
 * Stores as JSON in iOS Keychain/Android Keystore.
 * Also sets the device_enabled flag to '1'.
 * 
 * @param email - User email address
 * @param password - User password (plain text - will be stored securely)
 */
export async function saveDeviceCredentials(email: string, password: string): Promise<void> {
  const payload = JSON.stringify({ email, password });
  await SecureStore.setItemAsync(DEVICE_CREDENTIALS_KEY, payload, {
    keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
  });
  await SecureStore.setItemAsync(DEVICE_ENABLED_KEY, '1', {
    keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
  });
}

/**
 * Retrieves stored credentials from secure storage.
 * Used for credential-based unlock as fallback to device auth.
 * 
 * @returns Object with email and password, or null if not found
 */
export async function getDeviceCredentials(): Promise<{ email: string; password: string } | null> {
  try {
    const raw = await SecureStore.getItemAsync(DEVICE_CREDENTIALS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Deletes stored credentials and disables device authentication.
 * Removes both the credentials and the enabled flag from secure storage.
 */
export async function clearDeviceCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(DEVICE_CREDENTIALS_KEY);
  await SecureStore.deleteItemAsync(DEVICE_ENABLED_KEY);
}

/**
 * Sets the device enabled state.
 * If false, deletes the enabled flag (disables device lock).
 * If true, stores '1' in secure storage (enables device lock).
 * 
 * @param enabled - True to enable device auth, false to disable
 */
export async function setDeviceEnabled(enabled: boolean): Promise<void> {
  if (!enabled) {
    await SecureStore.deleteItemAsync(DEVICE_ENABLED_KEY);
    return;
  }
  await SecureStore.setItemAsync(DEVICE_ENABLED_KEY, '1', {
    keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
  });
}

/**
 * Checks if device authentication is currently enabled.
 * 
 * @returns True if device_enabled flag exists in secure storage
 */
export async function isDeviceEnabled(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(DEVICE_ENABLED_KEY);
    return !!v;
  } catch (e) {
    return false;
  }
}

export default {
  isDeviceAuthAvailable,
  authenticateDevice,
  saveDeviceCredentials,
  getDeviceCredentials,
  clearDeviceCredentials,
  setDeviceEnabled,
  isDeviceEnabled,
};
