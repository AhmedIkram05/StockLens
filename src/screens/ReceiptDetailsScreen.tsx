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
import { radii, shadows, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import DangerButton from '../components/DangerButton';
import { receiptService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';

type ReceiptDetailsRouteProp = RouteProp<RootStackParamList, 'ReceiptDetails'>;

const YEAR_OPTIONS = [1, 3, 5, 10, 20] as const;

const STOCK_PRESETS = [
  { name: 'NVIDIA', ticker: 'NVDA', returnRate: 0.24 },
  { name: 'Apple', ticker: 'AAPL', returnRate: 0.18 },
  { name: 'Microsoft', ticker: 'MSFT', returnRate: 0.15 },
  { name: 'Tesla', ticker: 'TSLA', returnRate: 0.28 },
  { name: 'Nike', ticker: 'NKE', returnRate: 0.12 },
];

import { subscribe, emit } from '../services/eventBus';
import { getHistoricalCAGRFromToday } from '../services/projectionService';
import { formatCurrencyGBP } from '../utils/formatters';
import YearSelector from '../components/YearSelector';
import StockCard from '../components/StockCard';
import ReceiptCard from '../components/ReceiptCard';
import Carousel from '../components/Carousel';


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
  // Keep the amount as a string for reliable decimal input, parse to number on save
  const [amountStr, setAmountStr] = useState<string>(initialAmount != null ? String(initialAmount) : '');
  const [amount, setAmount] = useState<number>(initialAmount ?? 0);

  // Use editable amount (parsed from string) as the base for projections and displays
  // Keep `amount` in sync with `amountStr` for computed projections
  useEffect(() => {
    const parsed = Number(String(amountStr).replace(/,/g, '.'));
    setAmount(Number.isFinite(parsed) ? parsed : 0);
  }, [amountStr]);

  // (Confirm scan modal removed)

  const totalAmount = amount;
  const { userProfile } = useAuth();
  const { contentHorizontalPadding, sectionVerticalSpacing, isSmallPhone, isTablet, width } = useBreakpoint();


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
      />
    );
  };

  return (
    <ScreenContainer contentStyle={{ paddingBottom: sectionVerticalSpacing }}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isSmallPhone && styles.contentCompact,
        ]}
      >
        <View style={[styles.headerRow, isSmallPhone && styles.headerRowCompact]}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>

        <ReceiptCard
          image={image}
          amount={formattedEditableAmount}
          merchant={''}
          time={new Date(date).toLocaleString()}
          onPress={() => {}}
        />

        {/* Amount is shown in the top receipt card; duplicate body display removed */}

        {/* ConfirmScanModal removed */}

        <PageHeader>
          <View>
            <Text style={styles.projectionTitle}>Your {formattedAmount} could have been...</Text>
          </View>
          <Text style={styles.projectionSubtitle}>If invested {formattedYearsLabel} ago</Text>
        </PageHeader>

        <YearSelector options={[1, 3, 5, 10, 20]} value={selectedYears} onChange={setSelectedYears} compact={isSmallPhone} style={[styles.yearSelector, isSmallPhone && styles.yearSelectorCompact]} />

        <View style={styles.carouselHeader}>
          <Text style={styles.carouselTitle}>Investment Outlook</Text>
          <Text style={styles.carouselSubtitle}>Swipe to explore different stocks</Text>
        </View>

        <Carousel
          data={investmentOptions}
          keyExtractor={(item: any) => item.ticker}
          snapInterval={snapInterval}
          contentContainerStyle={[
            styles.carousel,
            {
              paddingLeft: contentHorizontalPadding,
              paddingRight: contentHorizontalPadding,
            },
          ]}
          renderItem={({ item, index }) =>
            renderStockCard(item, index === investmentOptions.length - 1, selectedYears, 'past')
          }
        />

        <View style={[styles.sectionSpacing, { height: sectionVerticalSpacing }]} />

        <PageHeader>
          <View>
            <Text style={styles.futureTitle}>Your {formattedAmount} could become...</Text>
          </View>
          <Text style={styles.futureSubtitle}>If invested today for {formattedFutureYearsLabel}</Text>
        </PageHeader>

        <YearSelector options={[1, 3, 5, 10, 20]} value={selectedFutureYears} onChange={setSelectedFutureYears} compact={isSmallPhone} style={[styles.yearSelector, isSmallPhone && styles.yearSelectorCompact]} />

        <View style={styles.carouselHeader}>
          <Text style={styles.carouselTitle}>Potential Growth</Text>
          <Text style={styles.carouselSubtitle}>Compare returns if you started now</Text>
        </View>

        <Carousel
          data={futureInvestmentOptions}
          keyExtractor={(item: any) => `future-${item.ticker}`}
          snapInterval={snapInterval}
          contentContainerStyle={[
            styles.carousel,
            {
              paddingLeft: contentHorizontalPadding,
              paddingRight: contentHorizontalPadding,
            },
          ]}
          renderItem={({ item, index }) =>
            renderStockCard(item, index === futureInvestmentOptions.length - 1, selectedFutureYears, 'future')
          }
        />

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

    <View style={[styles.warningBox, isSmallPhone && styles.warningBoxCompact]}>
          <Ionicons name="warning" size={28} color={palette.red} style={styles.warningIcon} />
          <Text style={styles.warningText}>
            Projections are hypothetical. Past performance does not guarantee future results.
          </Text>
        </View>
        </ScrollView>
    </ScreenContainer>
  );
}

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
  yearSelector: ViewStyle;
  yearSelectorCompact: ViewStyle;
  yearSegment: ViewStyle;
  yearSegmentActive: ViewStyle;
  yearSegmentInactive: ViewStyle;
  yearText: TextStyle;
  yearTextActive: TextStyle;
  yearTextInactive: TextStyle;
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
  warningBox: ViewStyle;
  warningBoxCompact: ViewStyle;
  warningIcon: TextStyle;
  warningText: TextStyle;
  saveButton: ViewStyle;
  saveButtonText: TextStyle;
  cancelButton: ViewStyle;
  cancelButtonText: TextStyle;
};

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
    justifyContent: 'flex-start',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerRowCompact: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
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
    color: palette.black,
    marginBottom: spacing.sm,
  },
  projectionSubtitle: {
    ...typography.body,
    color: palette.black,
    opacity: 0.7,
  },
  yearSelector: {
    flexDirection: 'row',
    marginBottom: spacing.xl + spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: alpha.faintBlack,
    padding: spacing.xs,
  },
  yearSelectorCompact: {
    marginBottom: spacing.xl,
  },
  yearSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs / 2,
    borderRadius: radii.pill,
  },
  yearSegmentActive: {
    backgroundColor: palette.green,
    shadowColor: palette.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  yearSegmentInactive: {
    backgroundColor: 'transparent',
  },
  yearText: {
    ...typography.captionStrong,
  },
  yearTextActive: {
    color: palette.white,
  },
  yearTextInactive: {
    color: palette.black,
    opacity: 0.6,
  },
  carouselHeader: {
    marginBottom: spacing.md,
  },
  carouselTitle: {
    ...typography.bodyStrong,
    color: palette.black,
  },
  carouselSubtitle: {
    ...typography.caption,
    color: alpha.subtleBlack,
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
    color: palette.black,
    marginBottom: spacing.sm,
  },
  futureSubtitle: {
    ...typography.body,
    color: palette.black,
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
    color: palette.black,
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
    fontSize: 28,
    color: palette.black,
  },
  stockValueCaption: {
    ...typography.caption,
    color: alpha.subtleBlack,
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
    color: alpha.mutedBlack,
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
  warningBox: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.lightGray,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: alpha.faintBlack,
  },
  warningBoxCompact: {
    padding: spacing.md,
  },
  warningIcon: {
    marginRight: spacing.md,
  },
  warningText: {
    ...typography.caption,
    color: palette.black,
    opacity: 0.8,
    lineHeight: 18,
    flex: 1,
    textAlign: 'left',
  },
  saveButton: {
    backgroundColor: palette.green,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  saveButtonText: {
    color: palette.white,
    ...typography.button,
  },
  cancelButton: {
    backgroundColor: alpha.subtleBlack,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: palette.white,
    ...typography.button,
  },
});