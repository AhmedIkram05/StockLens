import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { initDatabase, databaseService } from './src/services/database';
import { ensureHistoricalPrefetch } from './src/services/dataService';

function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Initialize the database when the app starts
    (async () => {
      try {
        await initDatabase();
      } catch (e) {
        console.error(e);
      }
      // Kick off the one-time historical prefetch (best-effort)
      ensureHistoricalPrefetch().catch(err => console.warn('historical prefetch failed', err));
  // Prune old alpha_cache entries older than 180 days on startup (best-effort)
  databaseService.pruneAlphaCacheOlderThan(180).catch(err => console.warn('Alpha cache prune failed', err));
    })();
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
