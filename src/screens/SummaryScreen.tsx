import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
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
import ResponsiveContainer from '../components/ResponsiveContainer';
import { EmptyStateWithOnboarding } from '../components/EmptyStateWithOnboarding';

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
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [expandedDefinition, setExpandedDefinition] = useState<string | null>(null);

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
        if (mounted) setTotalMissedFiveYears(totalFuture5);

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
        if (mounted) setTotalMissedTenYears(totalFuture10);

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

  const formatCurrency = (value: number) => formatCurrencyRounded(value);

  // Dynamic insights based on user behavior
  const getDynamicInsights = () => {
    const dynamicInsights = [];
    
    // Always show if user has spending data
    if (totalMoneySpent > 0) {
      dynamicInsights.push({
        icon: 'wallet-outline',
        title: 'Your Spending Could Be Investing',
        description: `You've spent ${formatCurrency(totalMoneySpent)} that could be working for you`,
      });
    }
    
    // High spending detected
    if (totalMoneySpent > 1000) {
      dynamicInsights.push({
        icon: 'alert-circle-outline',
        title: 'High Spending Opportunity',
        description: `Even 20% invested could transform your future`,
      });
    }
    
    // Frequent small purchases
    if (receiptsScanned > 20 && avgPerReceipt < 50) {
      dynamicInsights.push({
        icon: 'cash-outline',
        title: 'Small Purchases Add Up',
        description: `${receiptsScanned} small purchases total ${formatCurrency(totalMoneySpent)}`,
      });
    }
    
    // Medium frequency purchases
    if (receiptsScanned >= 10 && receiptsScanned <= 20) {
      dynamicInsights.push({
        icon: 'trending-up',
        title: 'Consistent Spending Pattern',
        description: `${receiptsScanned} transactions show investment potential`,
      });
    }
    
    // Peak month insight
    if (mostActiveMonth) {
      dynamicInsights.push({
        icon: 'calendar-outline',
        title: 'Peak Spending Month',
        description: `${mostActiveMonth} was your most active period`,
      });
    }
    
    // Time-based urgency
    dynamicInsights.push({
      icon: 'time-outline',
      title: 'Time is Your Superpower',
      description: 'Every year you wait costs exponentially more',
    });
    
    // Inflation warning (always relevant)
    dynamicInsights.push({
      icon: 'pulse-outline',
      title: 'Inflation is Eating Your Cash',
      description: 'Cash loses purchasing power—investments can beat inflation',
    });
    
    // Return top 5 most relevant
    return dynamicInsights.slice(0, 5);
  };

  const insights = getDynamicInsights();

  const definitions = [
    {
      term: 'Compound Interest',
      icon: 'trending-up-outline',
      shortDescription: 'Earnings on your initial investment plus accumulated interest',
    },
    {
      term: 'CAGR',
      icon: 'stats-chart-outline',
      shortDescription: 'Compound Annual Growth Rate - the rate of return over time',
    },
    {
      term: 'Diversification',
      icon: 'grid-outline',
      shortDescription: 'Spreading investments across different assets to reduce risk',
    },
    {
      term: 'Portfolio',
      icon: 'briefcase-outline',
      shortDescription: 'A collection of financial investments like stocks and bonds',
    },
    {
      term: 'Risk Tolerance',
      icon: 'shield-outline',
      shortDescription: 'Your ability and willingness to withstand investment losses',
    },
    {
      term: 'Asset Allocation',
      icon: 'pie-chart-outline',
      shortDescription: 'How you divide investments among stocks, bonds, and cash',
    },
    {
      term: 'ETF',
      icon: 'layers-outline',
      shortDescription: 'Exchange-Traded Fund - a basket of stocks traded like a single stock',
    },
    {
      term: 'Dividend',
      icon: 'cash-outline',
      shortDescription: 'A portion of company profits paid to shareholders',
    },
    {
      term: 'Bull vs Bear Market',
      icon: 'swap-horizontal-outline',
      shortDescription: 'Bull = rising prices (optimism), Bear = falling prices (pessimism)',
    },
    {
      term: 'Index Fund',
      icon: 'list-outline',
      shortDescription: 'A fund tracking a market index like the S&P 500',
    },
  ];

  // Insight details for expandable tooltips - matched to dynamic insights
  const insightDetails: Record<string, { bullets: string[]; example: string }> = {
    'Your Spending Could Be Investing': {
      bullets: [
        `Instead of ${receiptsScanned} receipts, you could have ${receiptsScanned} investment contributions`,
        `Your average purchase of ${formatCurrency(avgPerReceipt)} could become a recurring investment`,
        'Even small amounts compound significantly over decades',
      ],
      example: `If you invested just half your spending (${formatCurrency(totalMoneySpent / 2)}) today at 8% annual return, you'd have ${formatCurrency((totalMoneySpent / 2) * Math.pow(1.08, 30))} in 30 years.`,
    },
    'High Spending Opportunity': {
      bullets: [
        `Redirecting 20% (${formatCurrency(totalMoneySpent * 0.2)}) to investments could yield significant returns`,
        'High earners who invest aggressively often retire 10-15 years earlier',
        'Consider automatic transfers to investment accounts before spending',
      ],
      example: `${formatCurrency(totalMoneySpent * 0.2)} invested monthly at 8% for 20 years = ${formatCurrency((totalMoneySpent * 0.2) * (Math.pow(1.08, 20) - 1) / 0.08)}.`,
    },
    'Small Purchases Add Up': {
      bullets: [
        `Your average £${avgPerReceipt.toFixed(2)} purchase happened ${receiptsScanned} times`,
        'Small frequent expenses are the #1 wealth killer',
        'Cutting just 30% of these could fund a retirement account',
      ],
      example: `Reducing spending by 30% saves ${formatCurrency(totalMoneySpent * 0.3)}/year. Over 25 years at 7%, that's ${formatCurrency((totalMoneySpent * 0.3) * (Math.pow(1.07, 25) - 1) / 0.07)}.`,
    },
    'Consistent Spending Pattern': {
      bullets: [
        'Predictable spending patterns are perfect for investment planning',
        'Set up automatic investments during consistent periods',
        'Awareness is the first step to financial optimization',
      ],
      example: `With consistent spending of ${formatCurrency(avgPerReceipt)} per purchase, redirecting 25% monthly (${formatCurrency(avgPerReceipt * 0.25 * receiptsScanned / 12)}) for 20 years at 7% = ${formatCurrency((avgPerReceipt * 0.25 * receiptsScanned / 12) * 12 * (Math.pow(1.07, 20) - 1) / 0.07)}.`,
    },
    'Peak Spending Month': {
      bullets: [
        `${mostActiveMonth} showed your highest activity`,
        'Plan investments during low-spend months to balance cash flow',
        'Seasonal spending awareness helps optimize saving strategies',
      ],
      example: `If you invested surplus from off-peak months (estimated ${formatCurrency(avgPerReceipt * 5)}), you'd accumulate ${formatCurrency(avgPerReceipt * 5 * 12 * Math.pow(1.07, 10))} over 10 years at 7%.`,
    },
    'Time is Your Superpower': {
      bullets: [
        'Starting at 25 vs 35 can mean 2-3x more wealth by retirement',
        'A 25-year-old investing £200/month reaches £500k+ by 65',
        'The same £200/month starting at 35 only reaches £250k',
      ],
      example: `Starting today with ${formatCurrency(avgPerReceipt)}/month vs waiting 5 years could mean ${formatCurrency(avgPerReceipt * 12 * (Math.pow(1.08, 25) - Math.pow(1.08, 20)) / 0.08)} more wealth.`,
    },
    'Inflation is Eating Your Cash': {
      bullets: [
        'At 3% inflation, £1,000 today is worth £744 in 10 years',
        'Savings accounts (~1-2%) lose value after inflation',
        'Stocks historically return 7-10%, beating inflation by 4-7%',
      ],
      example: `Your ${formatCurrency(totalMoneySpent)} in cash will have the buying power of only ${formatCurrency(totalMoneySpent * Math.pow(0.97, 10))} in 10 years. Invested at 8%, it becomes ${formatCurrency(totalMoneySpent * Math.pow(1.08, 10))}.`,
    },
  };

  // Definition details for expandable tooltips
  const definitionDetails: Record<string, { explanation: string; example: string }> = {
    'Compound Interest': {
      explanation: 'Compound interest is when you earn interest not just on your initial investment, but also on the interest you\'ve already earned. This creates exponential growth over time, often called the "snowball effect".',
      example: 'If you invest £1,000 at 10% annually: Year 1 = £1,100, Year 2 = £1,210 (not £1,200), Year 10 = £2,594. The extra £94 in year 10 comes from compounding.',
    },
    'CAGR': {
      explanation: 'CAGR (Compound Annual Growth Rate) smooths out year-to-year volatility to show the average rate at which an investment grows annually. It\'s more accurate than simple averages for long-term returns.',
      example: 'If an investment goes from £1,000 to £2,000 in 5 years, the CAGR is 14.87%, not 20% (which would be the simple average).',
    },
    'Diversification': {
      explanation: 'Diversification means not putting all your eggs in one basket. By spreading investments across different companies, sectors, and asset types, you reduce the risk that one poor performer will hurt your entire portfolio.',
      example: 'If you invest £1,000 across 5 sectors and one drops 50%, you only lose £100 total. If all £1,000 was in that one sector, you\'d lose £500.',
    },
    'Portfolio': {
      explanation: 'A portfolio is your complete collection of investments. It can include stocks, bonds, ETFs, mutual funds, and other assets. A well-balanced portfolio matches your risk tolerance and financial goals.',
      example: 'A moderate portfolio might be: 60% stocks (growth), 30% bonds (stability), 10% cash (liquidity).',
    },
    'Risk Tolerance': {
      explanation: 'Risk tolerance is your psychological and financial ability to handle investment losses without panicking. It depends on your age, income stability, financial goals, and personality. Higher risk tolerance allows for more aggressive (growth-focused) investments.',
      example: 'Conservative investor: Loses sleep over 5% drops, prefers bonds. Aggressive investor: Comfortable with 20% swings, invests heavily in stocks.',
    },
    'Asset Allocation': {
      explanation: 'Asset allocation is the strategy of dividing your portfolio among different asset categories (stocks, bonds, cash, real estate, etc.). It\'s the most important factor affecting portfolio risk and return. Your allocation should match your goals and timeline.',
      example: 'Young investor (30+ years to retirement): 80% stocks, 15% bonds, 5% cash. Near retiree: 40% stocks, 50% bonds, 10% cash.',
    },
    'ETF': {
      explanation: 'An Exchange-Traded Fund (ETF) holds many stocks or bonds in one package, trading on exchanges like individual stocks. ETFs offer instant diversification, low fees, and flexibility. They\'re ideal for beginners wanting broad market exposure.',
      example: 'Vanguard S&P 500 ETF (VUSA) holds all 500 companies in the S&P 500. Buying one share gives you tiny pieces of Apple, Microsoft, Amazon, and 497 others.',
    },
    'Dividend': {
      explanation: 'A dividend is a cash payment companies make to shareholders from profits. Dividend-paying stocks provide regular income plus potential growth. Reinvesting dividends accelerates compounding. Dividend yield = annual dividend ÷ stock price.',
      example: 'If a £100 stock pays £4/year in dividends, the yield is 4%. Owning 100 shares = £400/year passive income. Reinvested over 20 years, this dramatically boosts returns.',
    },
    'Bull vs Bear Market': {
      explanation: 'Bull markets are prolonged periods of rising prices (typically 20%+ gains), driven by optimism and economic growth. Bear markets are extended declines (20%+ drops), triggered by pessimism or recession. Both are normal cycles.',
      example: 'Bull: 2009-2020 (stocks tripled after financial crisis). Bear: 2022 (stocks fell 25% due to inflation fears). Long-term investors buy during bears, hold through bulls.',
    },
    'Index Fund': {
      explanation: 'An index fund passively tracks a market index (like FTSE 100 or S&P 500) by holding the same stocks in the same proportions. They offer instant diversification, minimal fees, and historically beat 90% of actively managed funds over 15+ years.',
      example: 'Instead of picking individual stocks, invest £1,000 in a FTSE 100 index fund. You own pieces of the UK\'s 100 largest companies automatically rebalanced.',
    },
  };

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

        {receiptsScanned === 0 ? (
          <ResponsiveContainer maxWidth={screenWidth - contentHorizontalPadding * 2}>
            <EmptyStateWithOnboarding
              iconName="stats-chart-outline"
              title="No Data Yet"
              subtitle="Start scanning receipts to see your investment insights and projections"
              primaryText="Scan Your First Receipt"
              onPrimaryPress={() => navigation.navigate('Scan' as never)}
            />
          </ResponsiveContainer>
        ) : (
          <>
  {/* Center content width so tablet layout matches the rest of the app */}
  <ResponsiveContainer maxWidth={screenWidth - contentHorizontalPadding * 2}>

        {/* Full-width 20-year projection card */}
        <StatCard
          value={
            <View style={styles.valueWithIcon}>
              <Ionicons name="trending-up" size={28} color={theme.primary} />
              <Text style={[styles.projectionValue, { color: theme.text }]}>
                {formatCurrency(totalMoneySpent * Math.pow(1.10, 20))}
              </Text>
            </View>
          }
          label="20-Year Portfolio Projection"
          subtitle={`If your total spending of ${formatCurrency(totalMoneySpent)} grew at 10% per year`}
          variant="white"
          style={{ width: '100%', marginBottom: spacing.md, marginHorizontal: 0 }}
        />

        {/* Two cards from Dashboard */}
        <View style={styles.statsContainer}>
          <StatCard
            value={
              <View style={styles.valueWithIcon}>
                <Ionicons name="cash-outline" size={28} color={theme.surface} />
                <Text style={[styles.projectionValue, { color: theme.textOnColor, fontSize: 28 }]}>{formatCurrency(totalMoneySpent)}</Text>
              </View>
            }
            label="Total Money Spent"
            subtitle="Across all scanned receipts"
            variant="green"
          />
          <StatCard
            value={
              <View style={styles.valueWithIcon}>
                <Ionicons name="document-text-outline" size={28} color={theme.surface} />
                <Text style={[styles.projectionValue, { color: theme.textOnColor, fontSize: 28 }]}>{receiptsScanned}</Text>
              </View>
            }
            label="Receipts Scanned"
            variant="blue"
          />
        </View>

        <View style={[styles.cardsGrid, cardsGridStyle]}>
          <StatCard
            value={
              <View style={styles.valueWithIcon}>
                <Ionicons name="receipt-outline" size={22} color={theme.surface} />
                <Text style={[styles.cardValueText, { color: theme.textOnColor }]}>
                  {highestImpactReceipt?.amount ? formatCurrency(highestImpactReceipt.amount) : '—'}
                </Text>
              </View>
            }
            label="Highest value receipt"
            subtitle={highestImpactReceipt ? getReceiptSubtitle(highestImpactReceipt) : 'No receipts yet'}
            variant="green"
            style={cardLayoutStyle}
          />

          <StatCard
            value={
              <View style={styles.valueWithIcon}>
                <Ionicons name="calculator-outline" size={22} color={theme.surface} />
                <Text style={[styles.cardValueText, { color: theme.textOnColor }]}>
                  {formatCurrency(avgPerReceipt || 0)}
                </Text>
              </View>
            }
            label="Average per receipt"
            variant="blue"
            style={cardLayoutStyle}
          />

          <StatCard
            value={
              <View style={styles.valueWithIcon}>
                <Ionicons name="calendar-outline" size={22} color={theme.surface} />
                <Text style={[styles.cardValueText, { color: theme.textOnColor }]}>
                  {mostActiveMonth ?? '—'}
                </Text>
              </View>
            }
            label="Most active month"
            subtitle="Month with most receipts"
            variant="green"
            style={cardLayoutStyle}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Investment Insights</Text>
        </View>

        <View>
          {insights.map(item => {
            const isExpanded = expandedInsight === item.title;
            const details = insightDetails[item.title];
            return (
              <Pressable
                key={item.title}
                onPress={() => setExpandedInsight(isExpanded ? null : item.title)}
                style={[styles.insightCard, { backgroundColor: theme.surface }]}
              >
                <Ionicons name={item.icon as any} size={22} color={theme.primary} style={styles.insightIcon} />
                <View style={styles.insightContent}>
                  <View style={styles.insightHeader}>
                    <Text style={[styles.insightTitle, { color: theme.text }]}>{item.title}</Text>
                    <Ionicons 
                      name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={theme.textSecondary} 
                    />
                  </View>
                  <Text style={[styles.insightDescription, { color: theme.textSecondary }]}>{item.description}</Text>
                  
                  {isExpanded && details && (
                    <View style={styles.expandedContent}>
                      {details.bullets.map((bullet, index) => (
                        <Text key={index} style={[styles.bulletPoint, { color: theme.textSecondary }]}>
                          • {bullet}
                        </Text>
                      ))}
                      <View style={[styles.exampleBox, { backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9' }]}>
                        <Text style={[styles.exampleLabel, { color: theme.text }]}>Example</Text>
                        <Text style={[styles.exampleText, { color: theme.textSecondary }]}>{details.example}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Definitions</Text>
        </View>

        <View style={styles.definitionsList}>
          {definitions.map(item => {
            const isExpanded = expandedDefinition === item.term;
            const details = definitionDetails[item.term];
            return (
              <Pressable
                key={item.term}
                onPress={() => setExpandedDefinition(isExpanded ? null : item.term)}
                style={[styles.definitionCard, { backgroundColor: theme.surface }]}
              >
                <Ionicons name={item.icon as any} size={22} color={theme.secondary} style={styles.definitionIcon} />
                <View style={styles.definitionContent}>
                  <View style={styles.definitionHeader}>
                    <Text style={[styles.definitionTerm, { color: theme.text }]}>{item.term}</Text>
                    <Ionicons 
                      name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={theme.textSecondary} 
                    />
                  </View>
                  <Text style={[styles.definitionShort, { color: theme.textSecondary }]}>{item.shortDescription}</Text>
                  
                  {isExpanded && details && (
                    <View style={styles.expandedContent}>
                      <Text style={[styles.definitionExplanation, { color: theme.text }]}>{details.explanation}</Text>
                      <View style={[styles.exampleBox, { backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9' }]}>
                        <Text style={[styles.exampleLabel, { color: theme.text }]}>Example</Text>
                        <Text style={[styles.exampleText, { color: theme.textSecondary }]}>{details.example}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
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
  cardValue: {
    ...typography.metric,
    marginBottom: spacing.sm,
  },
  cardValueDark: {
    color: '#000000',
  },
  cardValueText: {
    ...typography.metricSm,
    fontWeight: '700',
    textAlign: 'center',
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
  valueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  projectionValue: {
    ...typography.metric,
    fontWeight: '700',
    textAlign: 'center',
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
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  bulletPoint: {
    ...typography.caption,
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
  exampleBox: {
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  exampleLabel: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  exampleText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    gap: spacing.xs,
  },
  ctaButtonText: {
    ...typography.bodyStrong,
  },
  definitionsList: {
    marginBottom: spacing.xl,
  },
  definitionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.level1,
  },
  definitionIcon: {
    marginRight: spacing.md,
    width: sizes.avatarSm,
    textAlign: 'center',
  },
  definitionContent: {
    flex: 1,
  },
  definitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  definitionTerm: {
    ...typography.bodyStrong,
  },
  definitionShort: {
    ...typography.caption,
  },
  definitionExplanation: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  
});