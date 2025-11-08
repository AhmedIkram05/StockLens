import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import PageHeader from '../components/PageHeader';
import BackButton from '../components/BackButton';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { palette, alpha } from '../styles/palette';
import { radii, shadows, spacing, typography, sizes } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import DangerButton from '../components/DangerButton';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { receiptService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Route prop for receipt details screen
type ReceiptDetailsRouteProp = RouteProp<RootStackParamList, 'ReceiptDetails'>;

// Preset options for years to project
const YEAR_OPTIONS = [1, 3, 5, 10, 20] as const;

import { STOCK_PRESETS } from '../services/stockPresets';

import { subscribe, emit } from '../services/eventBus';
import { getHistoricalCAGRFromToday } from '../services/projectionService';
import { formatCurrencyGBP } from '../utils/formatters';
import YearSelector from '../components/YearSelector';
import StockCard from '../components/StockCard';
import ReceiptCard from '../components/ReceiptCard';
import Carousel from '../components/Carousel';
import ProjectionDisclaimer from '../components/ProjectionDisclaimer';


export default function ReceiptDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<ReceiptDetailsRouteProp>();
  const {
    receiptId,
    totalAmount: initialAmount,
    date,
    image,
  } = route.params;

  const [selectedYears, setSelectedYears] = useState<typeof YEAR_OPTIONS[number]>(5);
  const [selectedFutureYears, setSelectedFutureYears] = useState<typeof YEAR_OPTIONS[number]>(5);
  const [amount, setAmount] = useState<number>(initialAmount ?? 0);

  const totalAmount = amount;
  const { userProfile } = useAuth();
  const { contentHorizontalPadding, sectionVerticalSpacing, isSmallPhone, isTablet, width } = useBreakpoint();
  const { theme } = useTheme();


  const investmentOptions = useMemo(() => {
    return STOCK_PRESETS.map(stock => {
      // placeholder until live data replaces it asynchronously
      const futureValue = totalAmount * Math.pow(1 + stock.returnRate, selectedYears);
      const gain = futureValue - totalAmount;
      const percentReturn = ((futureValue / totalAmount) - 1) * 100;

      return {
        ...stock,
        futureValue,
        gain,
        percentReturn,
      };
    });
  }, [selectedYears, totalAmount]);

  const futureInvestmentOptions = useMemo(() => {
    return STOCK_PRESETS.map(stock => {
      const futureValue = totalAmount * Math.pow(1 + stock.returnRate, selectedFutureYears);
      const gain = futureValue - totalAmount;
      const percentReturn = ((futureValue / totalAmount) - 1) * 100;

      return {
        ...stock,
        futureValue,
        gain,
        percentReturn,
      };
    });
  }, [selectedFutureYears, totalAmount]);

  // historical CAGRs per ticker and years (e.g. { NVDA: {5: 0.18, 3: 0.22} })
  const [historicalRates, setHistoricalRates] = useState<Record<string, Record<number, number>>>({});
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // load historical rates whenever selectedYears changes
  useEffect(() => {
    let mounted = true;
    async function loadHistoricalForYears(years: number) {
      setRatesLoading(true);
      setRatesError(null);
      try {
        const promises = STOCK_PRESETS.map(async s => {
          try {
            const cagr = await getHistoricalCAGRFromToday(s.ticker, years);
            return { ticker: s.ticker, total: cagr };
          } catch (e: any) {
            return { ticker: s.ticker, total: null };
          }
        });

        const results = await Promise.all(promises);
        if (!mounted) return;
        const map: Record<string, Record<number, number>> = { ...historicalRates };
        results.forEach((r: any) => {
          if (!map[r.ticker]) map[r.ticker] = {};
          if (r.total !== null && r.total !== undefined) map[r.ticker][years] = r.total as number;
        });
        if (mounted) setHistoricalRates(map);
      } catch (err: any) {
        if (mounted) setRatesError(err?.message || String(err));
      } finally {
        if (mounted) setRatesLoading(false);
      }
    }

    loadHistoricalForYears(selectedYears);
    const unsub = subscribe('historical-updated', (payload) => {
      // payload may contain symbol/interval; refresh if it's one of our tracked tickers
      const updatedTicker = payload?.symbol as string | undefined;
      if (!updatedTicker || STOCK_PRESETS.some(s => s.ticker === updatedTicker)) {
        loadHistoricalForYears(selectedYears).catch(() => {});
      }
    });
    return () => {
      mounted = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYears]);

  const cardSpacing = isTablet ? spacing.lg : spacing.md;
  const cardWidth = useMemo(() => {
    if (isTablet) {
      return Math.min(320, width * 0.38);
    }
    if (isSmallPhone) {
      return Math.max(240, width * 0.72);
    }
    return Math.min(300, Math.max(260, width * 0.6));
  }, [isSmallPhone, isTablet, width]);
  const stockCardLayout = useMemo(
    () => ({ width: cardWidth, marginRight: cardSpacing }),
    [cardSpacing, cardWidth]
  );
  const snapInterval = useMemo(() => cardWidth + cardSpacing, [cardSpacing, cardWidth]);

  const formattedAmount = formatCurrencyGBP(totalAmount || 0);

  const formattedEditableAmount = formatCurrencyGBP(amount || 0);

  const formattedYearsLabel = `${selectedYears} ${selectedYears === 1 ? 'year' : 'years'}`;
  const formattedFutureYearsLabel = `${selectedFutureYears} ${selectedFutureYears === 1 ? 'year' : 'years'}`;

  const renderStockCard = (
    investmentValue: typeof investmentOptions[number],
    isLastItem: boolean,
    years: number = selectedYears,
    mode: 'past' | 'future' = 'past'
  ) => {
    // Past (historical) uses API-derived total return (last/first - 1) for the selected years when available
    // Future uses preset annual returnRate and the formula amount * (1 + return_rate)^years
    let computedFutureValue: number;
    let computedGain: number;
    let computedPercentReturn: number;

    if (mode === 'past') {
      const cagr = historicalRates[investmentValue.ticker]?.[years];
      if (cagr !== undefined && cagr !== null) {
        // historical CAGR -> compute future value over the period (equivalent to last/first)
        computedFutureValue = totalAmount * Math.pow(1 + cagr, years);
        computedGain = computedFutureValue - totalAmount;
        // show cumulative percent over the whole period (not annualized)
        computedPercentReturn = (Math.pow(1 + cagr, years) - 1) * 100;
      } else {
        // fallback to historical calculation at render time (best-effort) or preset if unavailable
        // use projectUsingHistoricalCAGR synchronously is not possible; fallback to preset rate
        const rate = investmentValue.returnRate;
        computedFutureValue = totalAmount * Math.pow(1 + rate, years);
        computedGain = computedFutureValue - totalAmount;
        computedPercentReturn = ((computedFutureValue / totalAmount) - 1) * 100;
      }
    } else {
      // future mode — use the unified projectionService (but we already precompute historicalRates for past mode)
      const rate = investmentValue.returnRate;
      computedFutureValue = totalAmount * Math.pow(1 + rate, years);
      computedGain = computedFutureValue - totalAmount;
      computedPercentReturn = ((computedFutureValue / totalAmount) - 1) * 100;
    }

    const futureDisplay = formatCurrencyGBP(computedFutureValue || 0);

    const gainDisplay = formatCurrencyGBP(computedGain || 0);

  const percentDisplay = `${computedPercentReturn.toFixed(1)}%`;

  // color: green for positive or zero, red for negative
  const valueColor = computedPercentReturn >= 0 ? palette.green : palette.red;

    // determine badge: show Over/Underperformer for the current mode (past/future)
    let badgeTextToShow: string | undefined = undefined;
    if (mode === 'past') {
      if (investmentValue.ticker === bestPastTicker) badgeTextToShow = 'Overperformer';
      else if (investmentValue.ticker === worstPastTicker) badgeTextToShow = 'Underperformer';
    } else {
      if (investmentValue.ticker === bestFutureTicker) badgeTextToShow = 'Overperformer';
      else if (investmentValue.ticker === worstFutureTicker) badgeTextToShow = 'Underperformer';
    }

    const badgeColorToShow = badgeTextToShow === 'Overperformer' ? palette.green : badgeTextToShow === 'Underperformer' ? palette.red : undefined;

    return (
      <StockCard
        name={investmentValue.name}
        ticker={investmentValue.ticker}
        futureDisplay={futureDisplay}
        formattedAmount={formattedAmount}
        percentDisplay={percentDisplay}
        gainDisplay={gainDisplay}
        valueColor={valueColor}
        isLast={isLastItem}
        onPress={() => {}}
        cardWidth={cardWidth}
        badgeText={badgeTextToShow}
        badgeColor={badgeColorToShow}
      />
    );
  };

  // Compute best/worst performers for past based on the currently selected years
  const { bestPastTicker, worstPastTicker } = React.useMemo(() => {
    try {
      const list = investmentOptions.map(it => {
        const cagr = historicalRates[it.ticker]?.[selectedYears];
        const percent = cagr !== undefined && cagr !== null
          ? (Math.pow(1 + cagr, selectedYears) - 1) * 100
          : it.percentReturn;
        return { ticker: it.ticker, percent };
      });
      if (list.length === 0) return { bestPastTicker: undefined, worstPastTicker: undefined };
      let best = list[0];
      let worst = list[0];
      for (const p of list) {
        if (p.percent > best.percent) best = p;
        if (p.percent < worst.percent) worst = p;
      }
      return { bestPastTicker: best.ticker, worstPastTicker: worst.ticker };
    } catch (e) {
      return { bestPastTicker: undefined, worstPastTicker: undefined };
    }
  }, [investmentOptions, historicalRates, selectedYears]);

  // Compute best/worst performers for future based on the currently selected future years
  const { bestFutureTicker, worstFutureTicker } = React.useMemo(() => {
    try {
      const list = futureInvestmentOptions.map(it => ({ ticker: it.ticker, percent: it.percentReturn }));
      if (list.length === 0) return { bestFutureTicker: undefined, worstFutureTicker: undefined };
      let best = list[0];
      let worst = list[0];
      for (const p of list) {
        if (p.percent > best.percent) best = p;
        if (p.percent < worst.percent) worst = p;
      }
      return { bestFutureTicker: best.ticker, worstFutureTicker: worst.ticker };
    } catch (e) {
      return { bestFutureTicker: undefined, worstFutureTicker: undefined };
    }
  }, [futureInvestmentOptions]);

  // Main render
  return (
    <ScreenContainer contentStyle={{ paddingVertical: sectionVerticalSpacing }}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isSmallPhone && styles.contentCompact,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerRow, isSmallPhone && styles.headerRowCompact]}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>

  <ResponsiveContainer maxWidth={width - contentHorizontalPadding * 2}>
          <>
            <View style={{ width: '100%' }}>
              <ReceiptCard
                image={image}
                amount={formattedEditableAmount}
                merchant={''}
                time={new Date(date).toLocaleString()}
                onPress={() => {}}
              />
            </View>

            <PageHeader>
              <View>
                <Text style={[styles.projectionTitle, { color: theme.text }]}>Your {formattedAmount} could have been...</Text>
              </View>
              <Text style={[styles.projectionSubtitle, { color: theme.textSecondary }]}>If invested {formattedYearsLabel} ago</Text>
            </PageHeader>

            <YearSelector
              options={[1, 3, 5, 10, 20]}
              value={selectedYears}
              onChange={setSelectedYears}
              compact={isSmallPhone}
              style={{ marginBottom: isSmallPhone ? spacing.xl : spacing.xl + spacing.sm }}
            />

            <View style={styles.carouselHeader}>
              <Text style={[styles.carouselTitle, { color: theme.text }]}>Investment Outlook</Text>
              <Text style={[styles.carouselSubtitle, { color: theme.textSecondary }]}>Swipe to explore different stocks</Text>
            </View>

            <Carousel
              data={investmentOptions}
              keyExtractor={(item: any) => item.ticker}
              snapInterval={snapInterval}
              contentContainerStyle={styles.carousel}
              renderItem={({ item, index }) =>
                renderStockCard(item, index === investmentOptions.length - 1, selectedYears, 'past')
              }
            />

            <View style={[styles.sectionSpacing, { height: sectionVerticalSpacing }]} />

            <PageHeader>
              <View>
                <Text style={[styles.futureTitle, { color: theme.text }]}>Your {formattedAmount} could become...</Text>
              </View>
              <Text style={[styles.futureSubtitle, { color: theme.textSecondary }]}>If invested today for {formattedFutureYearsLabel}</Text>
            </PageHeader>

            <YearSelector
              options={[1, 3, 5, 10, 20]}
              value={selectedFutureYears}
              onChange={setSelectedFutureYears}
              compact={isSmallPhone}
              style={{ marginBottom: isSmallPhone ? spacing.xl : spacing.xl + spacing.sm }}
            />

            <View style={styles.carouselHeader}>
              <Text style={[styles.carouselTitle, { color: theme.text }]}>Potential Growth</Text>
              <Text style={[styles.carouselSubtitle, { color: theme.textSecondary }]}>Compare returns if you started now</Text>
            </View>

            <Carousel
              data={futureInvestmentOptions}
              keyExtractor={(item: any) => `future-${item.ticker}`}
              snapInterval={snapInterval}
              contentContainerStyle={styles.carousel}
              renderItem={({ item, index }) =>
                renderStockCard(item, index === futureInvestmentOptions.length - 1, selectedFutureYears, 'future')
              }
            />
          </>
        </ResponsiveContainer>

        <DangerButton
          accessibilityLabel="Delete receipt"
          style={[isSmallPhone && styles.deleteButtonCompact]}
          onPress={() =>
            Alert.alert(
              'Delete receipt',
              'Are you sure you want to delete this receipt?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      if (!receiptId) {
                        Alert.alert('Cannot delete', 'Receipt has not been saved yet');
                        return;
                      }
                      await receiptService.delete(Number(receiptId));
                      // notify listeners that receipts changed
                      try { emit('receipts-changed', { id: Number(receiptId), action: 'deleted' }); } catch (e) {}
                      Alert.alert('Deleted', 'Receipt deleted');
                      navigation.navigate('MainTabs' as any);
                    } catch (e: any) {
                      console.error('Delete error', e);
                      Alert.alert('Delete failed', e?.message || 'Failed to delete receipt');
                    }
                  }
                },
              ]
            )
          }
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="trash-outline" size={18} color={palette.white} style={{ marginRight: 10 }} />
            <Text style={{ color: palette.white, ...typography.button }}>Delete Receipt</Text>
          </View>
        </DangerButton>

        <ProjectionDisclaimer />
        </ScrollView>
    </ScreenContainer>
  );
}

// Styles
type Styles = {
  container: ViewStyle;
  content: ViewStyle;
  contentCompact: ViewStyle;
  headerRow: ViewStyle;
  headerRowCompact: ViewStyle;
  backButton: ViewStyle;
  projectionHeader: ViewStyle;
  projectionHeaderCompact: ViewStyle;
  projectionTitle: TextStyle;
  projectionSubtitle: TextStyle;
  carouselHeader: ViewStyle;
  carouselTitle: TextStyle;
  carouselSubtitle: TextStyle;
  carousel: ViewStyle;
  sectionSpacing: ViewStyle;
  futureHeader: ViewStyle;
  futureHeaderCompact: ViewStyle;
  futureTitle: TextStyle;
  futureSubtitle: TextStyle;
  stockCard: ViewStyle;
  stockCardLast: ViewStyle;
  stockCardHeader: ViewStyle;
  stockName: TextStyle;
  stockTicker: TextStyle;
  stockValueContainer: ViewStyle;
  stockValue: TextStyle;
  stockValueCaption: TextStyle;
  divider: ViewStyle;
  stockFooter: ViewStyle;
  stockFooterItem: ViewStyle;
  footerLabel: TextStyle;
  footerValue: TextStyle;
  verticalDivider: ViewStyle;
  deleteButton: ViewStyle;
  deleteButtonCompact: ViewStyle;
  deleteIcon: TextStyle;
  deleteText: TextStyle;
};

// Stylesheet
const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: palette.lightGray,
  },
  content: {
    paddingHorizontal: 0,
    paddingBottom: spacing.xxl,
  },
  contentCompact: {
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerRowCompact: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  backButton: {
    width: sizes.controlMd,
    height: sizes.controlMd,
    borderRadius: radii.pill,
    backgroundColor: palette.green,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.level2,
  },
  /* receipt card moved to `ReceiptCard` component - details removed */
  projectionHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  projectionHeaderCompact: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  projectionTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.sm,
  },
  projectionSubtitle: {
    ...typography.body,
    opacity: 0.7,
  },
  /* Year selector visuals are implemented inside `YearSelector` component now. */
  carouselHeader: {
    marginBottom: spacing.md,
  },
  carouselTitle: {
    ...typography.bodyStrong,
  },
  carouselSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  carousel: {
    paddingBottom: spacing.md,
  },
  sectionSpacing: {
    height: spacing.xxl,
  },
  futureHeader: {
    marginBottom: spacing.lg,
  },
  futureHeaderCompact: {
    marginBottom: spacing.md,
  },
  futureTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.sm,
  },
  futureSubtitle: {
    ...typography.body,
    opacity: 0.7,
  },
  stockCard: {
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.level2,
  },
  stockCardLast: {
    marginRight: 0,
  },
  stockCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stockName: {
    ...typography.bodyStrong,
  },
  stockTicker: {
    ...typography.captionStrong,
    color: palette.blue,
  },
  stockValueContainer: {
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stockValue: {
    ...typography.sectionTitle,
  },
  stockValueCaption: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: alpha.faintBlack,
    marginBottom: spacing.md,
  },
  stockFooter: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  stockFooterItem: {
    flex: 1,
  },
  footerLabel: {
    ...typography.overline,
    marginBottom: spacing.sm,
  },
  footerValue: {
    ...typography.metricSm,
    color: palette.green,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: alpha.faintBlack,
    marginHorizontal: spacing.md,
  },
  deleteButton: {
    marginTop: spacing.xxl + spacing.sm,
    backgroundColor: palette.red,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.level2,
  },
  deleteButtonCompact: {
    marginTop: spacing.xl,
  },
  deleteIcon: {
    marginRight: spacing.sm,
  },
  deleteText: {
    color: palette.white,
    ...typography.button,
  },
});