import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

jest.mock('@/services/firebase', () => ({
  getAuthInstance: jest.fn(async () => ({ currentUser: null })),
}));

jest.mock('firebase/auth', () => {
  const { act } = require('@testing-library/react-native');
  return {
    onAuthStateChanged: jest.fn((_auth, callback) => {
      act(() => {
        callback(null);
      });
      return jest.fn();
    }),
    signOut: jest.fn(async () => {}),
    signInWithEmailAndPassword: jest.fn(async () => ({ user: { uid: 'uid-1' } })),
  };
});

jest.mock('@/services/dataService', () => ({
  userService: {
    getByUid: jest.fn(async () => ({ uid: 'uid-1', email: 'demo@example.com' })),
    upsert: jest.fn(async () => 1),
  },
}));

jest.mock('@/hooks/useBiometricAuth', () => ({
  isBiometricAvailable: jest.fn(async () => true),
  isBiometricEnabled: jest.fn(async () => true),
  authenticateBiometric: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/contexts/ThemeContext', () => {
  const actual = jest.requireActual('@/contexts/ThemeContext');
  return {
    ...actual,
    useTheme: () => ({ setMode: jest.fn() }),
  };
});

describe('AuthContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('throws when useAuth is used outside provider', () => {
    expect(() => renderHook(() => useAuth(), { wrapper: ({ children }) => <>{children}</> })).toThrow(
      'useAuth must be used within an AuthProvider'
    );
  });

  it('provides unlocked state when biometrics succeed', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {});

    await act(async () => {
      await result.current.unlockWithBiometrics();
    });

    expect(result.current.locked).toBe(false);
  });

  it('signs out and resets lock state', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {});

    await act(async () => {
      await result.current.signOutUser();
    });

    expect(result.current.locked).toBe(false);
  });

  it('unlockWithCredentials verifies credentials via Firebase', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {});

    await act(async () => {
      const success = await result.current.unlockWithCredentials('demo@example.com', 'password');
      expect(success).toBe(true);
    });
  });
});