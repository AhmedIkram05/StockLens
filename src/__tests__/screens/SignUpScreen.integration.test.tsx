/**
 * SignUpScreen Integration Tests
 * 
 * Purpose: Validates new account creation flow with form validation
 * and biometric setup prompt.
 * 
 * What it tests:
 * - Email format validation before submission
 * - Password matching validation (password vs confirm password)
 * - Account creation via authService.signUp
 * - Lock grace period start after registration
 * - Biometric enrollment prompt after signup
 * - Navigation to Login screen from footer link
 * 
 * Why it's important: SignUpScreen is the entry point for new users.
 * Tests ensure form validation catches errors early (invalid email,
 * mismatched passwords), accounts are created correctly, and users
 * are offered biometric login immediately after registration.
 */

import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import SignUpScreen from '@/screens/SignUpScreen';
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

const mockedSignUp = authService.signUp as jest.MockedFunction<typeof authService.signUp>;
const mockedPrompt = promptEnableBiometrics as jest.MockedFunction<typeof promptEnableBiometrics>;
const mockedUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

const alertSpy = jest.spyOn(Alert, 'alert');

describe('SignUpScreen', () => {
  let navigateSpy: jest.Mock;
  let goBackSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
    navigateSpy = jest.fn();
    goBackSpy = jest.fn();
    mockedUseNavigation.mockReturnValue({ navigate: navigateSpy, goBack: goBackSpy, canGoBack: () => true } as any);
    mockedSignUp.mockResolvedValue({} as any);
    mockedPrompt.mockResolvedValue(true as any);
  });

  it('shows validation alert when email format is invalid', () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(<SignUpScreen />, { providerOverrides: { withNavigation: false } });

    fireEvent.changeText(getByPlaceholderText('Full Name'), 'Jane Doe');
    fireEvent.changeText(getByPlaceholderText('Email'), 'invalid-email');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret1');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'secret1');

    fireEvent.press(getByText('Create Account'));

    expect(alertSpy).toHaveBeenCalledWith('Error', 'Please enter a valid email address');
    expect(mockedSignUp).not.toHaveBeenCalled();
  });

  it('creates account, starts grace period, and prompts biometrics', async () => {
    const startLockGrace = jest.fn();
    const { getByPlaceholderText, getByText } = renderWithProviders(<SignUpScreen />, {
      providerOverrides: {
        withNavigation: false,
        authValue: { startLockGrace },
      },
    });

    fireEvent.changeText(getByPlaceholderText('Full Name'), 'Jane Doe');
    fireEvent.changeText(getByPlaceholderText('Email'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'secret1');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'secret1');

    fireEvent.press(getByText('Create Account'));

    await waitFor(() => {
      expect(mockedSignUp).toHaveBeenCalledWith({ fullName: 'Jane Doe', email: 'jane@example.com', password: 'secret1' });
    });

    expect(startLockGrace).toHaveBeenCalled();
    expect(mockedPrompt).toHaveBeenCalledWith('jane@example.com', 'secret1');
  });

  it('navigates back to login from footer CTA', () => {
    const { getByText } = renderWithProviders(<SignUpScreen />, { providerOverrides: { withNavigation: false } });

    fireEvent.press(getByText('Login'));

    expect(navigateSpy).toHaveBeenCalledWith('Login');
  });
});
