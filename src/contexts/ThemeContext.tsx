import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorSchemeName } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  shadow: string;
}

export const lightTheme: ThemeColors = {
  primary: '#10b981', // green
  secondary: '#007AFF', // blue
  accent: '#007AFF', // blue
  error: '#FF3B30', // red
  background: '#f5f5f5', // lightGray
  surface: '#ffffff', // white
  text: '#000000', // black
  textSecondary: 'rgba(0, 0, 0, 0.6)', // subtleBlack
  border: 'rgba(0, 0, 0, 0.1)', // faintBlack
  shadow: '#000000',
};

export const darkTheme: ThemeColors = {
  primary: '#10b981', // keep green
  secondary: '#007AFF', // keep blue
  accent: '#007AFF', // keep blue
  error: '#FF3B30', // keep red
  background: '#000000ff', // black
  surface: '#1a1a1a', // dark gray
  text: '#ffffff', // white
  textSecondary: 'rgba(255, 255, 255, 0.6)', // muted white
  border: 'rgba(255, 255, 255, 0.1)', // faint white
  shadow: '#000000',
};

interface ThemeContextType {
  theme: ThemeColors;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark'].includes(savedMode)) {
          setModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference
  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  // Determine current theme
  const getCurrentTheme = (): ThemeColors => {
    return mode === 'dark' ? darkTheme : lightTheme;
  };

  const theme = getCurrentTheme();
  const isDark = theme === darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}