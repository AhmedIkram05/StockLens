/**
 * SignUpScreen
 * 
 * User registration screen for new users.
 * Features:
 * - Full name, email, password, and confirm password inputs
 * - Real-time form validation (password length, matching passwords)
 * - Firebase Authentication account creation
 * - Firestore user profile creation
 * - Biometric prompt after successful registration
 * - Back navigation to Login screen
 * 
 * Validation rules:
 * - Full name: Cannot be empty
 * - Email: Must be valid format (validated by Firebase)
 * - Password: Minimum 6 characters
 * - Confirm password: Must match password field
 * 
 * Flow:
 * 1. User fills form with validation feedback
 * 2. App creates Firebase Auth account
 * 3. App creates Firestore user profile document
 * 4. Prompts user to enable biometric authentication
 * 5. Redirects to main app via AuthContext
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import AuthFooter from '../components/AuthFooter';
import { useNavigation } from '@react-navigation/native';
import IconButton from '../components/IconButton';
import { authService, SignUpData } from '../services/authService';
import { promptEnableBiometrics } from '../utils/biometricPrompt';
import { useAuth } from '../contexts/AuthContext';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography, sizes } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Renders the registration form with validation and Firebase account creation.
 * Form validation runs on every field change to enable/disable submit button.
 */
export default function SignUpScreen() {
  const navigation = useNavigation();
  const { contentHorizontalPadding, sectionVerticalSpacing, isSmallPhone } = useBreakpoint();
  const { startLockGrace } = useAuth();
  const { theme } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const isValid =
      fullName.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      confirmPassword.length >= 6 &&
      password === confirmPassword;

    setIsFormValid(isValid);
  }, [fullName, email, password, confirmPassword]);

  const handleSignUp = async () => {
    if (!isFormValid) {
      Alert.alert('Error', 'Please fill in all fields correctly');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const signUpData: SignUpData = { fullName, email, password };
      await authService.signUp(signUpData);
      
      startLockGrace();
      
      try {
        await promptEnableBiometrics(email, password);
      } catch (e) {
        console.log('Biometric prompt dismissed or failed:', e);
      }
    } catch (error: any) {
      let errorMessage = 'An error occurred during sign up';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      Alert.alert('Sign Up Error', errorMessage);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Login' as never);
    }
  };

  return (
    <ScreenContainer contentStyle={{ paddingHorizontal: contentHorizontalPadding, paddingVertical: sectionVerticalSpacing }}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: sectionVerticalSpacing },
        ]}
      >
        <View style={[styles.headerRow, isSmallPhone && styles.headerRowCompact]}>
          <IconButton name="chevron-back" onPress={handleBack} accessibilityLabel="Go back" />
        </View>

        <View style={[styles.titleContainer, isSmallPhone && styles.titleContainerCompact]}>
          <Text style={[styles.title, { color: theme.text }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Start discovering your missed investment opportunities
          </Text>
        </View>

  <View style={[styles.formContainer, isSmallPhone && styles.formContainerCompact]}>
          <FormInput
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoCorrect={false}
          />

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
          />

          <FormInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <PrimaryButton
            onPress={handleSignUp}
            style={[styles.createAccountButton, !isFormValid && styles.disabledButton]}
            disabled={!isFormValid}
            accessibilityLabel="Create account"
          >
            Create Account
          </PrimaryButton>

          <AuthFooter prompt="Already have an account?" actionText="Login" onPress={handleLogin} style={styles.loginContainer} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  titleContainerCompact: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.pageTitle,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.pageSubtitle,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  formContainerCompact: {
    paddingBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerRowCompact: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  createAccountButton: {
    backgroundColor: palette.green,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  disabledButton: {
    backgroundColor: alpha.faintBlack,
  },
  loginContainer: {
    alignItems: 'center',
  },
});