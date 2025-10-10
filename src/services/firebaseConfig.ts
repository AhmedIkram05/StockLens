import Constants from 'expo-constants';

// Firebase configuration only
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_API_KEY || process.env.EXPO_PUBLIC_API_KEY,
  authDomain: Constants.expoConfig?.extra?.EXPO_PUBLIC_AUTH_DOMAIN || process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.EXPO_PUBLIC_PROJECT_ID || process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.EXPO_PUBLIC_STORAGE_BUCKET || process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.EXPO_PUBLIC_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.EXPO_PUBLIC_APP_ID || process.env.EXPO_PUBLIC_APP_ID,
  measurementId: Constants.expoConfig?.extra?.EXPO_PUBLIC_MEASUREMENT_ID || process.env.EXPO_PUBLIC_MEASUREMENT_ID,
};

// Validate that all required Firebase config values are present
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  throw new Error(
    `Firebase configuration is incomplete. Missing environment variables: ${missingKeys.join(', ')}. ` +
    'Please check your .env file and ensure all EXPO_PUBLIC_FIREBASE_* variables are set.'
  );
}

export { firebaseConfig };
