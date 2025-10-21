import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { authService, SignInData } from '../services/authService';
import * as biometric from '../hooks/useBiometricAuth';
import { useAuth } from '../contexts/AuthContext';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

const logoImage = require('../../assets/StockLens_Logo.png');

const { height: screenHeight } = Dimensions.get('window');

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
        const available = await biometric.isBiometricAvailable();
        if (available) {
          // Ask user
          Alert.alert(
            'Enable Biometrics?',
            'Would you like to use Face ID / Touch ID for future logins?',
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Yes',
                onPress: async () => {
                  try {
                    await biometric.saveBiometricCredentials(email, password);
                    Alert.alert('Enabled', 'Biometric login enabled');
                  } catch (err) {
                    console.warn('Failed to save biometric credentials', err);
                  }
                },
              },
            ]
          );
        }
      } catch (e) {
        console.warn('Biometric prompt failed', e);
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
    <SafeAreaView style={styles.container}>
  <View style={[styles.content, { paddingHorizontal: contentHorizontalPadding }] }>
        {/* Logo Section - 1/3 of screen */}
  <View style={[styles.logoContainer, isSmallPhone && styles.logoContainerCompact]}>
          <Image
            source={logoImage}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title Section */}
  <View style={[styles.titleContainer, isSmallPhone && styles.titleContainerCompact]}>
          <Text style={styles.title}>Welcome to StockLens</Text>
          <Text style={styles.subtitle}>
            Scan your spending{'\n'}See your missed investing
          </Text>
        </View>

        {/* Form Section */}
  <View style={[styles.formContainer, isSmallPhone && styles.formContainerCompact]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account?</Text>
            <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
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
    height: screenHeight / 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainerCompact: {
    height: screenHeight / 4,
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