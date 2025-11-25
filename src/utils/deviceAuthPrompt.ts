/**
 * Device Auth Prompt Utility - User prompt for device passcode authentication
 * 
 * Features:
 * - Native authentication dialog using device passcode/PIN
 * - Saves credentials to secure storage if user accepts
 * - Reusable across SignIn and SignUp screens
 * 
 * Integration:
 * - Uses expo-local-authentication for device credential auth
 * - Saves email and password to expo-secure-store
 * - Shows confirmation alert on success
 * 
 * Usage:
 * const enabled = await promptEnableDeviceAuth(email, password);
 */

import { Alert } from 'react-native';
import * as deviceAuth from '../hooks/useDeviceAuth';

/**
 * Prompt user to enable device passcode login after successful authentication
 * 
 * @param email - User's email address (saved to secure storage)
 * @param password - User's password (saved to secure storage)
 * @returns Promise<boolean> - true if user enabled device auth, false otherwise
 * 
 * Process:
 * 1. Checks if device auth hardware is available (isDeviceAuthAvailable)
 * 2. Shows native Alert with "Enable Device Auth?" question
 * 3. If user selects "Yes": saves credentials via saveDeviceCredentials
 * 4. Shows "Enabled" confirmation alert
 * 5. Returns true on success, false on decline or error
 * 
 * Edge Cases:
 * - Returns false if device auth not available (no prompt shown)
 * - Catches and logs errors from saveDeviceCredentials
 * - User can cancel dialog (returns false)
 * 
 * Integration:
 * Called by SignUpScreen and LoginScreen after successful auth
 */
export async function promptEnableDeviceAuth(email: string, password: string): Promise<boolean> {
  try {
    const available = await deviceAuth.isDeviceAuthAvailable();
    if (!available) return false;

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        'Enable Device Auth?',
        'Would you like to use your device passcode for future logins?',
        [
          { 
            text: 'No', 
            style: 'cancel', 
            onPress: async () => {
              // Explicitly clear any existing device credentials when user declines
              try {
                await deviceAuth.clearDeviceCredentials();
              } catch (err) {
              }
              resolve(false);
            }
          },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                await deviceAuth.saveDeviceCredentials(email, password);
                Alert.alert('Enabled', 'Device passcode login enabled');
                resolve(true);
              } catch (err) {
                resolve(false);
              }
            },
          },
        ],
        { cancelable: true }
      );
    });
  } catch (e) {
    return false;
  }
}

export default promptEnableDeviceAuth;
