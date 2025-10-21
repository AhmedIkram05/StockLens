import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
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
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  // locked indicates the UI is locked and requires biometric or credentials to unlock
  locked: boolean;
  // attempt biometric unlock and, if successful, unlock the UI (does not sign in)
  unlockWithBiometrics: () => Promise<boolean>;
  // attempt manual unlock via credentials (verifies via authService)
  unlockWithCredentials: (email: string, password: string) => Promise<boolean>;
  // mark that the user has just signed in so the app doesn't lock immediately
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const appState = useRef<AppStateStatus | null>(null);
  const [locked, setLocked] = useState(false);
  // recentlySignedIn prevents immediate lock when user signs in during the same session
  const recentlySignedIn = useRef(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Use dynamic import to defer Firebase loading until after app is ready
    const initAuth = async () => {
      try {
        // Add a small delay to ensure React Native native modules are fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { getAuthInstance } = await import('../services/firebase');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        const auth = await getAuthInstance();
        const { userService } = await import('../services/dataService');

        unsubscribe = onAuthStateChanged(auth, async (usr) => {
          setUser(usr);
          if (usr) {
            try {
              // Ensure local profile exists / load it
              const profile = await userService.getByUid(usr.uid);
              if (!profile) {
                // create minimal profile
                await userService.upsert(usr.uid, usr.displayName || null, usr.email || '');
                setUserProfile(await userService.getByUid(usr.uid));
              } else {
                setUserProfile(profile);
              }
            // If the app restored an existing user (cold start), lock the UI so that
            // biometric / passcode is required to proceed. If the user has just signed
            // in during this session, don't lock immediately.
            if (usr && !recentlySignedIn.current) {
              setLocked(true);
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

  // Lock UI when app goes to background
  useEffect(() => {
    appState.current = AppState.currentState;
    const handle = (nextAppState: AppStateStatus) => {
      if (appState.current && appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        // move to background -> lock UI
        setLocked(true);
        // after locking, clear recentlySignedIn so the next start requires unlock
        recentlySignedIn.current = false;
      }
      appState.current = nextAppState;
    };

    const sub = AppState.addEventListener('change', handle);
    return () => sub.remove();
  }, []);

  // Unlock UI using biometric authentication (does not alter Firebase session)
  const unlockWithBiometrics = async (): Promise<boolean> => {
    try {
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

  // Unlock UI by verifying credentials against the backend
  const unlockWithCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
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
      // Clear local profile from state (keep local DB record)
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const markSignedIn = () => {
    recentlySignedIn.current = true;
    // temporarily avoid auto-lock for this session until background event
    setLocked(false);
    // reset flag after short time to avoid keeping it forever
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