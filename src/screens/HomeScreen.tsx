import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { palette, alpha } from '../styles/palette';
import { radii, shadows, spacing, typography } from '../styles/theme';
import type { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  StackNavigationProp<RootStackParamList>
>;
// Temporary mock data for recent scans - to be replaced with real data from backend
export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [showAllHistory, setShowAllHistory] = useState(false);

  const recentScans = useMemo(
    () => [
      {
        id: 'receipt-001',
        merchant: 'Tesco Superstore',
        amount: 42.78,
        date: '15 Sep 2025',
        time: '2 hours ago',
        image:
          'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=200&q=60',
      },
      {
        id: 'receipt-002',
        merchant: 'Starbucks',
        amount: 8.5,
        date: '14 Sep 2025',
        time: '1 day ago',
        image:
          'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=200&q=60',
      },
    ],
    []
  );

  const allScans = recentScans;

  // Check if user has any scans
  const hasScans = recentScans.length > 0;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {hasScans ? (
          // Regular dashboard with scans
          <>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.titlePrefix}>Your </Text>
                <Text style={styles.titleStock}>Stock</Text>
                <Text style={styles.titleLens}>Lens</Text>
              </View>
              <Text style={styles.subtitle}>What if you invested instead?</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statCardGreen}>
                <Text style={styles.statValue}>£12,450</Text>
                {/* Mock total possible value to be replaced with real calculation for 5 year projection */}
                <Text style={styles.statLabel}>Total Possible Value (5 Yrs)</Text>
              </View>
              <View style={styles.statCardBlue}>
                <Text style={styles.statValue}>{recentScans.length}</Text>
                <Text style={styles.statLabel}>Receipts Scanned</Text>
              </View>
            </View>

            <View style={styles.recentScans}>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
              {(showAllHistory ? allScans : recentScans).map((scan) => (
                <TouchableOpacity
                  key={scan.id}
                  style={styles.scanCard}
                  onPress={() =>
                    navigation.navigate('ReceiptDetails', {
                      receiptId: scan.id,
                      merchantName: scan.merchant,
                      totalAmount: scan.amount,
                      date: scan.date,
                      image: scan.image,
                    })
                  }
                >
                  <Image source={{ uri: scan.image }} style={styles.scanImage} />
                  <View style={styles.scanInfo}>
                    <Text style={styles.scanAmount}>{formatAmount(scan.amount)}</Text>
                    <Text style={styles.scanMerchant}>{scan.merchant}</Text>
                    <Text style={styles.scanTime}>{scan.time}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => setShowAllHistory(!showAllHistory)}
              >
                <Text style={styles.viewAllText}>
                  {showAllHistory ? 'Show Less' : 'View all history'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // Empty state dashboard
          <>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.titlePrefix}>Your </Text>
                <Text style={styles.titleStock}>Stock</Text>
                <Text style={styles.titleLens}>Lens</Text>
              </View>
              <Text style={styles.subtitle}>Track your missed opportunities</Text>
            </View>

            <View style={styles.emptyStateContainer}>
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark-circle" size={120} color={palette.green} />
              </View>

              <Text style={styles.emptyTitle}>No Receipts Yet</Text>
              <Text style={styles.emptySubtitle}>
                Scan your first receipt to discover what your purchases could have been worth
              </Text>

              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => navigation.navigate('Scan' as never)}
              >
                <Ionicons name="camera-outline" size={24} color={palette.white} />
                <Text style={styles.scanButtonText}>Scan your first receipt</Text>
              </TouchableOpacity>

              <View style={styles.onboardingCards}>
                <View style={styles.onboardingCard}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>1</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Scan Your Receipt</Text>
                    <Text style={styles.cardSubtitle}>Take a photo of any receipt to get started</Text>
                  </View>
                </View>

                <View style={styles.onboardingCard}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>2</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>See Investment Potential</Text>
                    <Text style={styles.cardSubtitle}>Discover what your spending could be worth if invested</Text>
                  </View>
                </View>

                <View style={styles.onboardingCard}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>3</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Track Your Progress</Text>
                    <Text style={styles.cardSubtitle}>Monitor your spending patterns and investment opportunities</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
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
  header: {
    backgroundColor: palette.lightGray,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titlePrefix: {
    ...typography.pageTitle,
    color: palette.black,
  },
  titleStock: {
    ...typography.pageTitle,
    color: palette.black,
  },
  titleLens: {
    ...typography.pageTitle,
    color: palette.green,
  },
  subtitle: {
    ...typography.pageSubtitle,
    color: palette.black,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    justifyContent: 'space-between',
  },
  statCardGreen: {
    backgroundColor: palette.green,
    borderRadius: radii.md,
    padding: spacing.lg,
    flex: 1,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    ...shadows.level2,
  },
  statCardBlue: {
    backgroundColor: palette.blue,
    borderRadius: radii.md,
    padding: spacing.lg,
    flex: 1,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    ...shadows.level2,
  },
  statValue: {
    ...typography.metric,
    color: palette.white,
    marginBottom: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
    color: palette.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  quickActions: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: palette.black,
    opacity: 0.85,
    marginBottom: spacing.md,
  },
  recentScans: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  scanCard: {
    backgroundColor: palette.white,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.level1,
  },
  scanImage: {
    width: 60,
    height: 40,
    borderRadius: radii.sm,
    marginRight: spacing.md,
  },
  scanInfo: {
    flex: 1,
  },
  scanAmount: {
    ...typography.bodyStrong,
    color: palette.black,
    marginBottom: spacing.xs,
  },
  scanTime: {
    ...typography.caption,
    color: alpha.subtleBlack,
  },
  scanMerchant: {
    ...typography.captionStrong,
    color: palette.black,
    opacity: 0.75,
  },
  chevron: {
    fontSize: 24,
    color: alpha.mutedBlack,
    fontWeight: '600',
  },
  viewAllButton: {
    backgroundColor: palette.green,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  viewAllText: {
    color: palette.white,
    ...typography.button,
  },
  emptyStateContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  checkmarkContainer: {
    marginVertical: spacing.xl,
  },
  emptyTitle: {
    ...typography.pageTitle,
    color: palette.black,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    color: alpha.subtleBlack,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  scanButton: {
    backgroundColor: palette.green,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    ...shadows.level2,
  },
  scanButtonText: {
    color: palette.white,
    ...typography.button,
    marginLeft: spacing.sm,
  },
  onboardingCards: {
    width: '100%',
  },
  onboardingCard: {
    backgroundColor: palette.white,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.level1,
  },
  numberCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: palette.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  numberText: {
    color: palette.white,
    ...typography.metricSm,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: palette.black,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.caption,
    color: alpha.subtleBlack,
    lineHeight: 20,
  },
});