/**
 * LoginScreen
 * 
 * User authentication screen for existing users.
 * Features:
 * - Email and password input fields
 * - Firebase Authentication integration
 * - Device authentication prompt after successful login
 * - Navigation to SignUp screen for new users
 * - Responsive layout adapting to phone/tablet sizes
 * 
 * Flow:
 * 1. User enters email and password
 * 2. App calls authService.signIn() with Firebase Auth
 * 3. On success, prompts user to enable device passcode authentication
 * 4. Marks user as signed in via AuthContext
 * 5. App navigator redirects to main tabs
 * 
 * Error handling displays native alerts for validation and auth failures.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';
import PageHeader from '../components/PageHeader';
import PrimaryButton from '../components/PrimaryButton';
import Logo from '../components/Logo';
import FormInput from '../components/FormInput';
import AuthFooter from '../components/AuthFooter';
import { authService, SignInData } from '../services/authService';
import { promptEnableDeviceAuth } from '../utils/deviceAuthPrompt';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { brandColors } from '../contexts/ThemeContext';
import { radii, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

/**
 * Renders the login form with email/password inputs and device auth setup.
 * Validates inputs and handles Firebase authentication errors.
 */
export default function LoginScreen() {
  const navigation = useNavigation();
  const { contentHorizontalPadding, isSmallPhone, sectionVerticalSpacing, isTablet, orientation } = useBreakpoint();
  const { startLockGrace } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const signInData: SignInData = { email, password };
      await authService.signIn(signInData);
      
      startLockGrace();
      
      try {
        await promptEnableDeviceAuth(email, password);
      } catch (e) {
      }
    } catch (error: any) {
      let errorMessage = 'An error occurred during sign in';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      Alert.alert('Sign In Error', errorMessage);
    }
  };

  const handleSignUp = () => { 
    navigation.navigate('SignUp' as never);
  };

  const [forgotDisabled, setForgotDisabled] = useState(false);
  const handleForgot = async () => {
    if (forgotDisabled) return;
    const target = email.trim();
    if (!target) {
      Alert.alert('Email required', 'Please enter your email above to reset your password');
      return;
    }
    setForgotDisabled(true);
    try {
      const mod = await import('../services/authService');
      if (!mod || !mod.authService || typeof mod.authService.sendPasswordReset !== 'function') {
        throw new Error('authService.sendPasswordReset is not available');
      }
  await mod.authService.sendPasswordReset(target);
  Alert.alert('Password reset', "If an account exists for that email, we'll send a reset link. Check your inbox and spam folder.");
    } catch (err: any) {
      Alert.alert('Error', `Could not send reset email. ${err?.code || ''} ${err?.message || 'Try again later.'}`);
    } finally {
      setTimeout(() => setForgotDisabled(false), 30000);
    }
  };

  return (
  <ScreenContainer contentStyle={{ paddingHorizontal: contentHorizontalPadding, paddingVertical: sectionVerticalSpacing }}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo />
        </View>

        <PageHeader>
          <View style={[styles.titleContainer, isSmallPhone && styles.titleContainerCompact]}>
            {(() => {
              const titleMarginTop = isSmallPhone
                ? spacing.lg
                : isTablet
                ? orientation === 'landscape'
                  ? spacing.md
                  : spacing.lg
                : spacing.xl;
              const titleMarginBottom = isSmallPhone ? spacing.xs : isTablet ? spacing.sm : spacing.md;
              return (
                <Text style={[styles.title, { color: theme.text, marginTop: titleMarginTop, marginBottom: titleMarginBottom }]}>
                  Welcome to Stock
                  <Text style={[styles.titleLens, { color: theme.primary }]}>Lens</Text>
                </Text>
              );
            })()}
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Scan your spending{'\n'}See your missed investing</Text>
        </PageHeader>

  <View style={[styles.formContainer, isSmallPhone && styles.formContainerCompact]}>
          <FormInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <FormInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            showPasswordToggle
          />

          <PrimaryButton onPress={handleLogin} style={styles.loginButton} textStyle={styles.loginButtonText} accessibilityLabel="Login">
            Login
          </PrimaryButton>

          <TouchableOpacity onPress={handleForgot} disabled={forgotDisabled} style={styles.forgotContainer} accessibilityLabel="Forgot password">
            <Text style={[styles.forgotText, forgotDisabled && { opacity: 0.5 }]}>Forgot password?</Text>
          </TouchableOpacity>

          <AuthFooter prompt={"Don't have an account?"} actionText="Sign Up" onPress={handleSignUp} style={styles.signUpContainer} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  formContainerCompact: {
    paddingBottom: spacing.lg,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleContainerCompact: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.pageTitle,
    textAlign: 'center',
  },
  titleLens: {
    ...typography.pageTitle,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.pageSubtitle,
    textAlign: 'center',
    paddingBottom: spacing.xl,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: brandColors.green,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  loginButtonText: {
    ...typography.button,
  },
  signUpContainer: {
    alignItems: 'center',
  },
  forgotContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  forgotText: {
    ...typography.body,
    color: brandColors.blue,
  },
});