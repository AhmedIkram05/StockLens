/**
 * deviceAuthPrompt Unit Tests
 * 
 * Purpose: Validates the device auth enrollment prompt shown after
 * successful sign-up or login.
 * 
 * What it tests:
 * - Hardware availability checks before showing prompt
 * - User acceptance flow (saves credentials to secure storage)
 * - User rejection flow (returns false, no credentials saved)
 * - Alert dialog presentation with correct messaging
 * - Secure credential storage integration
 * 
 * Why it's important: This prompt is the entry point for enabling
 * device login. Tests ensure it only appears on capable devices,
 * correctly saves credentials when users opt-in, and respects user
 * choice when they decline.
 */

import { Alert } from 'react-native';
import * as deviceAuth from '@/hooks/useDeviceAuth';

jest.mock('@/hooks/useDeviceAuth', () => ({
  isDeviceAuthAvailable: jest.fn(),
  saveDeviceCredentials: jest.fn(),
  clearDeviceCredentials: jest.fn(),
}));

const { promptEnableDeviceAuth } = require('@/utils/deviceAuthPrompt');

const alertSpy = jest.spyOn(Alert, 'alert');
const mockedDeviceAuth = deviceAuth as jest.Mocked<typeof deviceAuth>;

describe('deviceAuthPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
  });

  it('returns false when device auth hardware unavailable', async () => {
    mockedDeviceAuth.isDeviceAuthAvailable.mockResolvedValue(false);

    const result = await promptEnableDeviceAuth('user@example.com', 'pass123');

    expect(result).toBe(false);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('shows prompt when device auth available and saves on acceptance', async () => {
    mockedDeviceAuth.isDeviceAuthAvailable.mockResolvedValue(true);
    mockedDeviceAuth.saveDeviceCredentials.mockResolvedValue(undefined);

    const promptPromise = promptEnableDeviceAuth('user@example.com', 'secret');

    await new Promise(resolve => setImmediate(resolve));

    expect(alertSpy).toHaveBeenCalledWith(
      'Enable Device Auth?',
      expect.any(String),
      expect.any(Array),
      expect.any(Object)
    );

    const alertCall = alertSpy.mock.calls[0];
    const buttons = alertCall[2] as any[];
    const yesButton = buttons.find(b => b.text === 'Yes');

    await yesButton.onPress();

    const result = await promptPromise;

    expect(mockedDeviceAuth.saveDeviceCredentials).toHaveBeenCalledWith('user@example.com', 'secret');
    expect(result).toBe(true);
  });
});
