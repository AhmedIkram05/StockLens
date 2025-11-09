/**
 * ThemeContext
 * 
 * Global theme management with light/dark mode support.
 * Theme preference is persisted using expo-secure-store for cross-session consistency.
 * 
 * Features:
 * - Two theme modes: 'light' and 'dark'
 * - Predefined color palettes for each mode
 * - Persistent theme storage (survives app restarts)
 * - Automatic loading of saved theme on app launch
 * 
 * Color Palette (Light Mode):
 * - Primary: #10b981 (green) - Used for CTAs, branding
 * - Secondary: #007AFF (blue) - Accent color
 * - Error: #FF3B30 (red) - Destructive actions
 * - Background: #f5f5f5 (light gray) - Page backgrounds
 * - Surface: #ffffff (white) - Cards, modals
 * - Text: #000000 (black) - Primary text
 * 
 * Color Palette (Dark Mode):
 * - Primary: #10b981 (green) - Consistent brand color
 * - Background: #000000 (black) - Page backgrounds
 * - Surface: #1a1a1a (dark gray) - Cards, modals
 * - Text: #ffffff (white) - Primary text
 * - Text on colored backgrounds inverts for contrast
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  /** Primary brand color (green) */
  primary: string;
  /** Secondary accent color (blue) */
  secondary: string;
  /** Error/destructive action color (red) */
  error: string;
  /** Page background color */
  background: string;
  /** Card/modal surface color */
  surface: string;
  /** Primary text color */
  text: string;
  /** Secondary/muted text color */
  textSecondary: string;
  /** Text color on colored backgrounds (inverts for contrast) */
  textOnColor: string;
  /** Border/divider color */
  border: string;
}

/** Light mode color palette following design system */
export const lightTheme: ThemeColors = {
  primary: '#10b981', // green
  secondary: '#007AFF', // blue
  error: '#FF3B30', // red
  background: '#f5f5f5', // lightGray
  surface: '#ffffff', // white
  text: '#000000', // black
  textSecondary: 'rgba(0, 0, 0, 0.6)', // subtleBlack
  textOnColor: '#ffffff', // white text on colored backgrounds
  border: '#0000001a', // faintBlack
};

/** Dark mode color palette following design system */
export const darkTheme: ThemeColors = {
  primary: '#10b981', // keep green
  secondary: '#007AFF', // keep blue
  error: '#FF3B30', // keep red
  background: '#000000ff', // black
  surface: '#1a1a1a', // dark gray
  text: '#ffffff', // white
  textSecondary: '#ffffff99', // muted white
  textOnColor: '#000000', // black text on colored backgrounds
  border: '#ffffff1a', // faint white
};

interface ThemeContextType {
  /** Current theme colors object (light or dark) */
  theme: ThemeColors;
  /** Current theme mode ('light' or 'dark') */
  mode: ThemeMode;
  /** Function to change theme mode and persist preference */
  setMode: (mode: ThemeMode) => void;
  /** Boolean flag for convenience (true if dark mode active) */
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme_mode';

/**
 * ThemeProvider Component
 * 
 * Wraps the app to provide theme context to all components.
 * Loads saved theme preference from secure storage on mount.
 * Persists theme changes to secure storage for cross-session consistency.
 * 
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

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

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

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

/**
 * useTheme Hook
 * 
 * Custom hook to access theme context from any component.
 * Provides current theme colors, mode, setMode function, and isDark flag.
 * Throws error if used outside ThemeProvider.
 * 
 * @returns Theme context with colors, mode, setMode, and isDark
 * 
 * @example
 * const { theme, isDark, setMode } = useTheme();
 * return (
 *   <View style={{ backgroundColor: theme.background }}>
 *     <Text style={{ color: theme.text }}>Hello</Text>
 *     <Switch value={isDark} onValueChange={(val) => setMode(val ? 'dark' : 'light')} />
 *   </View>
 * );
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}