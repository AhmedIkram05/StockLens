import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsScreen() {
  const { signOutUser } = useAuth();
  const [faceIdEnabled, setFaceIdEnabled] = useState(true);
  const [localStorageEnabled, setLocalStorageEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

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
          onPress: () => Alert.alert('Data Cleared', 'All scanned data has been cleared locally.'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.pageHeader}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your preferences and security</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Security</Text>

          <View style={styles.row}>
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
              trackColor={{ false: '#d1d5db', true: '#10b981' }}
              thumbColor={'#ffffff'}
            />
          </View>

          <View style={styles.row}>
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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferences</Text>

          <View style={styles.row}>
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
              trackColor={{ false: '#d1d5db', true: '#10b981' }}
              thumbColor={'#ffffff'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>

          <TouchableOpacity style={styles.row} onPress={handleSignOut}>
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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data Management</Text>

          <TouchableOpacity style={styles.row} onPress={handleClearData}>
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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  pageHeader: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 18,
    color: '#4b5563',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  blueIcon: {
    backgroundColor: '#007AFF',
  },
  grayIcon: {
    backgroundColor: '#d1d5db',
  },
  redIcon: {
    backgroundColor: '#FF3B30',
  },
  iconEmoji: {
    fontSize: 22,
  },
  textGroup: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  rowDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  arrow: {
    fontSize: 24,
    color: '#d1d5db',
  },
  redText: {
    color: '#FF3B30',
  },
});