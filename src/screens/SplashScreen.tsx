import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

export default function SplashScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleGetStarted = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logoText}>
            Stock
            <Text style={styles.logoAccent}>Lens</Text>
          </Text>
          <Text style={styles.tagline}>Scan your Spending</Text>
          <Text style={styles.tagline}>See your missed Investing</Text>
        </View>

        <View style={styles.graphContainer}>
          <View style={[styles.graphLine, styles.segmentOne]} />
          <View style={[styles.graphLine, styles.segmentTwo]} />
          <View style={[styles.graphLine, styles.segmentThree]} />
        </View>

        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85} onPress={handleGetStarted}>
          <Text style={styles.ctaText}>Let&apos;s Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 12,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 16,
  },
  logoAccent: {
    color: '#10b981',
  },
  tagline: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#1f2937',
    marginBottom: 6,
  },
  graphContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  graphLine: {
    position: 'absolute',
    backgroundColor: '#10b981',
    height: 10,
    borderRadius: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  segmentOne: {
    width: 160,
    bottom: 140,
    left: -40,
    transform: [{ rotate: '28deg' }],
  },
  segmentTwo: {
    width: 200,
    bottom: 90,
    left: 80,
    transform: [{ rotate: '-22deg' }],
  },
  segmentThree: {
    width: 220,
    bottom: 32,
    left: 120,
    transform: [{ rotate: '30deg' }],
  },
  ctaButton: {
    backgroundColor: '#10b981',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 3,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
