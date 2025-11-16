/**
 * useBiometricAuth Unit Tests
 *
 * Purpose: Verify biometric-related helper functions used by the app.
 * These tests validate hardware checks, authentication flows, secure
 * credential storage, and the enabled flag handling.
 *
 * Why: Biometric features interact with device APIs and secure storage;
 * unit tests ensure logic behaves as expected without touching real
 * hardware or keychains.
 */

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
  // Ensure a clean mock state before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * isBiometricAvailable
   * - Verifies detection logic for biometric hardware and enrollment status.
   * - Tests both positive and negative hardware/enrollment combinations.
   */
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

  /**
   * authenticateBiometric
   * - Simulates user biometric authentication and verifies returned results
   *   and the arguments passed into the native API wrapper.
   */
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

  /**
   * Credential storage helpers
   * - Ensures credentials are securely saved/retrieved via SecureStore
   * - Ensures clearing credentials also removes the enabled flag
   */
  describe('credential storage', () => {
    it('saves and retrieves credentials securely', async () => {
      await saveBiometricCredentials('user@example.com', 'pass123');

      // Verify SecureStore called with serialized credentials and proper options
      expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(
        'biometric_credentials',
        JSON.stringify({ email: 'user@example.com', password: 'pass123' }),
        { keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY }
      );

      // Simulate stored value and verify retrieval parsing
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

  /**
   * Enabled flag helpers
   * - Tests saving and reading the biometric enabled flag
   */
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
