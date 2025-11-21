const path = require('path');

module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/__tests__/fixtures/',
    '<rootDir>/src/__tests__/utils/index.ts',
    '<rootDir>/src/__tests__/utils/renderWithProviders.tsx'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|@react-native-community|expo|expo-.*|@expo/vector-icons|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|react-native-chart-kit)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(svg)$': path.join(__dirname, '__mocks__', 'svgMock.js')
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  passWithNoTests: true
};
