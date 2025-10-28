import { Alert } from 'react-native';
import * as biometric from '../hooks/useBiometricAuth';

/**
 * Prompts the user to enable biometric login after a successful auth event.
 * This centralises the native Alert flow and biometric API calls so SignIn
 * and SignUp can reuse the same UX.
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
          { text: 'No', style: 'cancel', onPress: () => resolve(false) },
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
