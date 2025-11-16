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
import { Ionicons } from '@expo/vector-icons';
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
        // First check if biometrics are available on device
        const available = await biometric.isBiometricAvailable();
        
        if (!available) {
          // If biometrics not available, ensure toggle is OFF and disable the setting
          if (mounted) setFaceIdEnabled(false);
          await biometric.setBiometricEnabled(false);
          return;
        }
        
        // If available, load the saved preference
        const enabled = await biometric.isBiometricEnabled();
        if (mounted) setFaceIdEnabled(enabled);
      } catch (err) {
        if (mounted) setFaceIdEnabled(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleToggleFaceId = async (val: boolean) => {
    if (!val) {
      // Disabling biometrics - clear flag and credentials
      setFaceIdEnabled(false);
      try {
        await biometric.setBiometricEnabled(false);
        await biometric.clearBiometricCredentials();
      } catch (err) {
      }
      return;
    }

    // Enabling biometrics - check availability first
    try {
      const available = await biometric.isBiometricAvailable();
      if (!available) {
        Alert.alert(
          'Not Available', 
          'Biometric authentication is not available on this device. Please ensure Face ID or Touch ID is set up in your device settings.',
          [{ text: 'OK', onPress: () => setFaceIdEnabled(false) }]
        );
        setFaceIdEnabled(false);
        return;
      }

      // Verify with native biometric prompt
      const { success, error } = await biometric.authenticateBiometric('Authenticate to enable biometric login');
      if (!success) {
        Alert.alert(
          'Authentication Failed', 
          error || 'Could not verify your identity with biometrics',
          [{ text: 'OK', onPress: () => setFaceIdEnabled(false) }]
        );
        setFaceIdEnabled(false);
        return;
      }

      // Successfully authenticated - enable biometric login
      await biometric.setBiometricEnabled(true);
      setFaceIdEnabled(true);
      Alert.alert('Enabled', 'Biometric login enabled successfully. You can now use Face ID or Touch ID to unlock the app.');
    } catch (err) {
      Alert.alert('Error', 'Failed to enable biometric login. Please try again.');
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
            icon="finger-print"
            iconBgColor={theme.secondary}
            title="Face ID / Touch ID"
            subtitle="Secure login with biometrics"
            right={<Switch value={faceIdEnabled} onValueChange={handleToggleFaceId} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#ffffff" />}
          />

          <SettingRow
            icon="shield-checkmark"
            iconBgColor={theme.border}
            title="Local Data Storage"
            subtitle="All processing kept on device (No cloud Storage)"
          />
        </View>

        <View style={[styles.section, isSmallPhone && styles.sectionCompact, isTablet && styles.sectionWide]}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Preferences</Text>

          <SettingRow
            icon="moon"
            iconBgColor={theme.secondary}
            title="Dark Mode"
            subtitle="Reduce glare & save battery"
            right={<Switch value={isDark} onValueChange={handleToggleDarkMode} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#ffffff" />}
          />
        </View>

        <View style={[styles.section, isSmallPhone && styles.sectionCompact, isTablet && styles.sectionWide]}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Account</Text>

          <SettingRow
            icon="log-out"
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
            icon="trash"
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