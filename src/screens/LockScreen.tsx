/**
 * LockScreen
 * 
 * Biometric authentication gate shown when app returns from background (if enabled).
 * Features:
 * - Face ID / Touch ID authentication button
 * - Fallback password entry field
 * - "Forgot password" flow sending reset email
 * - User profile display (name, email)
 * 
 * Flow:
 * 1. User returns to app after backgrounding
 * 2. LockScreen appears if biometric auth is enabled
 * 3. User can:
 *    a) Authenticate with Face ID/Touch ID (calls unlockWithBiometrics)
 *    b) Enter password manually (calls unlockWithCredentials)
 *    c) Send password reset email via forgot password flow
 * 4. On successful auth, AuthContext unlocks and navigates to main app
 * 
 * Credentials are securely stored using expo-secure-store.
 * Password reset uses Firebase Auth's sendPasswordResetEmail.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import { useAuth } from '../contexts/AuthContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import PageHeader from '../components/PageHeader';
import Logo from '../components/Logo';
import { palette } from '../styles/palette';
import { radii, spacing, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Renders the biometric lock screen with Face ID/password unlock options.
 * Handles biometric authentication, credential validation, and password reset flows.
 */
export default function LockScreen() {
  const { unlockWithBiometrics, unlockWithCredentials, user, userProfile } = useAuth();
  const { contentHorizontalPadding, sectionVerticalSpacing, isSmallPhone } = useBreakpoint();
  const { theme } = useTheme();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const accountEmail = (user && user.email) || userProfile?.email || '';
  const [forgotDisabled, setForgotDisabled] = useState(false);
  const handleForgotFromLock = async () => {
    if (forgotDisabled) return;
    if (!accountEmail) {
      Alert.alert('No account', 'No account email available. Please sign in again from the Sign In screen.');
      return;
    }
    Alert.alert('Send reset link?', `Send a password reset link to ${accountEmail}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: async () => {
        setForgotDisabled(true);
        try {
          const mod = await import('../services/authService');
          if (!mod || !mod.authService || typeof mod.authService.sendPasswordReset !== 'function') {
            throw new Error('authService.sendPasswordReset is not available');
          }
          await mod.authService.sendPasswordReset(accountEmail);
          Alert.alert('Password reset', "If an account exists for that email, we'll send a reset link. Check your inbox and spam folder.");
        } catch (err: any) {
          console.warn('Password reset failed', err);
          Alert.alert('Error', `Could not send reset email. ${err?.code || ''} ${err?.message || 'Try again later.'}`);
        } finally {
          setTimeout(() => setForgotDisabled(false), 30000);
        }
      } }
    ]);
  };

  const handleBiometric = async () => {
    setLoading(true);
    try {
      const ok = await unlockWithBiometrics();
      if (!ok) Alert.alert('Unlock failed', 'Could not unlock using biometrics');
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Biometric unlock failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManual = async () => {
    const emailAddr = user?.email || userProfile?.email;
    if (!emailAddr) {
      Alert.alert('No account', 'No account email available. Please sign in again from the Sign In screen.');
      return;
    }
    if (!password) {
      Alert.alert('Missing password', 'Please enter your account password');
      return;
    }
    setLoading(true);
    const ok = await unlockWithCredentials(emailAddr, password);
    if (!ok) Alert.alert('Unlock failed', 'Invalid password');
    setLoading(false);
  };

  return (
    <ScreenContainer contentStyle={{ paddingHorizontal: contentHorizontalPadding, paddingVertical: sectionVerticalSpacing }}>
      <View style={[styles.inner, { paddingHorizontal: 0 }]}> 
        <View style={styles.logoContainer}>
          <Logo />
        </View>

        <PageHeader>
          <Text style={[styles.title, { color: theme.text }]}>Locked</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Unlock to continue</Text>
          {accountEmail ? (
            <Text style={[styles.accountEmail, { color: theme.textSecondary }]} numberOfLines={1} ellipsizeMode="middle">
              {accountEmail}
            </Text>
          ) : null}
        </PageHeader>

        <SecondaryButton
          onPress={handleBiometric}
          disabled={loading}
          accessibilityLabel="Unlock with biometrics"
          style={styles.bioButton}
          textStyle={{ color: palette.white }}
        >
          {loading ? 'Unlocking…' : 'Unlock with Biometrics / Passcode'}
        </SecondaryButton>

        <Text style={[styles.or, { color: theme.textSecondary }]}>Or enter your account password</Text>

        <FormInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />

        <PrimaryButton style={styles.unlockButton} onPress={handleManual} disabled={loading} accessibilityLabel="Unlock with password">
          Unlock
        </PrimaryButton>
        <TouchableOpacity onPress={handleForgotFromLock} disabled={forgotDisabled} style={styles.forgotContainer} accessibilityLabel="Forgot password">
          <Text style={[styles.forgotText, forgotDisabled && { opacity: 0.5 }]}>Forgot password?</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  inner: { padding: spacing.lg, flex: 1, justifyContent: 'center' },
  title: { ...typography.pageTitle, marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { ...typography.body, marginBottom: spacing.lg, textAlign: 'center' },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bioButton: { backgroundColor: palette.green, padding: spacing.md, borderRadius: radii.md, alignItems: 'center', marginBottom: spacing.md },
  or: { textAlign: 'center', marginVertical: spacing.md },
  unlockButton: { backgroundColor: palette.blue, padding: spacing.md, borderRadius: radii.md, alignItems: 'center' },
  forgotContainer: { alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
  forgotText: { ...typography.body, color: palette.blue },
  accountEmail: { ...typography.body, marginTop: spacing.xs, textAlign: 'center' },
});
