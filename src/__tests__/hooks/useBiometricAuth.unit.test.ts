import { renderHook } from '@testing-library/react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import {
  isBiometricAvailable,
  authenticateBiometric,
  saveBiometricCredentials,
  getBiometricCredentials,
  clearBiometricCredentials,
  setBiometricEnabled,
  isBiometricEnabled,
} from '@/hooks/useBiometricAuth';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  ALWAYS_THIS_DEVICE_ONLY: 'ALWAYS_THIS_DEVICE_ONLY',
}));

const mockedLocalAuth = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;
const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('useBiometricAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBiometricAvailable', () => {
    it('returns true when hardware exists and biometrics enrolled', async () => {
      mockedLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockedLocalAuth.isEnrolledAsync.mockResolvedValue(true);

      const result = await isBiometricAvailable();

      expect(result).toBe(true);
    });

    it('returns false when hardware missing or not enrolled', async () => {
      mockedLocalAuth.hasHardwareAsync.mockResolvedValue(false);
      mockedLocalAuth.isEnrolledAsync.mockResolvedValue(true);

      const result = await isBiometricAvailable();

      expect(result).toBe(false);
    });
  });

  describe('authenticateBiometric', () => {
    it('returns success when authentication succeeds', async () => {
      mockedLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([]);
      mockedLocalAuth.authenticateAsync.mockResolvedValue({ success: true } as any);

      const result = await authenticateBiometric('Test prompt');

      expect(result.success).toBe(true);
      expect(mockedLocalAuth.authenticateAsync).toHaveBeenCalledWith({ promptMessage: 'Test prompt' });
    });

    it('returns failure when authentication fails', async () => {
      mockedLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([]);
      mockedLocalAuth.authenticateAsync.mockResolvedValue({ success: false, error: 'User canceled' } as any);

      const result = await authenticateBiometric();

      expect(result.success).toBe(false);
      expect(result.error).toBe('User canceled');
    });
  });

  describe('credential storage', () => {
    it('saves and retrieves credentials securely', async () => {
      await saveBiometricCredentials('user@example.com', 'pass123');

      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
        'biometric_credentials',
        JSON.stringify({ email: 'user@example.com', password: 'pass123' }),
        { keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY }
      );

      mockedSecureStore.getItemAsync.mockResolvedValue(
        JSON.stringify({ email: 'user@example.com', password: 'pass123' })
      );

      const result = await getBiometricCredentials();

      expect(result).toEqual({ email: 'user@example.com', password: 'pass123' });
    });

    it('clears credentials and disables biometric', async () => {
      await clearBiometricCredentials();

      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('biometric_credentials');
      expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('biometric_enabled');
    });
  });

  describe('enabled state', () => {
    it('manages biometric enabled flag', async () => {
      await setBiometricEnabled(true);
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('biometric_enabled', '1', expect.any(Object));

      mockedSecureStore.getItemAsync.mockResolvedValue('1');
      const result = await isBiometricEnabled();
      expect(result).toBe(true);
    });
  });
});
