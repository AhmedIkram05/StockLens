/**
 * AuthContext
 * 
 * Global authentication state management using React Context API and Firebase Auth.
 * Provides user authentication, profile management, and biometric lock functionality.
 * 
 * Features:
 * - Firebase Authentication integration with onAuthStateChanged listener
 * - User profile management (Firestore sync)
 * - Biometric lock/unlock (Face ID/Touch ID)
 * - App state monitoring for auto-lock on background
 * - Credential-based unlock fallback
 * 
 * State:
 * - user: Firebase User object (null if unauthenticated)
 * - userProfile: Local user profile from Firestore
 * - loading: True during initial auth check
 * - locked: True when biometric lock is active
 * 
 * Methods:
 * - signOutUser: Signs out from Firebase and clears local state
 * - unlockWithBiometrics: Attempts Face ID/Touch ID unlock
 * - unlockWithCredentials: Validates email/password from secure storage
 * - markSignedIn: Flags recent sign-in to prevent immediate lock
 * 
 * Auto-lock behavior:
 * - When app goes to background, sets locked=true (if DISABLE_LOCK=false)
 * - On foreground return, user must unlock with biometrics or password
 * - Recently signed in users skip lock for smooth onboarding
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useTheme } from './ThemeContext';
import type { User } from 'firebase/auth';

interface UserProfile {
  id?: number;
  uid: string;
  full_name?: string | null;
  email: string;
  created_at?: string;
  last_login?: string;
}

interface AuthContextType {
  /** Firebase Auth user object (null if not authenticated) */
  user: User | null;
  /** User profile data from Firestore */
  userProfile: UserProfile | null;
  /** True during initial authentication check */
  loading: boolean;
  /** Signs out the current user and clears auth state */
  signOutUser: () => Promise<void>;
  /** True when biometric lock is active (app backgrounded) */
  locked: boolean;
  /** Attempts to unlock using Face ID/Touch ID */
  unlockWithBiometrics: () => Promise<boolean>;
  /** Unlocks using email/password credentials from secure storage */
  unlockWithCredentials: (email: string, password: string) => Promise<boolean>;
  /** Marks user as recently signed in to prevent immediate lock */
  markSignedIn: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOutUser: async () => {},
  locked: false,
  unlockWithBiometrics: async () => false,
  unlockWithCredentials: async () => false,
  markSignedIn: () => {},
});

/**
 * useAuth Hook
 * 
 * Custom hook to access AuthContext from any component.
 * Throws error if used outside AuthProvider to catch integration mistakes early.
 * 
 * @example
 * const { user, locked, unlockWithBiometrics } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider Component
 * 
 * Wraps the app to provide authentication state via context.
 * Manages Firebase Auth lifecycle, user profile sync, and lock/unlock behavior.
 * 
 * Lifecycle:
 * 1. On mount: Sets up Firebase onAuthStateChanged listener
 * 2. When user signs in: Fetches/creates Firestore profile, loads theme preference
 * 3. When app backgrounds: Sets locked=true (if biometric auth enabled)
 * 4. When app foregrounds: Requires unlock before access
 * 5. On unmount: Cleans up Firebase listener and AppState subscription
 * 
 * Lock Logic:
 * - DISABLE_LOCK flag controls whether lock feature is active
 * - recentlySignedIn ref prevents lock immediately after sign-in
 * - Lock timeout (5min) clears recentlySignedIn flag
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const appState = useRef<AppStateStatus | null>(null);
  const [locked, setLocked] = useState(false);
  const DISABLE_LOCK = true;
  const recentlySignedIn = useRef(false);
  const { setMode } = useTheme();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { getAuthInstance } = await import('../services/firebase');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        const auth = await getAuthInstance();
        const { userService } = await import('../services/dataService');

        unsubscribe = onAuthStateChanged(auth, async (usr) => {
          setUser(usr);
          if (usr) {
            try {
              const profile = await userService.getByUid(usr.uid);
              if (!profile) {
                await userService.upsert(usr.uid, usr.displayName || null, usr.email || '');
                setUserProfile(await userService.getByUid(usr.uid));
              } else {
                setUserProfile(profile);
              }
            if (usr && !recentlySignedIn.current) {
              if (!DISABLE_LOCK) {
                setLocked(true);
              } else {
                setLocked(false);
              }
            }
            } catch (err) {
              console.error('Error loading local user profile:', err);
            }
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    appState.current = AppState.currentState;
    const handle = (nextAppState: AppStateStatus) => {
      if (appState.current && appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        if (!DISABLE_LOCK) {
          setLocked(true);
        } else {
          setLocked(false);
        }
        recentlySignedIn.current = false;
      }
      appState.current = nextAppState;
    };

    const sub = AppState.addEventListener('change', handle);
    return () => sub.remove();
  }, []);

  const unlockWithBiometrics = async (): Promise<boolean> => {
    try {
      if (DISABLE_LOCK) {
        setLocked(false);
        return true;
      }
      const biometric = await import('../hooks/useBiometricAuth');
      const available = await biometric.isBiometricAvailable();
      const enabled = await biometric.isBiometricEnabled();
      if (!available || !enabled) return false;
      const { authenticateBiometric } = biometric;
      const { success } = await authenticateBiometric('Unlock StockLens');
      if (success) {
        setLocked(false);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Biometric unlock failed', err);
      return false;
    }
  };

  const unlockWithCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
      if (DISABLE_LOCK) {
        setLocked(false);
        return true;
      }
      const authService = await import('../services/authService');
      await authService.authService.signIn({ email, password });
      setLocked(false);
      return true;
    } catch (err) {
      console.warn('Manual unlock failed', err);
      return false;
    }
  };

  const signOutUser = async () => {
    try {
      const { getAuthInstance } = await import('../services/firebase');
      const { signOut } = await import('firebase/auth');
      
      const auth = await getAuthInstance();
      await signOut(auth);
      setUserProfile(null);
      try {
        setMode('light');
      } catch (err) {
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const markSignedIn = () => {
    recentlySignedIn.current = true;
    setLocked(false);
    setTimeout(() => { recentlySignedIn.current = false; }, 2000);
  };

  const value = {
    user,
    userProfile,
    loading,
    signOutUser,
    locked,
    unlockWithBiometrics,
    unlockWithCredentials,
    markSignedIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};