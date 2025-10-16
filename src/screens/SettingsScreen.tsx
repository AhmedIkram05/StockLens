import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { ScrollView } from 'react-native';
import { emit } from '../services/eventBus';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { receiptService } from '../services/dataService';
import { palette, alpha } from '../styles/palette';
import { radii, shadows, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';

export default function SettingsScreen() {
  const { signOutUser, userProfile } = useAuth();
  const [faceIdEnabled, setFaceIdEnabled] = useState(true);
  const [localStorageEnabled, setLocalStorageEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const { contentHorizontalPadding, sectionVerticalSpacing, isSmallPhone, isTablet } = useBreakpoint();

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
              // If user is signed in, only delete their receipts; otherwise delete all local receipts
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: contentHorizontalPadding,
            paddingBottom: sectionVerticalSpacing,
          },
        ]}
      >
        <View style={[styles.pageHeader, isSmallPhone && styles.pageHeaderCompact]}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your preferences and security</Text>
        </View>

        <View
          style={[
            styles.section,
            isSmallPhone && styles.sectionCompact,
            isTablet && styles.sectionWide,
          ]}
        >
          <Text style={styles.sectionLabel}>Security</Text>

          <View style={[styles.row, isSmallPhone && styles.rowCompact]}>
            <View style={styles.rowContent}>
              <View style={[styles.iconContainer, styles.blueIcon]}>
                <Text style={styles.iconEmoji}>🔐</Text>
              </View>
              <View style={styles.textGroup}>
                <Text style={styles.rowTitle}>Face ID / Touch ID</Text>
                <Text style={styles.rowDescription}>Secure login with biometrics</Text>
              </View>
            </View>
            <Switch
              value={faceIdEnabled}
              onValueChange={setFaceIdEnabled}
              trackColor={{ false: alpha.faintBlack, true: palette.green }}
              thumbColor={palette.white}
            />
          </View>

          <View style={[styles.row, isSmallPhone && styles.rowCompact]}>
            <View style={styles.rowContent}>
              <View style={[styles.iconContainer, styles.grayIcon]}>
                <Text style={styles.iconEmoji}>🛡️</Text>
              </View>
              <View style={styles.textGroup}>
                <Text style={styles.rowTitle}>Local Data Storage</Text>
                <Text style={styles.rowDescription}>All processing kept on device (No cloud Storage)</Text>
              </View>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.section,
            isSmallPhone && styles.sectionCompact,
            isTablet && styles.sectionWide,
          ]}
        >
          <Text style={styles.sectionLabel}>Preferences</Text>

          <View style={[styles.row, isSmallPhone && styles.rowCompact]}>
            <View style={styles.rowContent}>
              <View style={[styles.iconContainer, styles.blueIcon]}>
                <Text style={styles.iconEmoji}>🌙</Text>
              </View>
              <View style={styles.textGroup}>
                <Text style={styles.rowTitle}>Dark Mode</Text>
                <Text style={styles.rowDescription}>Reduce glare & save battery</Text>
              </View>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: alpha.faintBlack, true: palette.green }}
              thumbColor={palette.white}
            />
          </View>
        </View>

        <View
          style={[
            styles.section,
            isSmallPhone && styles.sectionCompact,
            isTablet && styles.sectionWide,
          ]}
        >
          <Text style={styles.sectionLabel}>Account</Text>

          <TouchableOpacity
            style={[styles.row, isSmallPhone && styles.rowCompact]}
            onPress={handleSignOut}
          >
            <View style={styles.rowContent}>
              <View style={[styles.iconContainer, styles.redIcon]}>
                <Text style={styles.iconEmoji}>🚪</Text>
              </View>
              <View style={styles.textGroup}>
                <Text style={[styles.rowTitle, styles.redText]}>Log Out</Text>
                <Text style={styles.rowDescription}>Return to login screen</Text>
              </View>
            </View>
            <Text style={[styles.arrow, styles.redText]}>›</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.section,
            isSmallPhone && styles.sectionCompact,
            isTablet && styles.sectionWide,
          ]}
        >
          <Text style={styles.sectionLabel}>Data Management</Text>

          <TouchableOpacity
            style={[styles.row, isSmallPhone && styles.rowCompact]}
            onPress={handleClearData}
          >
            <View style={styles.rowContent}>
              <View style={[styles.iconContainer, styles.redIcon]}>
                <Text style={styles.iconEmoji}>🗑️</Text>
              </View>
              <View style={styles.textGroup}>
                <Text style={[styles.rowTitle, styles.redText]}>Clear All Data</Text>
                <Text style={styles.rowDescription}>Delete all scanned receipts</Text>
              </View>
            </View>
            <Text style={[styles.arrow, styles.redText]}>›</Text>
          </TouchableOpacity>
        </View>
  </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  pageHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  pageHeaderCompact: {
    paddingTop: spacing.sm,
  },
  title: {
    ...typography.pageTitle,
    color: palette.black,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.pageSubtitle,
    color: alpha.subtleBlack,
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
    color: alpha.mutedBlack,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    ...shadows.level2,
  },
  rowCompact: {
    paddingVertical: spacing.sm,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  blueIcon: {
    backgroundColor: palette.blue,
  },
  grayIcon: {
    backgroundColor: alpha.faintBlack,
  },
  redIcon: {
    backgroundColor: palette.red,
  },
  iconEmoji: {
    fontSize: 22,
  },
  textGroup: {
    flex: 1,
  },
  rowTitle: {
    ...typography.bodyStrong,
    color: palette.black,
    marginBottom: spacing.xs,
  },
  rowDescription: {
    ...typography.caption,
    color: alpha.subtleBlack,
  },
  arrow: {
    fontSize: 24,
    color: alpha.mutedBlack,
  },
  redText: {
    color: palette.red,
  },
});