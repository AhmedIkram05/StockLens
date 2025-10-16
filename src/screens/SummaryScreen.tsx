import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../styles/palette';
import { radii, shadows, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useEffect, useState } from 'react';
import { stockService, receiptService } from '../services/dataService';
import { getHistoricalCAGRFromToday, projectUsingHistoricalCAGR } from '../services/projectionService';
import { ScrollView } from 'react-native';
import { ensureHistoricalPrefetch, PREFETCH_TICKERS } from '../services/dataService';
import { subscribe } from '../services/eventBus';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function SummaryScreen() {
  const { user } = useAuth();
  const [totalMoneySpent, setTotalMoneySpent] = useState<number>(0);
  const [totalMissedFiveYears, setTotalMissedFiveYears] = useState<number>(0);
  const [receiptsScanned, setReceiptsScanned] = useState<number>(0);
  const [highestImpactReceipt, setHighestImpactReceipt] = useState<any | null>(null);
  const [totalMissedTenYears, setTotalMissedTenYears] = useState<number>(0);
  const [avgPerReceipt, setAvgPerReceipt] = useState<number>(0);
  const [mostActiveMonth, setMostActiveMonth] = useState<string | null>(null);
  const [bestByPeriod, setBestByPeriod] = useState<Record<number, { symbol: string; rate: number }>>({});

  // Top-3 stocks removed; replaced by compound calculator card.

  useEffect(() => {
    let mounted = true;
    async function loadTotals() {
      try {
        if (!user?.uid) return;
        const receipts = await receiptService.getByUserId(user.uid);
        const total = receipts.reduce((s, r) => s + (r.total_amount || 0), 0);
        if (!mounted) return;
        setTotalMoneySpent(total);
        setReceiptsScanned(receipts.length);
        setAvgPerReceipt(receipts.length > 0 ? total / receipts.length : 0);

        // highest impact receipt (largest total_amount)
        const highest = receipts.slice().sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))[0] ?? null;
        setHighestImpactReceipt(highest ?? null);

        // most active month: month with most receipts
        if (receipts.length > 0) {
          const counts: Record<string, number> = {};
          receipts.forEach(r => {
            const d = r.date_scanned ? new Date(r.date_scanned) : new Date();
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            counts[key] = (counts[key] || 0) + 1;
          });
          const sortedMonths = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
          if (sortedMonths.length > 0) {
            const top = sortedMonths[0];
            const [y, m] = top.split('-');
            const monthName = new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-GB', { month: 'short', year: 'numeric' });
            setMostActiveMonth(monthName);
          }
        }

  const tickers = PREFETCH_TICKERS;
        const perTicker = total / Math.max(1, tickers.length);
        const futures = await Promise.all(
          tickers.map(async t => {
            try {
              // Use unified historical CAGR computed from today - 5 years to today
              const { futureValue } = await projectUsingHistoricalCAGR(perTicker, t, 5);
              return futureValue;
            } catch (e) {
              // fallback: use preset projection for perTicker
              try {
                const { futureValue } = await projectUsingHistoricalCAGR(perTicker, t, 5);
                return futureValue;
              } catch {
                return perTicker * 1.15;
              }
            }
          })
        );
  const totalFuture5 = futures.reduce((s, v) => s + v, 0);
  if (mounted) setTotalMissedFiveYears(Math.round(totalFuture5));
        // For 10y, compute projection using historical 10-year CAGR if available per ticker, else extrapolate from 5y
        const futures10 = await Promise.all(
          tickers.map(async t => {
            try {
              const { futureValue } = await projectUsingHistoricalCAGR(perTicker, t, 10);
              return futureValue;
            } catch {
              // fallback: extrapolate 10y from 5y result conservatively
              return (perTicker * 1.15) * 1.5;
            }
          })
        );
        const totalFuture10 = futures10.reduce((s, v) => s + v, 0);
        if (mounted) setTotalMissedTenYears(Math.round(totalFuture10));

        // Compute best performing ticker per period (1,3,5,10,20)
        const periods = [1, 3, 5, 10, 20];
        const bests: Record<number, { symbol: string; rate: number }> = {};
        await Promise.all(
          periods.map(async years => {
            let bestSym = '';
            let bestRate = -Infinity;
            await Promise.all(
              tickers.map(async t => {
                try {
                  const cagr = await getHistoricalCAGRFromToday(t, years);
                  const rate = cagr ?? 0;
                  if (rate > bestRate) {
                    bestRate = rate;
                    bestSym = t;
                  }
                } catch (e) {
                  // ignore per-ticker failures
                }
              })
            );
            bests[years] = { symbol: bestSym, rate: isFinite(bestRate) ? bestRate : 0 };
          })
        );
        if (mounted) setBestByPeriod(bests);
      } catch (err) {
        // ignore errors for now
      }
    }

    // Ensure local prefetch/cache of common tickers to avoid hitting API limits
    ensureHistoricalPrefetch().catch(() => {});

  loadTotals();
    const unsub = subscribe('historical-updated', () => {
      // re-run totals when historical data updates
      loadTotals().catch(() => {});
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [user?.uid]);

  const reloadTotals = async () => {
    // re-run same loadTotals behavior by emitting a historical-updated or calling ensureHistoricalPrefetch
    try {
      await ensureHistoricalPrefetch();
    } catch {}
  };

  // Top-3 stocks removed — no longer computing nor fetching here.

  const quickStats = [
    { label: 'Average per receipt', value: '£12.35' },
    { label: 'Most active month', value: 'Oct 2025' },
  ];

  const insights = [
    {
      emoji: '📈',
      title: 'Consistent Growth Patterns',
      description: 'Your spending shows strong investment potential across all categories',
    },
    {
      emoji: '🎯',
      title: 'Diversification Opportunity',
      description: 'Consider spreading purchases across different stock sectors',
    },
    {
      emoji: '⏰',
      title: 'Time Horizon Matters',
      description: 'Longer investment periods show significantly better returns',
    },
    {
      emoji: '⚠️',
      title: 'Educational Purpose Only',
      description: 'These are hypothetical calculations, not investment advice',
    },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const { contentHorizontalPadding, cardsPerRow, width: screenWidth, isTablet } = useBreakpoint();
  const cardsGap = cardsPerRow === 3 ? spacing.xl : spacing.md;
  const cardsGridStyle = React.useMemo(
    () => ({ marginHorizontal: -(cardsGap / 2) }),
    [cardsGap]
  );
  const cardWidth = React.useMemo(() => {
    const containerWidth = Math.max(screenWidth - contentHorizontalPadding * 2, 240);
    const totalGap = cardsGap * (cardsPerRow - 1);
    const rawWidth = (containerWidth - totalGap) / cardsPerRow;
    const desiredMin = isTablet ? 220 : 140;
    const minWidth = Math.min(rawWidth, desiredMin);
    const maxWidth = isTablet ? 280 : 220;
    return Math.max(minWidth, Math.min(maxWidth, rawWidth));
  }, [cardsPerRow, cardsGap, contentHorizontalPadding, isTablet, screenWidth]);
  const cardLayoutStyle = React.useMemo(
    () => ({ width: cardWidth, marginHorizontal: cardsGap / 2 }),
    [cardWidth, cardsGap]
  );
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingHorizontal: contentHorizontalPadding }]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Summary</Text>
          <Text style={styles.subtitle}>Your investment insights at a glance</Text>
        </View>

        {/* (Compound calculator will be shown below in place of Top‑3) */}

        <View style={[styles.cardsGrid, cardsGridStyle]}>
          {/* Highest impact receipt */}
          <View style={[styles.card, cardLayoutStyle, styles.cardWhite]}>
            <Text style={[styles.cardTitleDark]}>Highest impact receipt</Text>
            {highestImpactReceipt ? (
              <>
                <Text style={[styles.cardValue, styles.cardValueDark]}>
                  {highestImpactReceipt.total_amount ? formatCurrency(highestImpactReceipt.total_amount) : '—'}
                </Text>
                <Text style={styles.cardSubtitleDark} numberOfLines={2}>
                  {highestImpactReceipt.ocr_data ? JSON.stringify(highestImpactReceipt.ocr_data).slice(0, 80) : 'Receipt details'}
                </Text>
              </>
            ) : (
              <Text style={styles.cardSubtitleDark}>No receipts yet</Text>
            )}
          </View>

          {/* Average per receipt */}
          <View style={[styles.card, cardLayoutStyle, styles.cardBlue]}>
            <Text style={styles.cardTitle}>Average per receipt</Text>
            <Text style={styles.cardValue}>{formatCurrency(Math.round(avgPerReceipt || 0))}</Text>
            <Text style={styles.cardSubtitle}>Calculated across scanned receipts</Text>
          </View>

          {/* Most active month */}
          <View style={[styles.card, cardLayoutStyle, styles.cardGreen]}>
            <Text style={styles.cardTitle}>Most active month</Text>
            <Text style={styles.cardValue}>{mostActiveMonth ?? '—'}</Text>
            <Text style={styles.cardSubtitle}>Month with most receipts</Text>
          </View>
        </View>

        {/* Compound interest calculator CTA (navigates to full page) */}
        <View style={{ width: '100%', marginTop: spacing.md }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open compound interest calculator page"
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Calculator' as never)}
          >
            <View style={[styles.card, { padding: spacing.lg, backgroundColor: palette.white }]}> 
              <Text style={styles.cardTitleDark}>Compound interest calculator</Text>
              <Text style={styles.cardSubtitleDark}>Open calculator page</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick stats removed per request */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Investment Insights</Text>
        </View>

        <View style={styles.insightsList}>
          {insights.map(item => (
            <View key={item.title} style={styles.insightCard}>
              <Text style={styles.insightEmoji}>{item.emoji}</Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{item.title}</Text>
                <Text style={styles.insightDescription}>{item.description}</Text>
              </View>
            </View>
          ))}
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
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.pageTitle,
    color: palette.black,
  },
  subtitle: {
    marginTop: spacing.sm,
    ...typography.pageSubtitle,
    color: palette.black,
    opacity: 0.7,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  card: {
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.level2,
  },
  cardBlue: {
    backgroundColor: palette.blue,
  },
  cardGreen: {
    backgroundColor: palette.green,
  },
  cardWhite: {
    backgroundColor: palette.white,
  },
  cardValue: {
    ...typography.metric,
    color: palette.white,
    marginBottom: spacing.sm,
  },
  cardValueDark: {
    color: palette.black,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: palette.white,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  cardSubtitle: {
    ...typography.caption,
    color: palette.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  cardTitleDark: {
    ...typography.bodyStrong,
    color: palette.black,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  cardSubtitleDark: {
    ...typography.caption,
    color: palette.black,
    opacity: 0.7,
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: palette.black,
  },
  stockList: {
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.level2,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.lightGray,
  },
  stockInfo: {
    flexShrink: 1,
    paddingRight: spacing.md,
  },
  stockCompany: {
    ...typography.bodyStrong,
    color: palette.black,
    marginBottom: spacing.xs,
  },
  stockMeta: {
    ...typography.caption,
    color: palette.black,
    opacity: 0.6,
  },
  stockGrowthContainer: {
    alignItems: 'flex-end',
  },
  stockGrowth: {
    ...typography.metricSm,
    color: palette.green,
  },
  stockPeriod: {
    ...typography.overline,
    color: palette.black,
    opacity: 0.6,
    marginTop: spacing.xs,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: spacing.md,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    ...shadows.level1,
    marginBottom: spacing.md,
  },
  quickStatCardMargin: {
    marginRight: spacing.md,
  },
  quickStatValue: {
    ...typography.metricSm,
    color: palette.black,
    marginBottom: spacing.sm,
  },
  quickStatLabel: {
    ...typography.caption,
    color: palette.black,
    opacity: 0.6,
    textAlign: 'center',
  },
  insightsList: {
    marginBottom: spacing.xl,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.level1,
  },
  insightEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...typography.bodyStrong,
    color: palette.black,
    marginBottom: spacing.xs,
  },
  insightDescription: {
    ...typography.caption,
    color: palette.black,
    opacity: 0.6,
  },
  
});