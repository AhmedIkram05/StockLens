/**
 * useBiometricAuth Hook/Utility
 * 
 * Provides biometric authentication (Face ID/Touch ID) functionality using expo-local-authentication.
 * Credentials are securely stored in iOS Keychain/Android Keystore via expo-secure-store.
 * 
 * Features:
 * - Hardware and enrollment checks
 * - Face ID/Touch ID authentication prompts
 * - Secure credential storage (email/password)
 * - Enable/disable biometric lock
 * 
 * Storage Keys:
 * - BIOMETRIC_ENABLED_KEY: '1' if biometric auth is enabled
 * - BIOMETRIC_CREDENTIALS_KEY: JSON string with { email, password }
 * 
 * Security:
 * - Credentials stored with ALWAYS_THIS_DEVICE_ONLY accessibility
 * - Data never leaves the secure keychain/keystore
 * - All methods handle errors gracefully with fallback returns
 * 
 * Functions exported:
 * - isBiometricAvailable(): Checks if device supports and has biometrics enrolled
 * - authenticateBiometric(): Prompts Face ID/Touch ID dialog
 * - saveBiometricCredentials(): Stores email/password securely
 * - getBiometricCredentials(): Retrieves stored credentials
 * - clearBiometricCredentials(): Deletes stored credentials
 * - setBiometricEnabled/isBiometricEnabled(): Manages enabled state
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

/**
 * Checks if biometric authentication is available on the device.
 * Requires both hardware support AND user enrollment (e.g., Face ID configured).
 * 
 * @returns True if biometric hardware exists and at least one biometric is enrolled
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return !!(hasHardware && isEnrolled);
  } catch (e) {
    return false;
  }
}

/**
 * Prompts the user to authenticate using Face ID or Touch ID.
 * Shows a native biometric dialog with the provided message.
 * 
 * @param promptMessage - Message displayed in the biometric dialog. Default: 'Authenticate'
 * @returns Object with success boolean and optional error string
 */
export async function authenticateBiometric(promptMessage = 'Authenticate'): Promise<{ success: boolean; error?: string }> {
  try {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (e) {}

    const res = await LocalAuthentication.authenticateAsync({ promptMessage });
    if (res.success) return { success: true };
    return { success: false, error: res.error ?? 'Authentication failed' };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Unknown error' };
  }
}

/**
 * Securely stores user credentials for biometric unlock.
 * Stores as JSON in iOS Keychain/Android Keystore.
 * Also sets the biometric_enabled flag to '1'.
 * 
 * @param email - User email address
 * @param password - User password (plain text - will be stored securely)
 */
export async function saveBiometricCredentials(email: string, password: string): Promise<void> {
  const payload = JSON.stringify({ email, password });
  await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, payload, {
    keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
  });
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, '1', {
    keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
  });
}

/**
 * Retrieves stored credentials from secure storage.
 * Used for credential-based unlock as fallback to biometric auth.
 * 
 * @returns Object with email and password, or null if not found
 */
export async function getBiometricCredentials(): Promise<{ email: string; password: string } | null> {
  try {
    const raw = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Deletes stored credentials and disables biometric authentication.
 * Removes both the credentials and the enabled flag from secure storage.
 */
export async function clearBiometricCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
}

/**
 * Sets the biometric enabled state.
 * If false, deletes the enabled flag (disables biometric lock).
 * If true, stores '1' in secure storage (enables biometric lock).
 * 
 * @param enabled - True to enable biometric auth, false to disable
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  if (!enabled) {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    return;
  }
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, '1', {
    keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
  });
}

/**
 * Checks if biometric authentication is currently enabled.
 * 
 * @returns True if biometric_enabled flag exists in secure storage
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const v = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return !!v;
  } catch (e) {
    return false;
  }
}

export default {
  isBiometricAvailable,
  authenticateBiometric,
  saveBiometricCredentials,
  getBiometricCredentials,
  clearBiometricCredentials,
  setBiometricEnabled,
  isBiometricEnabled,
};
