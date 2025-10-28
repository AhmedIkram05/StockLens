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
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { contentHorizontalPadding, isSmallPhone } = useBreakpoint();
  const { markSignedIn } = useAuth();
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
    <ScreenContainer contentStyle={{ paddingHorizontal: contentHorizontalPadding, paddingVertical: spacing.xl }}>
      <View style={styles.content}>
        <View style={[styles.logoContainer, isSmallPhone && styles.logoContainerCompact]}>
          <Logo width={200} height={100} />
        </View>

        <PageHeader>
          <View style={[styles.titleContainer, isSmallPhone && styles.titleContainerCompact]}>
            <Text style={styles.title}>Welcome to StockLens</Text>
          </View>
          <Text style={styles.subtitle}>Scan your spending{'\n'}See your missed investing</Text>
        </PageHeader>

        {/* Form Section */}
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
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainerCompact: {
    height: 150,
  },
  logo: {
    width: 200,
    height: 100,
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
    color: palette.black,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.pageSubtitle,
    color: palette.black,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
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
    color: palette.white,
    ...typography.button,
  },
  signUpContainer: {
    alignItems: 'center',
  },
  signUpText: {
    ...typography.caption,
    color: alpha.subtleBlack,
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