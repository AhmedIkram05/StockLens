/**
 * AppNavigator
 * 
 * Root navigation structure for the StockLens app using React Navigation v7.
 * Implements a two-level navigation hierarchy:
 * 1. Stack Navigator (root) - handles auth flow and modal screens
 * 2. Bottom Tab Navigator - main app with 4 tabs
 * 
 * Navigation Flow:
 * - Unauthenticated: Splash → Login/SignUp
 * - Authenticated & Locked: LockScreen (biometric gate)
 * - Authenticated & Unlocked: MainTabs → ReceiptDetails (modal)
 * 
 * Type Safety:
 * - RootStackParamList: Defines all stack screen params
 * - MainTabParamList: Defines all tab screen params
 * 
 * Features:
 * - Automatic biometric unlock attempt when app opens locked
 * - Theme-aware tab bar with SafeAreaView edges
 * - Smooth horizontal slide transitions (200ms)
 * - Loading state with ActivityIndicator during auth check
 * 
 * Tab Structure:
 * 1. Dashboard - Receipt history and spending overview
 * 2. Scan - Camera for capturing receipts
 * 3. Summary - Analytics and insights
 * 4. Settings - User preferences and account
 */

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import React from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { useTheme } from '../contexts/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import AnalysisScreen from '../screens/SummaryScreen';
import ProfileScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ReceiptDetailsScreen from '../screens/ReceiptDetailsScreen';
import SplashScreen from '../screens/OnboardingScreen';
import { useAuth } from '../contexts/AuthContext';
import LockScreen from '../screens/LockScreen';

/** Root stack navigation parameter list - defines all stack screens and their params */
export type RootStackParamList = {
  /** Onboarding/splash screen shown before authentication */
  Splash: undefined;
  /** Login screen for existing users */
  Login: undefined;
  /** Registration screen for new users */
  SignUp: undefined;
  /** Biometric lock screen shown when app is locked */
  Lock: undefined;
  /** Main bottom tab navigator (post-auth) */
  MainTabs: undefined;
  /** Calculator screen (future feature, currently unused) */
  Calculator: undefined;
  /** Receipt details modal with projection calculator */
  ReceiptDetails: {
    receiptId: string;
    totalAmount: number;
    date: string;
    image?: string;
  };
};

/** Bottom tab navigation parameter list - defines all tab screens */
export type MainTabParamList = {
  /** Home/dashboard tab showing receipt history */
  Dashboard: undefined;
  /** Scan tab with camera for capturing receipts */
  Scan: undefined;
  /** Summary tab with analytics and insights */
  Summary: undefined;
  /** Settings tab with user preferences */
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * MainTabNavigator
 * 
 * Bottom tab bar with 4 tabs: Dashboard, Scan, Summary, Settings.
 * Uses Ionicons for tab icons (filled when active, outlined when inactive).
 * Tab bar is theme-aware and positioned absolutely with SafeAreaView for notches.
 */
function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
  tabBarActiveTintColor: theme.primary,
  tabBarInactiveTintColor: theme.text,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
            <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: theme.background }} />
          )
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          title: 'Scan Receipt',
          tabBarLabel: 'Scan',
          headerShown: false,
          tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
            <Ionicons
              name={focused ? 'camera' : 'camera-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Summary"
        component={AnalysisScreen}
        options={{
          title: 'Summary',
          tabBarLabel: 'Summary',
          headerShown: false,
          tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
            <Ionicons
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={ProfileScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          headerShown: false,
          tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * AppNavigator (Root Navigator)
 * 
 * Main navigation component wrapped in NavigationContainer.
 * Handles authentication state and conditional rendering:
 * - Loading: Shows ActivityIndicator
 * - Unauthenticated: Shows Splash → Login/SignUp flow
 * - Authenticated & Locked: Shows LockScreen (biometric gate)
 * - Authenticated & Unlocked: Shows MainTabs + ReceiptDetails modal
 * 
 * Auto-unlock behavior:
 * - When user is authenticated but locked, automatically attempts biometric unlock
 * - Uses useEffect to trigger unlock on mount if conditions are met
 * 
 * Transition animations:
 * - Horizontal iOS-style slide transitions
 * - 200ms duration for smooth navigation
 */
export default function AppNavigator() {
  const { user, loading, locked, unlockWithBiometrics } = useAuth();
  const { theme } = useTheme();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!loading && user && locked) {
          unlockWithBiometrics();
        }
      } catch (err) {
      }
    })();
    return () => { mounted = false; };
  }, [loading, user, locked]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 200 } },
            close: { animation: 'timing', config: { duration: 200 } },
          },
        }}
      >
        {user ? (
          locked ? (
            <Stack.Screen name="Lock" component={LockScreen} />
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen name="ReceiptDetails" component={ReceiptDetailsScreen} />
            </>
          )
        ) : (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}