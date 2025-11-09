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
  async signUp({ fullName, email, password }: SignUpData): Promise<UserCredential> {
    try {
      const { getAuthInstance } = await import('./firebase');
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const { userService } = await import('./dataService');

      const auth = await getAuthInstance();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(userCredential.user, {
        displayName: fullName,
      });

      await userService.upsert(userCredential.user.uid, fullName, email);

      return userCredential;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  async signIn({ email, password }: SignInData): Promise<UserCredential> {
    try {
      const { getAuthInstance } = await import('./firebase');
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { userService } = await import('./dataService');

      const auth = await getAuthInstance();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      await userService.upsert(userCredential.user.uid, userCredential.user.displayName || null, email);

      return userCredential;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

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