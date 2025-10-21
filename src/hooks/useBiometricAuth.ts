import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return !!(hasHardware && isEnrolled);
  } catch (e) {
    return false;
  }
}

export async function authenticateBiometric(promptMessage = 'Authenticate'): Promise<{ success: boolean; error?: string }> {
  try {
    // check available authentication types (useful for debugging and ensuring
    // the device supports Face ID / Touch ID). This does not change behavior
    // but helps determine why the system may be showing passcode only.
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      // types is an array of numbers; 1 == fingerprint, 2 == facial (platform dependent)
      // eslint-disable-next-line no-console
      console.debug('Supported auth types:', types);
    } catch (e) {
      // ignore
    }

    // Do not explicitly set a fallback label here. Let the OS decide whether to
    // show Face ID / Touch ID or device passcode. If you want to force biometrics
    // only (no passcode fallback), set `disableDeviceFallback: true`.
    const res = await LocalAuthentication.authenticateAsync({ promptMessage });
    if (res.success) return { success: true };
    return { success: false, error: res.error ?? 'Authentication failed' };
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Unknown error' };
  }
}

// Store simple email/password credentials (encrypted by SecureStore). For production consider
// storing a short-lived refresh token or a server-side key. This project uses credentials for
// convenience in the academic scope.
export async function saveBiometricCredentials(email: string, password: string): Promise<void> {
  const payload = JSON.stringify({ email, password });
  await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, payload, {
    keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
  });
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, '1', {
    keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
  });
}

export async function getBiometricCredentials(): Promise<{ email: string; password: string } | null> {
  try {
    const raw = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function clearBiometricCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  if (!enabled) {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    return;
  }
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, '1', {
    keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
  });
}

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
