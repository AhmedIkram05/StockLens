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

const logoImage = require('../../assets/StockLens_Logo.png');

const { height: screenHeight } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation();
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
      <View style={styles.content}>
        {/* Logo Section - 1/3 of screen */}
        <View style={styles.logoContainer}>
          <Image
            source={logoImage}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title Section */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Welcome to StockLens</Text>
          <Text style={styles.subtitle}>
            Scan your spending{'\n'}See your missed investing
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  logoContainer: {
    height: screenHeight / 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 100,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#000000',
  },
  loginButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  signUpButton: {
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  signUpButtonText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
});