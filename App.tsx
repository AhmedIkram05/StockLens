import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { initDatabase, databaseService } from './src/services/database';
import { ensureHistoricalPrefetch } from './src/services/dataService';

/**
 * App root component
 *
 * Responsibilities:
 * - Initialize application-wide services (database, prefetch tasks)
 * - Provide global context providers (Theme, Auth)
 * - Mount the main application navigator and status bar
 *
 * Lifecycle:
 * - On first mount the app runs `initDatabase()` to ensure the local SQLite
 *   schema exists and is migrated. This is a best-effort, idempotent operation.
 * - Kicks off a background historical data prefetch and prunes stale cache
 *   entries from the local alpha_cache table.
 *
 * Notes:
 * - initDatabase() is awaited inside an effect but errors are swallowed to
 *   avoid blocking the UI; errors will surface in logs for debugging.
 * - Database pruning and prefetching are intentionally best-effort to avoid
 *   impacting startup time.
 */

/**
 * Application content (internal)
 *
 * This component is mounted inside the global providers and is responsible
 * for running one-time startup effects (database initialization, prefetching)
 * and for rendering the main `AppNavigator` and `StatusBar`.
 *
 * It intentionally keeps side-effects minimal and best-effort so the UI can
 * render quickly even if background initialization fails.
 */
function AppContent() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Initialize the database when the app starts
    (async () => {
      try {
        await initDatabase();
      } catch (e) {
      }
      // Kick off the one-time historical prefetch (best-effort)
      ensureHistoricalPrefetch();
  // Prune old alpha_cache entries older than 180 days on startup (best-effort)
  databaseService.pruneAlphaCacheOlderThan(180);
    })();
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

/**
 * Root exported App component
 *
 * Wraps the application with Theme and Auth providers so context is available
 * throughout the component tree. The `AppContent` component is the logical
 * child that mounts navigation and performs startup initialization.
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
