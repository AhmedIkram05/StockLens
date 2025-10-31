import type { UserCredential } from 'firebase/auth';

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  // Sign up with email and password
  async signUp({ fullName, email, password }: SignUpData): Promise<UserCredential> {
    try {
      const { getAuthInstance } = await import('./firebase');
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const { userService } = await import('./dataService');

      const auth = await getAuthInstance();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update the user profile with display name
      await updateProfile(userCredential.user, {
        displayName: fullName,
      });

      // Persist user profile locally in SQLite
      await userService.upsert(userCredential.user.uid, fullName, email);

      return userCredential;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  // Sign in with email and password
  async signIn({ email, password }: SignInData): Promise<UserCredential> {
    try {
      const { getAuthInstance } = await import('./firebase');
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { userService } = await import('./dataService');

      const auth = await getAuthInstance();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Update last login locally
      await userService.upsert(userCredential.user.uid, userCredential.user.displayName || null, email);

      return userCredential;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  // Send a password reset email using Firebase Auth
  async sendPasswordReset(email: string): Promise<void> {
    try {
      console.debug('authService.sendPasswordReset: sending reset for', email);
      const { getAuthInstance } = await import('./firebase');
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const auth = await getAuthInstance();
      await sendPasswordResetEmail(auth, email);
      console.debug('authService.sendPasswordReset: sendPasswordResetEmail returned successfully for', email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  },

  // Get current user data from local SQLite
  async getUserData(userId: string) {
    try {
      const { userService } = await import('./dataService');
      return await userService.getByUid(userId);
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  },
};