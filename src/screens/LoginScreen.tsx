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
import * as biometric from '../hooks/useBiometricAuth';
import { promptEnableBiometrics } from '../utils/biometricPrompt';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { contentHorizontalPadding, isSmallPhone, sectionVerticalSpacing, isTablet, orientation } = useBreakpoint();
  const { markSignedIn } = useAuth();
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
        // prevent immediate lock for this sign-in session
        try { markSignedIn(); } catch {}
      // After successful sign in, give the user option to enable biometrics
      try {
        await promptEnableBiometrics(email, password);
      } catch (e) {
        // helper already logs errors
      }
      // Navigation will be handled automatically by the auth state change
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

  return (
  <ScreenContainer contentStyle={{ paddingHorizontal: contentHorizontalPadding, paddingVertical: sectionVerticalSpacing }}>
      <View style={styles.content}>
        <View style={[styles.logoContainer, isSmallPhone && styles.logoContainerCompact]}>
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

        {/* Form Section */}
  <View style={[styles.formContainer, isSmallPhone && styles.formContainerCompact, isTablet && orientation === 'landscape' && styles.formContainerLandscapeTablet]}>
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

          <PrimaryButton onPress={handleLogin} style={styles.loginButton} textStyle={styles.loginButtonText} accessibilityLabel="Login">
            Login
          </PrimaryButton>

          <AuthFooter prompt={"Don't have an account?"} actionText="Sign Up" onPress={handleSignUp} style={styles.signUpContainer} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.lightGray,
  },
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
  logoContainerCompact: {
    // keep same layout but allow logo to size itself
  },
  logo: {},
  titleContainer: {
    alignItems: 'center',
  },
  titleContainerCompact: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.pageTitle,
    textAlign: 'center',
    // spacing for top/bottom is applied responsively inline so it adapts
    // to phones/tablets. Keep only typography here.
  },
  titleLens: {
    ...typography.pageTitle,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.pageSubtitle,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  formContainerLandscapeTablet: {
    // add extra space between subtitle and form on horizontal/tablet layouts
    marginTop: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: alpha.faintBlack,
    borderRadius: radii.md,
    padding: spacing.md,
    ...typography.body,
    color: palette.black,
  },
  loginButton: {
    backgroundColor: palette.green,
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
  signUpText: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  signUpButton: {
    borderWidth: 2,
    borderColor: palette.green,
    backgroundColor: palette.white,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  signUpButtonText: {
    color: palette.green,
    ...typography.button,
  },
});