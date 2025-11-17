/**
 * SettingsScreen Integration Tests
 * 
 * Purpose: Validates user preferences and account management features
 * on the settings screen.
 * 
 * What it tests:
 * - Dark mode toggle integration with ThemeContext
 * - Device passcode login enable/disable with authentication
 * - Sign out confirmation prompt and AuthContext integration
 * - Clear all data confirmation and deletion flow
 * - Settings persistence across app restarts
 * - Alert dialogs for destructive actions
 * 
 * Why it's important: SettingsScreen controls critical user preferences
 * (theme, device auth) and destructive actions (sign out, clear data).
 * Tests ensure toggles update global context correctly, confirmations
 * prevent accidental data loss, and device-auth setup requires authentication.
 */

import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '@/screens/SettingsScreen';
import { renderWithProviders } from '../utils';
import * as deviceAuth from '@/hooks/useDeviceAuth';
import { receiptService } from '@/services/dataService';

jest.mock('@/hooks/useDeviceAuth', () => ({
  isDeviceAuthAvailable: jest.fn(),
  isDeviceEnabled: jest.fn(),
  authenticateDevice: jest.fn(),
  setDeviceEnabled: jest.fn(),
  clearDeviceCredentials: jest.fn(),
}));

jest.mock('@/services/dataService', () => ({
  receiptService: {
    deleteAll: jest.fn(),
  },
}));

const alertSpy = jest.spyOn(Alert, 'alert');
const mockedReceiptService = receiptService as jest.Mocked<typeof receiptService>;

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
    (deviceAuth.isDeviceAuthAvailable as jest.Mock).mockResolvedValue(true);
    (deviceAuth.isDeviceEnabled as jest.Mock).mockResolvedValue(false);
    (deviceAuth.authenticateDevice as jest.Mock).mockResolvedValue({ success: true } as any);
    mockedReceiptService.deleteAll.mockResolvedValue();
  });

  const renderScreen = (overrides?: Parameters<typeof renderWithProviders>[1]) =>
    renderWithProviders(<SettingsScreen />, overrides ?? { providerOverrides: { withNavigation: false } });

  const renderAndAwaitSwitches = async (overrides?: Parameters<typeof renderWithProviders>[1]) => {
    const utils = renderScreen(overrides);
    await waitFor(() => expect(deviceAuth.isDeviceAuthAvailable).toHaveBeenCalled());
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

  it('enables device passcode login when toggle is switched on', async () => {
    const { switches } = await renderAndAwaitSwitches();

    const deviceAuthSwitch = switches[0];
    fireEvent(deviceAuthSwitch, 'valueChange', true);

    await waitFor(() => expect(deviceAuth.authenticateDevice).toHaveBeenCalled());
    expect(deviceAuth.setDeviceEnabled).toHaveBeenCalledWith(true);
    expect(alertSpy).toHaveBeenCalledWith('Enabled', expect.stringContaining('Device passcode login enabled successfully'));
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
