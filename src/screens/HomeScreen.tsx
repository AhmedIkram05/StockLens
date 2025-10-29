import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';

import { palette, alpha } from '../styles/palette';
import { radii, shadows, spacing, typography } from '../styles/theme';
import ScreenContainer from '../components/ScreenContainer';
import ResponsiveContainer from '../components/ResponsiveContainer';
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

  const { contentHorizontalPadding, sectionVerticalSpacing, isTablet, isLargePhone, width } = useBreakpoint();
  const scrollPadding = useMemo(() => ({ paddingBottom: sectionVerticalSpacing }), [sectionVerticalSpacing]);
  // contentWidth used for computing grid item sizes
  const contentWidth = Math.min(width - contentHorizontalPadding * 2, isTablet ? 960 : width - contentHorizontalPadding * 2);

  const formatAmount = (amount: number) => formatCurrencyGBP(amount || 0);

  // live portfolio projection (MVP) — compute example projection using 3 tickers
  const [portfolioProjection, setPortfolioProjection] = useState<number | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

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
    <ScreenContainer contentStyle={{ paddingVertical: sectionVerticalSpacing }}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {hasScans ? (
          <>
            <ResponsiveContainer maxWidth={isTablet ? 960 : width - contentHorizontalPadding * 2}>
              <PageHeader>
                <View style={styles.titleContainer}>
                  <Text style={styles.titlePrefix}>Your </Text>
                  <Text style={styles.titleStock}>Stock</Text>
                  <Text style={styles.titleLens}>Lens</Text>
                </View>
                <Text style={styles.subtitle}>What if you invested instead?</Text>
              </PageHeader>

            <View style={styles.statsContainer}>
              <StatCard
                value={formatAmount(totalMoneySpentDerived)}
                label="Total Money Spent"
                subtitle="Across all scanned receipts"
                variant="green"
              />
              <StatCard
                value={allScans.length}
                label="Receipts Scanned"
                variant="blue"
              />
            </View>

            <View style={styles.recentScans}>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
              {(() => {
                const preview = allScans.slice(0, 3);
                const list = showAllHistory ? allScans : preview;
                const cols = isTablet ? 2 : 1;
                // Use percentage widths so items wrap cleanly without negative margins
                const itemWidthPercent = `${100 / cols}%`;

                return (
                  // grid wrapper — keep simple row/wrap layout; padding is handled
                  // by ScreenContainer / ResponsiveContainer so we don't double-pad
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {list.map((scan) => (
                      <View
                        key={scan.id}
                        // flexBasis percentage ensures consistent wrapping; cast to any to satisfy RN typing for percentage strings
                        style={{ flexBasis: `${100 / cols}%`, paddingHorizontal: spacing.xs } as any}
                      >
                        <View style={{ width: '100%' }}>
                          <ReceiptCard
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
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })()}

              <TouchableOpacity style={styles.viewAllButton} onPress={() => setShowAllHistory(!showAllHistory)}>
                <Text style={styles.viewAllText}>{showAllHistory ? 'Show Less' : 'View all history'}</Text>
              </TouchableOpacity>
            </View>
            </ResponsiveContainer>
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

            <ResponsiveContainer maxWidth={isTablet ? 960 : width - contentHorizontalPadding * 2}>
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
            </ResponsiveContainer>
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
    // keep side-by-side on all devices
  },
  statCardGreen: {
    backgroundColor: palette.green,
    borderRadius: radii.md,
    padding: spacing.lg,
    width: '48%',
    alignItems: 'center',
    ...shadows.level2,
    marginBottom: spacing.md,
  },
  statCardBlue: {
    backgroundColor: palette.blue,
    borderRadius: radii.md,
    padding: spacing.lg,
    width: '48%',
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
  onboardingCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  onboardingCardTablet: {
    flex: 1,
    marginHorizontal: spacing.sm,
    // avoid hardcoded minWidth; derive from theme tokens
    minWidth: Math.round(spacing.xxl * 5),
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
    width: Math.round(spacing.xxl * 1.5),
    height: Math.round(spacing.xxl * 1.5),
    borderRadius: radii.pill,
    backgroundColor: palette.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  numberCircleTablet: {
    width: Math.round(spacing.xxl * 2),
    height: Math.round(spacing.xxl * 2),
    marginRight: spacing.lg,
  },
  numberText: {
    color: palette.white,
    ...typography.metricSm,
  },
  numberTextTablet: {
    // use theme typography sizes instead of hardcoded values
    fontSize: (typography.metric && (typography.metric.fontSize as number)) || 20,
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
    // derive lineHeight from the caption font size so it scales on tablets
    lineHeight: Math.round(((typography.caption.fontSize as number) || 14) * 1.4),
  },
});