/**
 * SettingsScreen
 * 
 * User preferences and account management screen.
 * Features:
 * - User profile display (name, email)
 * - Dark mode toggle
 * - Biometric authentication (Face ID/Touch ID) toggle
 * - Data management (clear local receipts, delete account)
 * - App information (version, support)
 * - Sign out functionality
 * 
 * Uses native Alert dialogs for destructive actions (sign out, clear data, delete account).
 * Biometric settings are persisted using expo-secure-store.
 * 
 * Data clearing only removes local receipts; Firebase data remains intact unless account is deleted.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Switch, ScrollView } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import PageHeader from '../components/PageHeader';
import SettingRow from '../components/SettingRow';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import * as biometric from '../hooks/useBiometricAuth';
import { receiptService } from '../services/dataService';
import { radii, spacing, typography, sizes } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

/**
 * Renders the settings screen with user preferences and account actions.
 * Handles sign out, data clearing, and biometric toggle with appropriate prompts.
 */
export default function SettingsScreen() {
  const { signOutUser, userProfile } = useAuth();
  const { mode, setMode, isDark, theme } = useTheme();
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const { isSmallPhone, isTablet } = useBreakpoint();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutUser();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const enabled = await biometric.isBiometricEnabled();
        if (mounted) setFaceIdEnabled(enabled);
      } catch (err) {
        console.warn('Failed to read biometric state', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleToggleFaceId = async (val: boolean) => {
    if (!val) {
      // Disabling biometrics - just clear credentials
      setFaceIdEnabled(val);
      try {
        await biometric.clearBiometricCredentials();
      } catch (err) {
        console.warn('Failed to clear biometric credentials', err);
      }
      return;
    }

    try {
      const existingCreds = await biometric.getBiometricCredentials();
      if (existingCreds) {
        setFaceIdEnabled(true);
        await biometric.setBiometricEnabled(true);
        Alert.alert('Enabled', 'Biometric login enabled');
        return;
      }

      Alert.alert(
        'Enable Biometrics?',
        'To enable Face ID / Touch ID, please enter your password to securely store your credentials.',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => setFaceIdEnabled(false)
          },
          {
            text: 'Continue',
            onPress: () => {
              Alert.prompt(
                'Enter Password',
                'Enter your account password to enable biometric login:',
                [
                  { 
                    text: 'Cancel', 
                    style: 'cancel',
                    onPress: () => setFaceIdEnabled(false)
                  },
                  {
                    text: 'Save',
                    onPress: async (password?: string) => {
                      if (!password || !userProfile?.email) {
                        Alert.alert('Error', 'Password is required');
                        setFaceIdEnabled(false);
                        return;
                      }
                      
                      try {
                        await biometric.saveBiometricCredentials(userProfile.email, password);
                        setFaceIdEnabled(true);
                        Alert.alert('Enabled', 'Biometric login enabled');
                      } catch (err) {
                        console.warn('Failed to save biometric credentials', err);
                        Alert.alert('Error', 'Failed to enable biometric login');
                        setFaceIdEnabled(false);
                      }
                    },
                  },
                ],
                'secure-text'
              );
            },
          },
        ]
      );
    } catch (err) {
      console.warn('Failed to update biometric setting', err);
      setFaceIdEnabled(false);
    }
  };

  const handleToggleDarkMode = (value: boolean) => {
    setMode(value ? 'dark' : 'light');
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all scanned receipts stored on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const uid = userProfile?.uid;
              await receiptService.deleteAll(uid);
              Alert.alert('Data Cleared', 'All scanned data has been cleared locally.');
            } catch (err: any) {
              console.error('Failed to clear receipts', err);
              Alert.alert('Error', err?.message || 'Failed to clear scanned data');
            }
          },
        },
      ]
    );
  };
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={[styles.scrollContent]} showsVerticalScrollIndicator={false}>
        <PageHeader>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Manage your preferences and security</Text>
        </PageHeader>

        <View style={[styles.section, isSmallPhone && styles.sectionCompact, isTablet && styles.sectionWide]}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Security</Text>

          <SettingRow
            iconEmoji="🔐"
            iconBgColor={theme.secondary}
            title="Face ID / Touch ID"
            subtitle="Secure login with biometrics"
            right={<Switch value={faceIdEnabled} onValueChange={handleToggleFaceId} trackColor={{ false: theme.border, true: theme.primary }} thumbColor={theme.surface} />}
          />

          <SettingRow
            iconEmoji="🛡️"
            iconBgColor={theme.border}
            title="Local Data Storage"
            subtitle="All processing kept on device (No cloud Storage)"
          />
        </View>

        <View style={[styles.section, isSmallPhone && styles.sectionCompact, isTablet && styles.sectionWide]}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Preferences</Text>

          <SettingRow
            iconEmoji="🌙"
            iconBgColor={theme.secondary}
            title="Dark Mode"
            subtitle="Reduce glare & save battery"
            right={<Switch value={isDark} onValueChange={handleToggleDarkMode} trackColor={{ false: theme.border, true: theme.primary }} thumbColor={theme.surface} />}
          />
        </View>

        <View style={[styles.section, isSmallPhone && styles.sectionCompact, isTablet && styles.sectionWide]}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Account</Text>

          <SettingRow
            iconEmoji="🚪"
            iconBgColor={theme.error}
            title="Log Out"
            subtitle="Return to login screen"
            destructive
            onPress={handleSignOut}
            right={<Text style={[styles.arrow, { color: theme.textSecondary }]}>›</Text>}
          />
        </View>

        <View style={[styles.section, isSmallPhone && styles.sectionCompact, isTablet && styles.sectionWide]}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Data Management</Text>

          <SettingRow
            iconEmoji="🗑️"
            iconBgColor={theme.error}
            title="Clear All Data"
            subtitle="Delete all scanned receipts"
            destructive
            onPress={handleClearData}
            right={<Text style={[styles.arrow, { color: theme.textSecondary }]}>›</Text>}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.pageTitle,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.pageSubtitle,
  },
  section: {
    paddingVertical: spacing.md,
  },
  sectionCompact: {
    paddingVertical: spacing.sm,
  },
  sectionWide: {
    paddingVertical: spacing.lg,
  },
  sectionLabel: {
    ...typography.overline,
    marginBottom: spacing.md,
  },
  arrow: {
    ...typography.bodyStrong,
  },
});