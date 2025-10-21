import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import * as biometric from '../hooks/useBiometricAuth';
import { palette } from '../styles/palette';

export default function LockScreen() {
  const { unlockWithBiometrics, unlockWithCredentials } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBiometric = async () => {
    setLoading(true);
    try {
      const available = await biometric.isBiometricAvailable();
      if (!available) {
        Alert.alert('Biometrics Unavailable', 'Your device does not support biometrics or none are enrolled.');
        setLoading(false);
        return;
      }
      const ok = await unlockWithBiometrics();
      if (!ok) Alert.alert('Unlock failed', 'Could not unlock using biometrics');
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Biometric unlock failed');
    }
    setLoading(false);
  };

  const handleManual = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password');
      return;
    }
    setLoading(true);
    const ok = await unlockWithCredentials(email, password);
    if (!ok) Alert.alert('Unlock failed', 'Invalid credentials');
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Locked</Text>
        <Text style={styles.subtitle}>Unlock to continue</Text>

        <TouchableOpacity style={styles.bioButton} onPress={handleBiometric} disabled={loading}>
          <Text style={styles.bioButtonText}>{loading ? 'Unlocking…' : 'Unlock with Biometrics / Passcode'}</Text>
        </TouchableOpacity>

        <Text style={styles.or}>Or enter credentials</Text>
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry autoCapitalize="none" />

        <TouchableOpacity style={styles.unlockButton} onPress={handleManual} disabled={loading}>
          <Text style={styles.unlockText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.lightGray },
  inner: { padding: 24, flex: 1, justifyContent: 'center' },
  title: { fontSize: 28, marginBottom: 8, color: palette.black, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 24, color: palette.black, textAlign: 'center' },
  bioButton: { backgroundColor: palette.green, padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  bioButtonText: { color: palette.white, fontSize: 16 },
  or: { textAlign: 'center', marginVertical: 12, color: palette.black },
  input: { backgroundColor: palette.white, padding: 12, borderRadius: 8, marginBottom: 12 },
  unlockButton: { backgroundColor: palette.blue, padding: 14, borderRadius: 8, alignItems: 'center' },
  unlockText: { color: palette.white, fontSize: 16 },
});
