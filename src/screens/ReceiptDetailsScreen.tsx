import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { palette, alpha } from '../styles/palette';
import { radii, shadows, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { receiptService } from '../services/dataService';
import { TextInput } from 'react-native';
import ConfirmScanModal from '../components/ConfirmScanModal';
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

import { stockService } from '../services/dataService';
import { subscribe } from '../services/eventBus';
import { emit } from '../services/eventBus';
import { getHistoricalCAGRFromToday, projectUsingHistoricalCAGR } from '../services/projectionService';
import YearSelector from '../components/YearSelector';
import { ScrollView } from 'react-native';

// compute historical CAGR from series for `years` (returns annualized rate, e.g. 0.15 for 15%)
function computeCAGR(data: { date: string; adjustedClose?: number; close: number }[], years: number) {
  if (!data || data.length < 2 || years <= 0) return null;
  const firstVal = data[0].adjustedClose ?? data[0].close;
  const lastVal = data[data.length - 1].adjustedClose ?? data[data.length - 1].close;
  if (!firstVal || !lastVal || firstVal <= 0) return null;

  // compute actual time span in years between first and last data points
  try {
    const firstDate = new Date(data[0].date);
    const lastDate = new Date(data[data.length - 1].date);
    const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
    const actualYears = (lastDate.getTime() - firstDate.getTime()) / msPerYear;
    if (!(actualYears > 0)) return null;
    return Math.pow(lastVal / firstVal, 1 / actualYears) - 1;
  } catch (e) {
    // fallback to using provided years if date parsing fails
    return Math.pow(lastVal / firstVal, 1 / years) - 1;
  }
}

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
  const [saving, setSaving] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState<boolean>(false);

  // Use editable amount (parsed from string) as the base for projections and displays
  // Keep `amount` in sync with `amountStr` for computed projections
  useEffect(() => {
    const parsed = Number(String(amountStr).replace(/,/g, '.'));
    setAmount(Number.isFinite(parsed) ? parsed : 0);
  }, [amountStr]);

  // show confirmation modal after a fresh scan (new receipt with OCR-provided total)
  useEffect(() => {
    const isNewScan = !receiptId && initialAmount != null;
    if (isNewScan) setConfirmVisible(true);
  }, [receiptId, initialAmount]);

  const totalAmount = amount;
  const { userProfile } = useAuth();
  const { contentHorizontalPadding, sectionVerticalSpacing, isSmallPhone, isTablet, width } = useBreakpoint();

  const reloadReceipt = async () => {
    try {
      if (receiptId) {
        const num = Number(receiptId);
        const r = await receiptService.getById(num);
        if (r) {
          setAmount(r.total_amount || 0);
          setAmountStr(r.total_amount != null ? String(r.total_amount) : '');
        }
      }
    } catch (e) {
      // noop
    }
  };

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

  const formattedAmount = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(totalAmount);

  const formattedEditableAmount = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount || 0);

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

    const futureDisplay = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(computedFutureValue);

    const gainDisplay = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(computedGain);

  const percentDisplay = `${computedPercentReturn.toFixed(1)}%`;

  // color: green for positive or zero, red for negative
  const valueColor = computedPercentReturn >= 0 ? palette.green : palette.red;

    return (
      <View style={[styles.stockCard, stockCardLayout, isLastItem && styles.stockCardLast]}>
        <View style={styles.stockCardHeader}>
          <Text style={styles.stockName}>{investmentValue.name}</Text>
          <Text style={styles.stockTicker}>{investmentValue.ticker}</Text>
        </View>

        <View style={styles.stockValueContainer}>
          <Text style={styles.stockValue}>{futureDisplay}</Text>
          <Text style={styles.stockValueCaption}>Investment of {formattedAmount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.stockFooter}>
          <View style={styles.stockFooterItem}>
            <Text style={styles.footerLabel}>Return</Text>
            <Text style={[styles.footerValue, { color: valueColor }]}>{percentDisplay}</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.stockFooterItem}>
            <Text style={styles.footerLabel}>Gained</Text>
            <Text style={[styles.footerValue, { color: computedGain >= 0 ? palette.green : palette.red }]}>{gainDisplay}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isSmallPhone && styles.contentCompact,
          {
            paddingHorizontal: contentHorizontalPadding,
            paddingBottom: sectionVerticalSpacing,
          },
        ]}
      >
    <View style={[styles.headerRow, isSmallPhone && styles.headerRowCompact]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color={palette.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.receiptCard}>
          {image ? (
            <Image source={{ uri: image }} style={styles.receiptImage} />
          ) : (
            <View style={styles.receiptPlaceholder}>
              <Ionicons name="receipt-outline" size={28} color={palette.green} />
            </View>
          )}

          <View style={styles.receiptInfo}>
            <Text style={styles.receiptAmount}>{formattedEditableAmount}</Text>
            <Text style={styles.receiptDate}>{new Date(date).toLocaleString()}</Text>
          </View>
        </View>

        {/* Amount is shown in the top receipt card; duplicate body display removed */}

        <ConfirmScanModal
          visible={confirmVisible}
          scannedTotal={initialAmount}
          onConfirm={async () => {
            // save scanned amount
            try {
              setSaving(true);
              const uid = userProfile?.uid || 'local';
              const parsed = Number(String(initialAmount).replace(/,/g, '.'));
              let savedId: number | null = null;
              if (receiptId) {
                await receiptService.update(Number(receiptId), { total_amount: parsed, synced: 0 });
                savedId = Number(receiptId);
              } else {
                const created = await receiptService.create({ user_id: uid, image_uri: image, total_amount: parsed, synced: 0 });
                if (created && Number(created) > 0) savedId = Number(created);
              }
              try { emit('receipts-changed', { id: savedId }); } catch (e) {}
              setSaving(false);
              setConfirmVisible(false);
              navigation.navigate('MainTabs' as any);
            } catch (e: any) {
              setSaving(false);
              Alert.alert('Save Error', e?.message || 'Failed to save receipt');
            }
          }}
          onRescan={() => {
            setConfirmVisible(false);
            navigation.navigate('Scan' as any);
          }}
          onManual={async (v: number) => {
            // save manual entry
            try {
              setSaving(true);
              const uid = userProfile?.uid || 'local';
              let savedId: number | null = null;
              if (receiptId) {
                await receiptService.update(Number(receiptId), { total_amount: v, synced: 0 });
                savedId = Number(receiptId);
              } else {
                const created = await receiptService.create({ user_id: uid, image_uri: image, total_amount: v, synced: 0 });
                if (created && Number(created) > 0) savedId = Number(created);
              }
              try { emit('receipts-changed', { id: savedId }); } catch (e) {}
              setSaving(false);
              setConfirmVisible(false);
              navigation.navigate('MainTabs' as any);
            } catch (e: any) {
              setSaving(false);
              Alert.alert('Save Error', e?.message || 'Failed to save receipt');
            }
          }}
          onClose={() => setConfirmVisible(false)}
        />

        <View style={[styles.projectionHeader, isSmallPhone && styles.projectionHeaderCompact]}>
          <Text style={styles.projectionTitle}>Your {formattedAmount} could have been...</Text>
          <Text style={styles.projectionSubtitle}>If invested {formattedYearsLabel} ago</Text>
        </View>

        <YearSelector options={[1, 3, 5, 10, 20]} value={selectedYears} onChange={setSelectedYears} compact={isSmallPhone} style={[styles.yearSelector, isSmallPhone && styles.yearSelectorCompact]} />

        <View style={styles.carouselHeader}>
          <Text style={styles.carouselTitle}>Investment Outlook</Text>
          <Text style={styles.carouselSubtitle}>Swipe to explore different stocks</Text>
        </View>

        <FlatList
          data={investmentOptions}
          horizontal
          keyExtractor={(item) => item.ticker}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.carousel,
            {
              paddingLeft: contentHorizontalPadding,
              paddingRight: contentHorizontalPadding,
            },
          ]}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={snapInterval}
          renderItem={({ item, index }) =>
            renderStockCard(item, index === investmentOptions.length - 1, selectedYears, 'past')
          }
        />

        <View style={[styles.sectionSpacing, { height: sectionVerticalSpacing }]} />

        <View style={[styles.futureHeader, isSmallPhone && styles.futureHeaderCompact]}>
          <Text style={styles.futureTitle}>Your {formattedAmount} could become...</Text>
          <Text style={styles.futureSubtitle}>If invested today for {formattedFutureYearsLabel}</Text>
        </View>

        <YearSelector options={[1, 3, 5, 10, 20]} value={selectedFutureYears} onChange={setSelectedFutureYears} compact={isSmallPhone} style={[styles.yearSelector, isSmallPhone && styles.yearSelectorCompact]} />

        <View style={styles.carouselHeader}>
          <Text style={styles.carouselTitle}>Potential Growth</Text>
          <Text style={styles.carouselSubtitle}>Compare returns if you started now</Text>
        </View>

        <FlatList
          data={futureInvestmentOptions}
          horizontal
          keyExtractor={(item) => `future-${item.ticker}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.carousel,
            {
              paddingLeft: contentHorizontalPadding,
              paddingRight: contentHorizontalPadding,
            },
          ]}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={snapInterval}
          renderItem={({ item, index }) =>
            renderStockCard(item, index === futureInvestmentOptions.length - 1, selectedFutureYears, 'future')
          }
        />

        <TouchableOpacity
          style={[styles.deleteButton, isSmallPhone && styles.deleteButtonCompact]}
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
          <Ionicons name="trash-outline" size={20} color={palette.white} style={styles.deleteIcon} />
          <Text style={styles.deleteText}>Delete Receipt</Text>
        </TouchableOpacity>

    <View style={[styles.warningBox, isSmallPhone && styles.warningBoxCompact]}>
          <Ionicons name="warning" size={28} color={palette.red} style={styles.warningIcon} />
          <Text style={styles.warningText}>
            Projections are hypothetical. Past performance does not guarantee future results.
          </Text>
        </View>
  </ScrollView>
    </SafeAreaView>
  );
}

type Styles = {
  container: ViewStyle;
  content: ViewStyle;
  contentCompact: ViewStyle;
  headerRow: ViewStyle;
  headerRowCompact: ViewStyle;
  backButton: ViewStyle;
  receiptCard: ViewStyle;
  receiptImage: ImageStyle;
  receiptPlaceholder: ViewStyle;
  receiptInfo: ViewStyle;
  receiptMerchant: TextStyle;
  receiptAmount: TextStyle;
  receiptDate: TextStyle;
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
    paddingHorizontal: spacing.lg,
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
  receiptCard: {
    flexDirection: 'row',
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.level2,
  },
  receiptImage: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    marginRight: spacing.md,
  },
  receiptPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    marginRight: spacing.md,
    backgroundColor: palette.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptInfo: {
    flex: 1,
  },
  receiptMerchant: {
    ...typography.bodyStrong,
    color: palette.black,
    marginBottom: spacing.xs,
  },
  receiptAmount: {
    ...typography.sectionTitle,
    color: palette.black,
    marginBottom: spacing.xs,
  },
  receiptDate: {
    ...typography.caption,
    color: alpha.subtleBlack,
  },
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