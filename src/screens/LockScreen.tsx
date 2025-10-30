import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import { useAuth } from '../contexts/AuthContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import PageHeader from '../components/PageHeader';
import Logo from '../components/Logo';
import { palette } from '../styles/palette';
import { radii, spacing, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function LockScreen() {
  const { unlockWithBiometrics, unlockWithCredentials } = useAuth();
  const { contentHorizontalPadding, sectionVerticalSpacing, isSmallPhone } = useBreakpoint();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBiometric = async () => {
    setLoading(true);
    try {
      const ok = await unlockWithBiometrics();
      if (!ok) Alert.alert('Unlock failed', 'Could not unlock using biometrics');
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Biometric unlock failed');
    } finally {
      setLoading(false);
    }
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
          <Logo />
        </View>

        <PageHeader>
          <Text style={[styles.title, { color: theme.text }]}>Locked</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Unlock to continue</Text>
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

        <Text style={[styles.or, { color: theme.textSecondary }]}>Or enter credentials</Text>

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
  inner: { padding: spacing.lg, flex: 1, justifyContent: 'center' },
  title: { ...typography.pageTitle, marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { ...typography.body, marginBottom: spacing.lg, textAlign: 'center' },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoContainerCompact: {
    // allow logo to size itself on small phones
  },
  bioButton: { backgroundColor: palette.green, padding: spacing.md, borderRadius: radii.md, alignItems: 'center', marginBottom: spacing.md },
  or: { textAlign: 'center', marginVertical: spacing.md },
  unlockButton: { backgroundColor: palette.blue, padding: spacing.md, borderRadius: radii.md, alignItems: 'center' },
});
