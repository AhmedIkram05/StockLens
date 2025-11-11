/**
 * Biometric Prompt Utility - User prompt for enabling biometric authentication
 * 
 * Features:
 * - Native Alert dialog asking user to enable Face ID / Touch ID
 * - Checks biometric hardware availability before prompting
 * - Saves credentials to secure storage if user accepts
 * - Reusable across SignIn and SignUp screens
 * 
 * Integration:
 * - Uses useBiometricAuth hook for biometric operations
 * - Saves email and password to expo-secure-store (keychain/keystore)
 * - Shows confirmation alert on success
 * 
 * Usage:
 * const enabled = await promptEnableBiometrics(email, password);
 */

import { Alert } from 'react-native';
import * as biometric from '../hooks/useBiometricAuth';

/**
 * Prompt user to enable biometric login after successful authentication
 * 
 * @param email - User's email address (saved to secure storage)
 * @param password - User's password (saved to secure storage)
 * @returns Promise<boolean> - true if user enabled biometrics, false otherwise
 * 
 * Process:
 * 1. Checks if biometric hardware is available (isBiometricAvailable)
 * 2. Shows native Alert with "Enable Biometrics?" question
 * 3. If user selects "Yes": saves credentials via saveBiometricCredentials
 * 4. Shows "Enabled" confirmation alert
 * 5. Returns true on success, false on decline or error
 * 
 * Edge Cases:
 * - Returns false if biometrics not available (no prompt shown)
 * - Catches and logs errors from saveBiometricCredentials
 * - User can cancel dialog (returns false)
 * 
 * Integration:
 * Called by SignUpScreen and LoginScreen after successful auth
 */
export async function promptEnableBiometrics(email: string, password: string) {
  try {
    const available = await biometric.isBiometricAvailable();
    if (!available) return false;

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'Enable Biometrics?',
        'Would you like to use Face ID / Touch ID for future logins?',
        [
          { 
            text: 'No', 
            style: 'cancel', 
            onPress: async () => {
              // Explicitly clear any existing biometric credentials when user declines
              try {
                await biometric.clearBiometricCredentials();
              } catch (err) {
                console.warn('Failed to clear biometric credentials', err);
              }
              resolve(false);
            }
          },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                await biometric.saveBiometricCredentials(email, password);
                Alert.alert('Enabled', 'Biometric login enabled');
                resolve(true);
              } catch (err) {
                console.warn('Failed to save biometric credentials', err);
                resolve(false);
              }
            },
          },
        ],
        { cancelable: true }
      );
    });
  } catch (e) {
    console.warn('Biometric prompt failed', e);
    return false;
  }
}

export default promptEnableBiometrics;
