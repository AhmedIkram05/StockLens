import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp, useIsFocused } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { palette, alpha } from '../styles/palette';
import { radii, shadows, spacing, typography } from '../styles/theme';
import ScreenContainer from '../components/ScreenContainer';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ReceiptCard from '../components/ReceiptCard';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { stockService, receiptService } from '../services/dataService';
import { subscribe } from '../services/eventBus';
import { RefreshControl } from 'react-native';
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
  const [allScans, setAllScans] = useState<any[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [receiptsError, setReceiptsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Check if user has any scans
  const hasScans = allScans.length > 0;

  const { contentHorizontalPadding, sectionVerticalSpacing, isTablet, isLargePhone } = useBreakpoint();
  const horizontalPad = useMemo(
    () => ({ paddingHorizontal: contentHorizontalPadding }),
    [contentHorizontalPadding]
  );
  const scrollPadding = useMemo(
    () => ({ paddingBottom: sectionVerticalSpacing }),
    [sectionVerticalSpacing]
  );
  const stackStats = !isTablet && !isLargePhone;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(amount);

  // live portfolio projection (MVP) — compute example projection using 3 tickers
  const [portfolioProjection, setPortfolioProjection] = useState<number | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  // totalSpend derived from receipts (replaces placeholder)
  const [totalSpend, setTotalSpend] = useState<number>(0);

  const totalMoneySpentDerived = useMemo(() => {
    return allScans.reduce((s, r) => s + (r.amount || 0), 0);
  }, [allScans]);

  // Friendly relative date for receipt cards
  const formatReceiptLabel = (isoDate?: string) => {
    if (!isoDate) return 'Receipt';
    try {
      const d = new Date(isoDate);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 60) return `${diffSec}s ago`;
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays} days ago`;

      // older: show localized short date (e.g., 15 Oct 2025)
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Receipt';
    }
  };

  const isFocused = useIsFocused();

  const mountedRef = useRef(true);

  const fetchReceipts = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setReceiptsLoading(true);
    setReceiptsError(null);
    try {
      if (!user?.uid) {
        setAllScans([]);
        return;
      }
      const receipts = await receiptService.getByUserId(user.uid);
      if (!mountedRef.current) return;
      // Map to UI-friendly shape (minimal)
      const mapped = receipts.map(r => ({
        id: String(r.id),
        merchant: formatReceiptLabel(r.date_scanned),
        amount: r.total_amount || 0,
        date: r.date_scanned || '',
        time: '',
        image: r.image_uri || undefined,
      }));
      setAllScans(mapped);
    } catch (err: any) {
      if (mountedRef.current) setReceiptsError(err?.message || String(err));
    } finally {
      if (mountedRef.current && !opts.silent) setReceiptsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    mountedRef.current = true;
    // initial load
    fetchReceipts().catch(() => {});

    // subscribe to receipts-changed event so UI refreshes immediately
    const unsub = subscribe('receipts-changed', async (payload) => {
      // if payload includes userId and it doesn't match current user, ignore
      if (payload?.userId && payload.userId !== user?.uid) return;
      await fetchReceipts({ silent: true });
    });

    return () => {
      mountedRef.current = false;
      try { unsub(); } catch (e) {}
    };
  }, [fetchReceipts]);

  // Poll while focused
  useEffect(() => {
    if (!isFocused) return;
    const id = setInterval(() => {
      fetchReceipts({ silent: true }).catch(() => {});
    }, 30000); // 30s
    return () => clearInterval(id);
  }, [isFocused, fetchReceipts]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchReceipts();
    } catch (e) {
      // noop
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    async function loadProjection() {
      setPortfolioLoading(true);
      setPortfolioError(null);
      try {
        // ensure receipts are loaded and compute total spend
        try {
          if (user?.uid) {
            const receipts = await receiptService.getByUserId(user.uid);
            const sum = receipts.reduce((s, r) => s + (r.total_amount || 0), 0);
            if (mounted) setTotalSpend(sum);
          }
        } catch (e) {
          // ignore and continue with totalSpend state (defaults to 0)
        }

        const effectiveTotal = totalSpend || 0;
  const tickers = ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'NKE'];
        const perTicker = effectiveTotal / tickers.length || 0;
        const results = await Promise.all(
          tickers.map(async t => {
            try {
              const data = await stockService.getHistoricalForTicker(t, 5);
              const first = data[0]?.adjustedClose ?? data[0]?.close;
              const last = data[data.length - 1]?.adjustedClose ?? data[data.length - 1]?.close;
              if (!first || !last) return perTicker; // fallback: no growth
              const cagr = Math.pow(last / first, 1 / 5) - 1;
              const future = perTicker * Math.pow(1 + cagr, 5);
              return future;
            } catch (e) {
              return perTicker * 1.15; // fallback 15% growth
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
  }, []);

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
                    merchant={scan.merchant}
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
  quickActions: {
    paddingVertical: spacing.md,
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