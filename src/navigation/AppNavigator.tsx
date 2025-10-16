import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { palette, alpha } from '../styles/palette';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import AnalysisScreen from '../screens/SummaryScreen';
import ProfileScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ReceiptDetailsScreen from '../screens/ReceiptDetailsScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import SplashScreen from '../screens/OnboardingScreen';
import { useAuth } from '../contexts/AuthContext';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: undefined;
  MainTabs: undefined;
  Calculator: undefined;
  ReceiptDetails: {
    receiptId: string;
    totalAmount: number;
    date: string;
    image?: string;
  };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Scan: undefined;
  Summary: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
  tabBarActiveTintColor: palette.green,
  tabBarInactiveTintColor: palette.black,
        tabBarShowLabel: false,                     // Show tab labels with icons
        tabBarStyle: {
          backgroundColor: palette.white,
          borderTopColor: alpha.faintBlack,
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          headerShown: false, // Hide the header for Dashboard
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
          headerShown: false, // Hide the header for Scan
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
          headerShown: false, // Hide the header for Summary
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
          headerShown: false, // Hide the header for Settings
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

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  <ActivityIndicator size="large" color={palette.green} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="Calculator" component={CalculatorScreen} />
            <Stack.Screen name="ReceiptDetails" component={ReceiptDetailsScreen} />
          </>
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