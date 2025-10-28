import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import { useAuth } from '../contexts/AuthContext';
import * as biometric from '../hooks/useBiometricAuth';
import { useBreakpoint } from '../hooks/useBreakpoint';
import PageHeader from '../components/PageHeader';
import Logo from '../components/Logo';
import { palette } from '../styles/palette';
import { radii, spacing, typography } from '../styles/theme';

export default function LockScreen() {
  const { unlockWithBiometrics, unlockWithCredentials } = useAuth();
  const { contentHorizontalPadding, sectionVerticalSpacing, isSmallPhone } = useBreakpoint();
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
    <ScreenContainer contentStyle={{ paddingHorizontal: contentHorizontalPadding, paddingVertical: sectionVerticalSpacing }}>
      <View style={[styles.inner, { paddingHorizontal: 0 }]}> 
        <View style={[styles.logoContainer, isSmallPhone && styles.logoContainerCompact]}>
          <Logo width={160} height={72} />
        </View>

        <PageHeader>
          <Text style={styles.title}>Locked</Text>
          <Text style={styles.subtitle}>Unlock to continue</Text>
        </PageHeader>

        <SecondaryButton
          onPress={handleBiometric}
          disabled={loading}
          accessibilityLabel="Unlock with biometrics"
          style={styles.bioButton}
          textStyle={{ color: palette.white }}
        >
          {loading ? 'Unlocking…' : 'Unlock with Biometrics / Passcode'}
        </SecondaryButton>

        <Text style={styles.or}>Or enter credentials</Text>

        <FormInput placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <FormInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />

        <PrimaryButton style={styles.unlockButton} onPress={handleManual} disabled={loading} accessibilityLabel="Unlock with credentials">
          Unlock
        </PrimaryButton>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.lightGray },
  inner: { padding: 24, flex: 1, justifyContent: 'center' },
  title: { fontSize: 28, marginBottom: 8, color: palette.black, textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 24, color: palette.black, textAlign: 'center' },
  logoContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoContainerCompact: {
    height: 84,
  },
  bioButton: { backgroundColor: palette.green, padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  bioButtonText: { color: palette.white, fontSize: 16 },
  or: { textAlign: 'center', marginVertical: 12, color: palette.black },
  input: { backgroundColor: palette.white, padding: 12, borderRadius: 8, marginBottom: 12 },
  unlockButton: { backgroundColor: palette.blue, padding: 14, borderRadius: 8, alignItems: 'center' },
  unlockText: { color: palette.white, fontSize: 16 },
});
