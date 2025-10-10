import React, { createContext, useContext, useEffect, useState } from 'react';
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOutUser: async () => {},
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

  const value = {
    user,
    userProfile,
    loading,
    signOutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};