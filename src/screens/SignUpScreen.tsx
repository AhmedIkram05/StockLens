import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import AuthFooter from '../components/AuthFooter';
import { useNavigation } from '@react-navigation/native';
// removed unused Ionicons import
import BackButton from '../components/BackButton';
import { authService, SignUpData } from '../services/authService';
import { promptEnableBiometrics } from '../utils/biometricPrompt';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography, sizes } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useTheme } from '../contexts/ThemeContext';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { contentHorizontalPadding, sectionVerticalSpacing, isSmallPhone } = useBreakpoint();
  const { theme } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    // Check if all fields are filled and passwords match
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const signUpData: SignUpData = { fullName, email, password };
      await authService.signUp(signUpData);
      // After sign up, offer to enable biometrics for convenience
      try {
        await promptEnableBiometrics(email, password);
      } catch (e) {
        // helper logs errors
      }
      // Navigation will be handled automatically by the auth state change
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
          isSmallPhone && styles.contentCompact,
          { paddingBottom: sectionVerticalSpacing },
        ]}
      >
        <View style={[styles.headerRow, isSmallPhone && styles.headerRowCompact]}>
          <BackButton onPress={handleBack} />
        </View>

        {/* Title Section */}
        <View style={[styles.titleContainer, isSmallPhone && styles.titleContainerCompact]}>
          <Text style={[styles.title, { color: theme.text }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Start discovering your missed investment opportunities
          </Text>
        </View>

        {/* Form Section */}
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
  contentCompact: {},
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
    // use the global pageSubtitle.lineHeight token to avoid platform clipping
    lineHeight: (typography.pageSubtitle.lineHeight as number) || Math.round((typography.pageSubtitle.fontSize as number) * 1.35),
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