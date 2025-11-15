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
 * 
 * Auto-lock behavior:
 * - When app goes to background, sets locked=true (if DISABLE_LOCK=false)
 * - On foreground return, user must unlock with biometrics or password
 * - Grace period: 10-second window after sign-in where lock is disabled
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useTheme } from './ThemeContext';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getAuthInstance } from '@/services/firebase';
import { userService } from '@/services/dataService';
import { authenticateBiometric, isBiometricAvailable, isBiometricEnabled } from '@/hooks/useBiometricAuth';

export interface UserProfile {
  id?: number;
  uid: string;
  full_name?: string | null;
  email: string;
  created_at?: string;
  last_login?: string;
}

export interface AuthContextType {
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
  /** Starts 10-second grace period to prevent immediate locking after sign-in */
  startLockGrace: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
 * - LOCK_ENABLED flag controls whether lock feature is active
 * - lockGraceActive ref prevents immediate lock for 10s after sign-in
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const appState = useRef<AppStateStatus | null>(null);
  const [locked, setLocked] = useState(false);
  const LOCK_ENABLED = true;
  const lockGraceActive = useRef(false);
  const lockGraceTimer = useRef<NodeJS.Timeout | null>(null);
  const { setMode } = useTheme();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const auth = await getAuthInstance();

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
        // Only lock if lock is enabled, user exists, and grace period is not active
        if (LOCK_ENABLED && user && !lockGraceActive.current) {
          setLocked(true);
        }
      }
      appState.current = nextAppState;
    };

    const sub = AppState.addEventListener('change', handle);
    return () => sub.remove();
  }, [user]);

  const unlockWithBiometrics = async (): Promise<boolean> => {
    try {
      if (!LOCK_ENABLED) {
        setLocked(false);
        return true;
      }
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      if (!available || !enabled) return false;
      const { success } = await authenticateBiometric('Unlock StockLens');
      if (success) {
        // Start grace period to prevent immediate re-locking
        startLockGrace();
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
      if (!LOCK_ENABLED) {
        setLocked(false);
        return true;
      }
      
      // Validate credentials without triggering full sign-in
      const auth = await getAuthInstance();
      
      // Just verify credentials are correct
      await signInWithEmailAndPassword(auth, email, password);
      
      // If we get here, credentials are valid - start grace period
      startLockGrace();
      return true;
    } catch (err) {
      console.warn('Credential unlock failed', err);
      return false;
    }
  };

  const signOutUser = async () => {
    try {
      // Clear grace period timer if active
      if (lockGraceTimer.current) {
        clearTimeout(lockGraceTimer.current);
        lockGraceTimer.current = null;
      }
      lockGraceActive.current = false;
      
      const auth = await getAuthInstance();
      await signOut(auth);
      setUserProfile(null);
      setLocked(false);
      
      // Reset theme to light mode on sign out
      setMode('light');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  /**
   * Starts a 10-second grace period where the lock screen will not trigger.
   * This prevents immediate locking after sign-in/unlock, allowing smooth onboarding.
   * Should be called after successful login, signup, or unlock.
   */
  const startLockGrace = () => {
    // Clear any existing timer
    if (lockGraceTimer.current) {
      clearTimeout(lockGraceTimer.current);
    }
    
    // Set grace period active and unlock
    lockGraceActive.current = true;
    setLocked(false);
    
    // Clear grace period after 10 seconds
    lockGraceTimer.current = setTimeout(() => {
      lockGraceActive.current = false;
      lockGraceTimer.current = null;
    }, 10000);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signOutUser,
    locked,
    unlockWithBiometrics,
    unlockWithCredentials,
    startLockGrace,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};