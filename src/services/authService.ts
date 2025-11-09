/**
 * Auth Service - Firebase Authentication wrapper for sign up, sign in, and password reset
 * 
 * Features:
 * - User registration with email/password + display name
 * - Sign in with email/password
 * - Password reset email sending
 * - User profile synchronization with local SQLite (userService)
 * - Dynamic imports for code splitting (firebase/auth loaded on demand)
 * 
 * Integration:
 * - Uses Firebase Authentication for backend auth
 * - Syncs user profiles to local SQLite via userService.upsert
 * - Returns Firebase UserCredential for auth state management
 * 
 * Usage:
 * Called by LoginScreen, SignUpScreen, and SettingsScreen (password reset)
 */

import type { UserCredential } from 'firebase/auth';

/**
 * SignUpData type - User registration data
 * 
 * @property fullName - User's full display name
 * @property email - Email address (used for login)
 * @property password - Password (min 6 chars per Firebase default)
 */
export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
}

/**
 * SignInData type - User login credentials
 * 
 * @property email - Email address
 * @property password - Password
 */
export interface SignInData {
  email: string;
  password: string;
}

/**
 * authService - Firebase Authentication operations
 * 
 * Methods:
 * - signUp: Create new user account with email/password
 * - signIn: Authenticate existing user
 * - sendPasswordReset: Send password reset email
 * - getUserData: Fetch user profile from local SQLite
 */
export const authService = {
  /**
   * Register a new user account
   * 
   * @param fullName - User's display name
   * @param email - Email address for login
   * @param password - Password (Firebase enforces min 6 chars)
   * @returns UserCredential with user object and auth tokens
   * 
   * Process:
   * 1. Creates Firebase auth user with createUserWithEmailAndPassword
   * 2. Updates Firebase profile with displayName (updateProfile)
   * 3. Syncs user to local SQLite via userService.upsert
   * 4. Returns UserCredential for immediate sign-in
   * 
   * @throws Firebase auth errors (e.g., email-already-in-use, weak-password)
   */
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

  /**
   * Sign in an existing user
   * 
   * @param email - Email address
   * @param password - Password
   * @returns UserCredential with user object and auth tokens
   * 
   * Process:
   * 1. Authenticates user with signInWithEmailAndPassword
   * 2. Syncs/updates user profile in local SQLite via userService.upsert
   * 3. Updates last_login timestamp
   * 4. Returns UserCredential for auth state management
   * 
   * @throws Firebase auth errors (e.g., user-not-found, wrong-password, invalid-credential)
   */
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

  /**
   * Send password reset email to user
   * 
   * @param email - Email address to send reset link
   * 
   * Process:
   * 1. Calls Firebase sendPasswordResetEmail
   * 2. User receives email with reset link
   * 3. Clicking link opens Firebase-hosted reset page
   * 
   * @throws Firebase auth errors (e.g., user-not-found, invalid-email)
   * 
   * Note: Always succeeds silently even if email doesn't exist (security best practice)
   */
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

  /**
   * Get user profile data from local SQLite
   * 
   * @param userId - Firebase user UID
   * @returns User object or null if not found
   * 
   * Usage:
   * - Fetch user profile for display (full name, email, created_at, last_login)
   * - Check if user exists in local database
   */
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