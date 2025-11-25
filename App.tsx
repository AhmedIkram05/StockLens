import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { initDatabase, databaseService } from './src/services/database';
import { ensureHistoricalPrefetch } from './src/services/dataService';

/**
 * App entrypoint.
 *
 * - Initializes the local SQLite schema via `initDatabase`.
 * - Starts a best-effort historical prefetch and prunes stale `alpha_cache`.
 * - Provides `ThemeProvider` and `AuthProvider` around `AppNavigator`.
 */

/**
 * Internal app content.
 *
 * Runs one-time startup effects (DB init, prefetch) and renders navigation.
 * Startup tasks are best-effort and do not block initial UI rendering.
 */
function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
      } catch (e) {
        // Swallow init errors to avoid blocking the UI; errors are logged elsewhere.
      }
      // Best-effort background prefetch and cache pruning.
      ensureHistoricalPrefetch();
      databaseService.pruneAlphaCacheOlderThan(180);
    })();
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

/**
 * Root App component.
 *
 * Wraps the app with `ThemeProvider` and `AuthProvider`.
 */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
