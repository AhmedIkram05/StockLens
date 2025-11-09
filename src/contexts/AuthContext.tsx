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
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  locked: boolean;
  unlockWithBiometrics: () => Promise<boolean>;
  unlockWithCredentials: (email: string, password: string) => Promise<boolean>;
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