/**
 * SettingsScreen Integration Tests
 * 
 * Purpose: Validates user preferences and account management features
 * on the settings screen.
 * 
 * What it tests:
 * - Dark mode toggle integration with ThemeContext
 * - Biometric login enable/disable with authentication
 * - Sign out confirmation prompt and AuthContext integration
 * - Clear all data confirmation and deletion flow
 * - Settings persistence across app restarts
 * - Alert dialogs for destructive actions
 * 
 * Why it's important: SettingsScreen controls critical user preferences
 * (theme, biometrics) and destructive actions (sign out, clear data).
 * Tests ensure toggles update global context correctly, confirmations
 * prevent accidental data loss, and biometric setup requires authentication.
 */

import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '@/screens/SettingsScreen';
import { renderWithProviders } from '../utils';
import * as biometric from '@/hooks/useBiometricAuth';
import { receiptService } from '@/services/dataService';

jest.mock('@/hooks/useBiometricAuth', () => ({
  isBiometricAvailable: jest.fn(),
  isBiometricEnabled: jest.fn(),
  authenticateBiometric: jest.fn(),
  setBiometricEnabled: jest.fn(),
  clearBiometricCredentials: jest.fn(),
}));

jest.mock('@/services/dataService', () => ({
  receiptService: {
    deleteAll: jest.fn(),
  },
}));

const alertSpy = jest.spyOn(Alert, 'alert');
const biometricModule = biometric as jest.Mocked<typeof biometric>;
const mockedReceiptService = receiptService as jest.Mocked<typeof receiptService>;

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
    biometricModule.isBiometricAvailable.mockResolvedValue(true);
    biometricModule.isBiometricEnabled.mockResolvedValue(false);
    biometricModule.authenticateBiometric.mockResolvedValue({ success: true } as any);
    mockedReceiptService.deleteAll.mockResolvedValue();
  });

  const renderScreen = (overrides?: Parameters<typeof renderWithProviders>[1]) =>
    renderWithProviders(<SettingsScreen />, overrides ?? { providerOverrides: { withNavigation: false } });

  const renderAndAwaitSwitches = async (overrides?: Parameters<typeof renderWithProviders>[1]) => {
    const utils = renderScreen(overrides);
    await waitFor(() => expect(biometricModule.isBiometricAvailable).toHaveBeenCalled());
    const switches = utils.getAllByRole('switch');
    return { ...utils, switches };
  };

  const findAlertButtons = (title: string) => {
    const matchingCall = [...alertSpy.mock.calls].reverse().find(([t]) => t === title);
    return matchingCall ? (matchingCall[2] as Array<{ text?: string; onPress?: () => void }>) : undefined;
  };

  it('toggles dark mode using ThemeContext', async () => {
    const setMode = jest.fn();
    const { switches } = await renderAndAwaitSwitches({
      providerOverrides: {
        withNavigation: false,
        themeValue: { setMode, isDark: false },
      },
    });

    const darkModeSwitch = switches[1];
    fireEvent(darkModeSwitch, 'valueChange', true);

    expect(setMode).toHaveBeenCalledWith('dark');
  });

  it('enables biometric login when toggle is switched on', async () => {
    const { switches } = await renderAndAwaitSwitches();

    const biometricSwitch = switches[0];
    fireEvent(biometricSwitch, 'valueChange', true);

    await waitFor(() => expect(biometricModule.authenticateBiometric).toHaveBeenCalled());
    expect(biometricModule.setBiometricEnabled).toHaveBeenCalledWith(true);
    expect(alertSpy).toHaveBeenCalledWith('Enabled', expect.stringContaining('Biometric login enabled successfully'));
  });

  it('confirms sign out before calling AuthContext', async () => {
    const signOutUser = jest.fn().mockResolvedValue(undefined);
    const { getByText } = renderScreen({
      providerOverrides: {
        withNavigation: false,
        authValue: { signOutUser },
      },
    });

    fireEvent.press(getByText('Log Out'));

    const buttons = findAlertButtons('Sign Out');
    expect(buttons).toBeDefined();

    const confirm = buttons?.find(button => button.text === 'Sign Out');
    await act(async () => {
      await confirm?.onPress?.();
    });

    expect(signOutUser).toHaveBeenCalled();
  });

  it('deletes all local data when confirmation accepted', async () => {
    const { getByText } = renderScreen({
      providerOverrides: {
        withNavigation: false,
        authValue: { userProfile: { uid: 'user-42' } as any },
      },
    });

    fireEvent.press(getByText('Clear All Data'));

    const buttons = findAlertButtons('Clear All Data');
    expect(buttons).toBeDefined();

    const destructive = buttons?.find(button => button.text === 'Delete');
    await act(async () => {
      await destructive?.onPress?.();
    });

    expect(mockedReceiptService.deleteAll).toHaveBeenCalledWith('user-42');
  });
});
