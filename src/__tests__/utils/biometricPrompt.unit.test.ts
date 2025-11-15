import { Alert } from 'react-native';
import { promptEnableBiometrics } from '@/utils/biometricPrompt';
import * as biometric from '@/hooks/useBiometricAuth';

jest.mock('@/hooks/useBiometricAuth', () => ({
  isBiometricAvailable: jest.fn(),
  saveBiometricCredentials: jest.fn(),
  clearBiometricCredentials: jest.fn(),
}));

const alertSpy = jest.spyOn(Alert, 'alert');
const mockedBiometric = biometric as jest.Mocked<typeof biometric>;

describe('biometricPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
  });

  it('returns false when biometric hardware unavailable', async () => {
    mockedBiometric.isBiometricAvailable.mockResolvedValue(false);

    const result = await promptEnableBiometrics('user@example.com', 'pass123');

    expect(result).toBe(false);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows prompt when biometric available and saves on acceptance', async () => {
    mockedBiometric.isBiometricAvailable.mockResolvedValue(true);
    mockedBiometric.saveBiometricCredentials.mockResolvedValue(undefined);

    const promptPromise = promptEnableBiometrics('user@example.com', 'secret');

    await new Promise(resolve => setImmediate(resolve));

    expect(alertSpy).toHaveBeenCalledWith(
      'Enable Biometrics?',
      expect.any(String),
      expect.any(Array),
      expect.any(Object)
    );

    const alertCall = alertSpy.mock.calls[0];
    const buttons = alertCall[2] as any[];
    const yesButton = buttons.find(b => b.text === 'Yes');

    await yesButton.onPress();

    const result = await promptPromise;

    expect(mockedBiometric.saveBiometricCredentials).toHaveBeenCalledWith('user@example.com', 'secret');
    expect(result).toBe(true);
  });
});
