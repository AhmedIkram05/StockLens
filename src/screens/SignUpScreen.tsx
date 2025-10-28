import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ScrollView } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import Logo from '../components/Logo';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import AuthFooter from '../components/AuthFooter';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../components/BackButton';
import { authService, SignUpData } from '../services/authService';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography, shadows } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { contentHorizontalPadding, sectionVerticalSpacing, isSmallPhone } = useBreakpoint();
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
    <ScreenContainer>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isSmallPhone && styles.contentCompact,
          {
            paddingHorizontal: contentHorizontalPadding,
            paddingBottom: sectionVerticalSpacing,
          },
        ]}
      >
        <View style={[styles.headerRow, isSmallPhone && styles.headerRowCompact]}>
          <BackButton onPress={handleBack} />
        </View>

        {/* Title Section */}
        <View style={[styles.titleContainer, isSmallPhone && styles.titleContainerCompact]}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
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
  container: {
    flex: 1,
    backgroundColor: palette.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxl,
  },
  contentCompact: {
    paddingTop: spacing.xxl,
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
    lineHeight: 22,
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: palette.green,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.level2,
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
  createAccountButtonText: {
    color: palette.white,
    ...typography.button,
  },
  disabledButtonText: {
    color: alpha.mutedBlack,
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginText: {
    ...typography.caption,
    color: alpha.subtleBlack,
    marginBottom: spacing.sm,
  },
  loginButton: {
    borderWidth: 2,
    borderColor: palette.green,
    backgroundColor: palette.white,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  loginButtonText: {
    color: palette.green,
    ...typography.button,
  },
});