/**
 * Jest setup file
 *
 * This module configures the Jest test environment for the StockLens app.
 * It performs the following responsibilities:
 * - Enables and configures global fetch mocking via `jest-fetch-mock`.
 * - Provides default environment variables used in tests (Firebase / Expo keys).
 * - Stubs and mocks native and Expo modules (sqlite, secure-store, camera, haptics,
 *   linear-gradient, blur, status-bar, reanimated, icons, etc.) so tests run
 *   deterministically in Node/Jest without requiring native runtime.
 * - Supplies a lightweight in-memory mock for `expo-secure-store` and `expo-sqlite`
 *   to simulate persistence operations during unit and integration tests.
 *
 * Notes:
 * - The file intentionally keeps mocks minimal and synchronous where possible to
 *   make tests fast. More advanced behaviour can be added per-test using
 *   explicit jest.mock(...) or by replacing these defaults in individual specs.
 */

import React from 'react';
import '@testing-library/jest-native/extend-expect';
import 'jest-fetch-mock';
const fetchMock = require('jest-fetch-mock');

fetchMock.enableMocks();

process.env.EXPO_PUBLIC_API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? 'test-api-key';
process.env.EXPO_PUBLIC_AUTH_DOMAIN = process.env.EXPO_PUBLIC_AUTH_DOMAIN ?? 'test-auth.firebaseapp.com';
process.env.EXPO_PUBLIC_PROJECT_ID = process.env.EXPO_PUBLIC_PROJECT_ID ?? 'test-project';
process.env.EXPO_PUBLIC_STORAGE_BUCKET = process.env.EXPO_PUBLIC_STORAGE_BUCKET ?? 'test.appspot.com';
process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID = process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID ?? '1234567890';
process.env.EXPO_PUBLIC_APP_ID = process.env.EXPO_PUBLIC_APP_ID ?? '1:1234567890:web:abcdef123456';
process.env.EXPO_PUBLIC_MEASUREMENT_ID = process.env.EXPO_PUBLIC_MEASUREMENT_ID ?? 'G-TEST123';

jest.mock('expo-constants', () => ({
  manifest: { extra: {} },
  expoConfig: { extra: {} }
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy'
  }
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null
}));

jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children?: React.ReactNode }) => children ?? null
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => children ?? null
}));

jest.mock('expo-camera', () => ({
  CameraView: jest.fn(() => null),
  CameraType: {
    back: 'back',
    front: 'front'
  },
  useCameraPermissions: jest.fn(() => [
    { status: 'granted', granted: true },
    jest.fn()
  ]),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' }))
}));

jest.mock('expo-local-authentication', () => ({
  authenticateAsync: jest.fn(async () => ({ success: true })),
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  supportedAuthenticationTypesAsync: jest.fn(async () => [])
}));

jest.mock('expo-secure-store', () => {
  const secureStoreData = new Map<string, string>();

  return {
    setItemAsync: jest.fn(async (key: string, value: string) => {
      secureStoreData.set(key, value);
    }),
    getItemAsync: jest.fn(async (key: string) => secureStoreData.get(key) ?? null),
    deleteItemAsync: jest.fn(async (key: string) => {
      secureStoreData.delete(key);
    })
  };
});

jest.mock('expo-sqlite', () => {
  const executeSql = jest.fn((statement: string, params: unknown[] = [], success?: Function, error?: Function) => {
    if (success) {
      success({
        rows: { _array: [], length: 0 },
        rowsAffected: 0,
        insertId: undefined
      });
    }

    if (error) {
      error(null);
    }
  });

  const transaction = jest.fn((callback: (tx: { executeSql: typeof executeSql }) => void) => {
    const tx = { executeSql };
    callback(tx);
  });

  const mockDb = {
    transaction,
    exec: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };

  return {
    openDatabase: jest.fn(() => mockDb),
    openDatabaseSync: jest.fn(() => mockDb)
  };
});

try {
  require.resolve('react-native-reanimated/mock');
  jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
} catch (error) {
  jest.mock(
    'react-native-reanimated',
    () => ({
      __esModule: true,
      default: {},
      View: 'View',
      ScrollView: 'ScrollView',
      createAnimatedComponent: (component: unknown) => component,
      useSharedValue: () => ({ value: 0 }),
      useAnimatedStyle: () => ({}),
      useAnimatedProps: () => ({}),
      withTiming: (value: number) => value,
      Easing: { cubic: jest.fn() },
    }),
    { virtual: true }
  );
}

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ children, ...props }: any) => React.createElement('Icon', props, children ?? null),
  };
});

const RN = require('react-native');
if (RN?.AppState) {
  RN.AppState.currentState = 'active';
  RN.AppState.addEventListener = jest.fn(() => ({ remove: jest.fn() }));
  RN.AppState.removeEventListener = jest.fn();
}
