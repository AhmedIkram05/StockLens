import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';

import { palette, alpha } from '../styles/palette';
import { radii, shadows, spacing, typography } from '../styles/theme';
import ScreenContainer from '../components/ScreenContainer';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ReceiptCard from '../components/ReceiptCard';
import EmptyState from '../components/EmptyState';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { projectUsingHistoricalCAGR } from '../services/projectionService';
import useReceipts from '../hooks/useReceipts';
import { formatCurrencyGBP, formatRelativeDate } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import type { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  StackNavigationProp<RootStackParamList>
>;
export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [showAllHistory, setShowAllHistory] = useState(false);

  const { user } = useAuth();
  const { receipts: allScans, loading: receiptsLoading, error: receiptsError } = useReceipts(user?.uid);

  // Check if user has any scans
  const hasScans = allScans.length > 0;

  const { contentHorizontalPadding, sectionVerticalSpacing, isTablet, isLargePhone } = useBreakpoint();
  const scrollPadding = useMemo(
    () => ({ paddingBottom: sectionVerticalSpacing }),
    [sectionVerticalSpacing]
  );
  const stackStats = !isTablet && !isLargePhone;

  const formatAmount = (amount: number) => formatCurrencyGBP(amount || 0);

  // live portfolio projection (MVP) — compute example projection using 3 tickers
  const [portfolioProjection, setPortfolioProjection] = useState<number | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  // totalSpend derived from receipts (replaces placeholder)
  const [totalSpend, setTotalSpend] = useState<number>(0);

  const totalMoneySpentDerived = useMemo(() => {
    return allScans.reduce((s, r) => s + (r.amount || 0), 0);
  }, [allScans]);

  const formatReceiptLabel = (iso?: string) => formatRelativeDate(iso);

  // note: no local focus-driven behaviour needed after hook extraction


  useEffect(() => {
    let mounted = true;
    async function loadProjection() {
      setPortfolioLoading(true);
      setPortfolioError(null);
      try {
        const effectiveTotal = totalSpend || 0;
        const tickers = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'NKE'];
        const perTicker = (effectiveTotal / tickers.length) || 0;
        const results = await Promise.all(
          tickers.map(async (t) => {
            try {
              const { futureValue } = await projectUsingHistoricalCAGR(perTicker, t, 5);
              return futureValue;
            } catch (e) {
              return perTicker * 1.15;
            }
          })
        );
        if (!mounted) return;
        const totalFuture = results.reduce((s, v) => s + v, 0);
        setPortfolioProjection(totalFuture);
      } catch (err: any) {
        if (mounted) setPortfolioError(err?.message || String(err));
      } finally {
        if (mounted) setPortfolioLoading(false);
      }
    }
    loadProjection();
    return () => {
      mounted = false;
    };
  }, [totalSpend]);

  return (
    <ScreenContainer contentStyle={scrollPadding}>
      <ScrollView style={styles.scrollView}>
        {hasScans ? (
          <>
            <PageHeader>
              <View style={styles.titleContainer}>
                <Text style={styles.titlePrefix}>Your </Text>
                <Text style={styles.titleStock}>Stock</Text>
                <Text style={styles.titleLens}>Lens</Text>
              </View>
              <Text style={styles.subtitle}>What if you invested instead?</Text>
            </PageHeader>

            <View style={[styles.statsContainer, stackStats && styles.statsStacked]}>
              <StatCard
                value={formatAmount(totalMoneySpentDerived)}
                label="Total Money Spent"
                subtitle="Across all scanned receipts"
                variant="green"
                style={stackStats ? styles.statCardFullWidth : undefined}
              />
              <StatCard
                value={allScans.length}
                label="Receipts Scanned"
                variant="blue"
                style={stackStats ? styles.statCardFullWidth : undefined}
              />
            </View>

            <View style={styles.recentScans}>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
              {(() => {
                const preview = allScans.slice(0, 3);
                const list = showAllHistory ? allScans : preview;
                return list.map((scan) => (
                  <ReceiptCard
                    key={scan.id}
                    image={scan.image}
                    amount={formatAmount(scan.amount)}
                    merchant={scan.merchant ?? formatReceiptLabel(scan.date)}
                    time={scan.time}
                    onPress={() =>
                      navigation.navigate('ReceiptDetails', {
                        receiptId: scan.id,
                        totalAmount: scan.amount,
                        date: scan.date,
                        image: scan.image,
                      })
                    }
                  />
                ));
              })()}

              <TouchableOpacity style={styles.viewAllButton} onPress={() => setShowAllHistory(!showAllHistory)}>
                <Text style={styles.viewAllText}>{showAllHistory ? 'Show Less' : 'View all history'}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <PageHeader>
              <View style={styles.titleContainer}>
                <Text style={styles.titlePrefix}>Your </Text>
                <Text style={styles.titleStock}>Stock</Text>
                <Text style={styles.titleLens}>Lens</Text>
              </View>
              <Text style={styles.subtitle}>Track your missed opportunities</Text>
            </PageHeader>

            <View style={styles.emptyStateContainer}>
              <EmptyState
                title="No Receipts Yet"
                subtitle="Scan your first receipt to discover what your purchases could have been worth"
                primaryText="Scan your first receipt"
                onPrimaryPress={() => navigation.navigate('MainTabs' as any, { screen: 'Scan' })}
              />

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
    </ScreenContainer>
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
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    flexWrap: 'wrap',
  },
  statsStacked: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  statCardGreen: {
    backgroundColor: palette.green,
    borderRadius: radii.md,
    padding: spacing.lg,
    flex: 1,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    ...shadows.level2,
    marginBottom: spacing.md,
  },
  statCardBlue: {
    backgroundColor: palette.blue,
    borderRadius: radii.md,
    padding: spacing.lg,
    flex: 1,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    ...shadows.level2,
    marginBottom: spacing.md,
  },
  statSubtitle: {
    ...typography.caption,
    color: palette.white,
    opacity: 0.9,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  statCardFullWidth: {
    width: '100%',
    marginHorizontal: 0,
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
  sectionTitle: {
    ...typography.sectionTitle,
    color: palette.black,
    opacity: 0.85,
    marginBottom: spacing.md,
  },
  recentScans: {
    paddingBottom: spacing.xl,
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
    paddingBottom: spacing.xxl,
    alignItems: 'center',
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