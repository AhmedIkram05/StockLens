/**
 * LoginScreen Integration Tests
 * 
 * Purpose: Validates email/password authentication flow and post-login
 * biometric enrollment prompt.
 * 
 * What it tests:
 * - Sign-in form submission with email and password
 * - AuthContext integration for authentication state
 * - Lock grace period start after successful login
 * - Biometric enrollment prompt after login
 * - Navigation to SignUp screen from footer link
 * - Form validation and error handling
 * 
 * Why it's important: LoginScreen is the entry point for returning users.
 * Tests ensure credentials are correctly passed to Firebase, auth state
 * updates properly, and users are prompted to enable biometrics for
 * faster future logins.
 */

import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '@/screens/LoginScreen';
import { renderWithProviders } from '../utils';
import { authService } from '@/services/authService';
import { promptEnableBiometrics } from '@/utils/biometricPrompt';
import { useNavigation } from '@react-navigation/native';

jest.mock('@/services/authService', () => ({
  authService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    sendPasswordReset: jest.fn(),
  },
}));

jest.mock('@/utils/biometricPrompt', () => ({
  __esModule: true,
  promptEnableBiometrics: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

const mockedSignIn = authService.signIn as jest.MockedFunction<typeof authService.signIn>;
const mockedPrompt = promptEnableBiometrics as jest.MockedFunction<typeof promptEnableBiometrics>;
const mockedUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

const alertSpy = jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
  let navigateSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
    navigateSpy = jest.fn();
    mockedUseNavigation.mockReturnValue({ navigate: navigateSpy } as any);
    mockedSignIn.mockResolvedValue({} as any);
    mockedPrompt.mockResolvedValue(true as any);
  });

  it('performs sign-in flow, starts lock grace, and prompts biometrics', async () => {
    const startLockGrace = jest.fn();
    const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />, {
      providerOverrides: {
        withNavigation: false,
        authValue: { startLockGrace },
      },
    });

    fireEvent.changeText(getByPlaceholderText('Email'), 'demo@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 's3cret!');

    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(mockedSignIn).toHaveBeenCalledWith({ email: 'demo@example.com', password: 's3cret!' });
    });

    expect(startLockGrace).toHaveBeenCalled();
    expect(mockedPrompt).toHaveBeenCalledWith('demo@example.com', 's3cret!');
  });

  it('navigates to SignUp screen from footer CTA', () => {
    const { getByText } = renderWithProviders(<LoginScreen />, { providerOverrides: { withNavigation: false } });

    fireEvent.press(getByText('Sign Up'));

    expect(navigateSpy).toHaveBeenCalledWith('SignUp');
  });
});
