import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ThemeProvider, useTheme, brandColors } from '@/contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when useTheme is used outside provider', () => {
    expect(() => renderHook(() => useTheme(), { wrapper: ({ children }) => <>{children}</> })).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
  });

  it('provides light theme defaults and toggles to dark mode', async () => {
    const getItemAsync = jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue('light');
    const setItemAsync = jest.spyOn(SecureStore, 'setItemAsync').mockResolvedValue();

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    await waitFor(() => {
      expect(getItemAsync).toHaveBeenCalled();
    });

    expect(result.current.theme.background).toBe(brandColors.gray);
    expect(result.current.mode).toBe('light');

    await act(async () => {
      await result.current.setMode('dark');
    });

    expect(setItemAsync).toHaveBeenCalledWith('theme_mode', 'dark');
    await waitFor(() => {
      expect(result.current.mode).toBe('dark');
      expect(result.current.theme.background).toBe(brandColors.black);
    });

    getItemAsync.mockRestore();
    setItemAsync.mockRestore();
  });

  it('restores persisted mode on mount', async () => {
    jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValueOnce('dark');

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    await waitFor(() => {
      expect(result.current.mode).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });
  });
});
