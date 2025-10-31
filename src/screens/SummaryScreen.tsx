import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import PageHeader from '../components/PageHeader';
import { useTheme } from '../contexts/ThemeContext';
import { radii, shadows, spacing, typography, sizes } from '../styles/theme';
import { palette } from '../styles/palette';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useEffect, useState } from 'react';
import { getHistoricalCAGRFromToday, projectUsingHistoricalCAGR } from '../services/projectionService';
import { ScrollView } from 'react-native';
import { ensureHistoricalPrefetch, PREFETCH_TICKERS } from '../services/dataService';
import { subscribe } from '../services/eventBus';
import useReceipts from '../hooks/useReceipts';
import { formatCurrencyRounded } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import StatCard from '../components/StatCard';
import PrimaryButton from '../components/PrimaryButton';
import ResponsiveContainer from '../components/ResponsiveContainer';

export default function SummaryScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [totalMoneySpent, setTotalMoneySpent] = useState<number>(0);
  const [totalMissedFiveYears, setTotalMissedFiveYears] = useState<number>(0);
  const [receiptsScanned, setReceiptsScanned] = useState<number>(0);
  const [highestImpactReceipt, setHighestImpactReceipt] = useState<any | null>(null);
  const [totalMissedTenYears, setTotalMissedTenYears] = useState<number>(0);
  const [avgPerReceipt, setAvgPerReceipt] = useState<number>(0);
  const [mostActiveMonth, setMostActiveMonth] = useState<string | null>(null);
  const [bestByPeriod, setBestByPeriod] = useState<Record<number, { symbol: string; rate: number }>>({});

  const { receipts } = useReceipts(user?.uid);

  // Top-3 stocks removed; replaced by compound calculator card.

  useEffect(() => {
    let mounted = true;
    async function loadTotals() {
      try {
        // use receipts provided by the shared hook
        const r = receipts || [];
        const total = r.reduce((s, it) => s + (it.amount || 0), 0);
        if (!mounted) return;
        setTotalMoneySpent(total);
        setReceiptsScanned(r.length);
        setAvgPerReceipt(r.length > 0 ? total / r.length : 0);

        const highest = r.slice().sort((a, b) => (b.amount || 0) - (a.amount || 0))[0] ?? null;
        setHighestImpactReceipt(highest ?? null);

        if (r.length > 0) {
          const counts: Record<string, number> = {};
          r.forEach(rr => {
            const d = rr.date ? new Date(rr.date) : new Date();
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
              const { futureValue } = await projectUsingHistoricalCAGR(perTicker, t, 5);
              return futureValue;
            } catch (e) {
              return perTicker * 1.15;
            }
          })
        );
        const totalFuture5 = futures.reduce((s, v) => s + v, 0);
        if (mounted) setTotalMissedFiveYears(Math.round(totalFuture5));

        const futures10 = await Promise.all(
          tickers.map(async t => {
            try {
              const { futureValue } = await projectUsingHistoricalCAGR(perTicker, t, 10);
              return futureValue;
            } catch {
              return (perTicker * 1.15) * 1.5;
            }
          })
        );
        const totalFuture10 = futures10.reduce((s, v) => s + v, 0);
        if (mounted) setTotalMissedTenYears(Math.round(totalFuture10));

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
    const unsubHist = subscribe('historical-updated', () => {
      // re-run totals when historical data updates
      loadTotals().catch(() => {});
    });
    return () => {
      mounted = false;
      try { unsubHist(); } catch (e) {}
    };
  }, [user?.uid, receipts]);

  const insights = [
    {
      icon: 'trending-up',
      title: 'Consistent Growth Patterns',
      description: 'Your spending shows strong investment potential across all categories',
    },
    {
      icon: 'layers-outline',
      title: 'Diversification Opportunity',
      description: 'Consider spreading purchases across different stock sectors',
    },
    {
      icon: 'time-outline',
      title: 'Time Horizon Matters',
      description: 'Longer investment periods show significantly better returns',
    },
    {
      icon: 'warning-outline',
      title: 'Educational Purpose Only',
      description: 'These are hypothetical calculations, not investment advice',
    },
  ];

  const formatCurrency = (value: number) => formatCurrencyRounded(value);

  const { contentHorizontalPadding, cardsPerRow, width: screenWidth, isTablet, sectionVerticalSpacing } = useBreakpoint();
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

  // Helper to derive the subtitle for a receipt: always use the formatted scan date
  const getReceiptSubtitle = (r: any) => {
    if (!r) return 'No receipts yet';
    try {
      const d = r.date ? new Date(r.date) : null;
      if (d) return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {}
    return 'Receipt';
  };

  return (
    <ScreenContainer contentStyle={{ paddingVertical: sectionVerticalSpacing }}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <PageHeader>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Summary</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your investment insights at a glance</Text>
        </PageHeader>

        {/* Center and cap content width so tablet layout matches the rest of the app */}
        <ResponsiveContainer maxWidth={isTablet ? 960 : screenWidth - contentHorizontalPadding * 2}>

        {/* (Compound calculator will be shown below in place of Top‑3) */}

        <View style={[styles.cardsGrid, cardsGridStyle]}>
          <StatCard
            value={highestImpactReceipt?.amount ? formatCurrency(highestImpactReceipt.amount) : '—'}
            label="Highest value receipt"
            subtitle={highestImpactReceipt ? getReceiptSubtitle(highestImpactReceipt) : 'No receipts yet'}
            variant="white"
            style={cardLayoutStyle}
          />

          <StatCard
            value={formatCurrency(Math.round(avgPerReceipt || 0))}
            label="Average per receipt"
            subtitle="Calculated across scanned receipts"
            variant="blue"
            style={cardLayoutStyle}
          />

          <StatCard
            value={mostActiveMonth ?? '—'}
            label="Most active month"
            subtitle="Month with most receipts"
            variant="green"
            style={cardLayoutStyle}
          />
        </View>

        {/* Compound interest calculator CTA (navigates to full page) */}
        <View style={{ width: '100%', marginTop: spacing.md }}>
          <PrimaryButton onPress={() => navigation.navigate('Calculator' as never)} accessibilityLabel="Open compound interest calculator page">
            <View style={{ width: '100%' }}>
              <Text style={[styles.cardTitle, { color: isDark ? palette.black : palette.white }]}>Compound interest calculator</Text>
              <Text style={[styles.cardSubtitle, { color: isDark ? palette.black : palette.white, opacity: 0.9 }]}>Open calculator page</Text>
            </View>
          </PrimaryButton>
        </View>

        {/* Quick stats removed per request */}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Investment Insights</Text>
        </View>

        <View style={styles.insightsList}>
          {insights.map(item => (
            <View key={item.title} style={[styles.insightCard, { backgroundColor: theme.surface }]}>
              <Ionicons name={item.icon as any} size={22} color={theme.text} style={styles.insightIcon} />
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.insightDescription, { color: theme.textSecondary }]}>{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        </ResponsiveContainer>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.pageTitle,
  },
  subtitle: {
    marginTop: spacing.sm,
    ...typography.pageSubtitle,
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
    backgroundColor: '#007AFF',
  },
  cardGreen: {
    backgroundColor: '#10b981',
  },
  cardWhite: {
    // backgroundColor handled by StatCard component
  },
  cardValue: {
    ...typography.metric,
    marginBottom: spacing.sm,
  },
  cardValueDark: {
    color: '#000000',
  },
  cardTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  cardSubtitle: {
    ...typography.caption,
    opacity: 0.9,
    textAlign: 'center',
  },
  cardTitleDark: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  cardSubtitleDark: {
    ...typography.caption,
    opacity: 0.7,
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
  },
  stockList: {
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
    borderBottomColor: '#f5f5f5',
  },
  stockInfo: {
    flexShrink: 1,
    paddingRight: spacing.md,
  },
  stockCompany: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  stockMeta: {
    ...typography.caption,
    opacity: 0.6,
  },
  stockGrowthContainer: {
    alignItems: 'flex-end',
  },
  stockGrowth: {
    ...typography.metricSm,
  },
  stockPeriod: {
    ...typography.overline,
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
    marginBottom: spacing.sm,
  },
  quickStatLabel: {
    ...typography.caption,
    textAlign: 'center',
  },
  insightsList: {
    marginBottom: spacing.xl,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.level1,
  },
  insightEmoji: {
    fontSize: sizes.avatarSm,
    marginRight: spacing.md,
  },
  insightIcon: {
    marginRight: spacing.md,
    width: sizes.avatarSm,
    textAlign: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  insightDescription: {
    ...typography.caption,
  },
  
});