import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
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

type ReceiptDetailsRouteProp = RouteProp<RootStackParamList, 'ReceiptDetails'>;

const YEAR_OPTIONS = [1, 3, 5, 10, 20] as const;

const STOCK_PRESETS = [
  { name: 'Apple', ticker: 'AAPL', returnRate: 0.18 },
  { name: 'Microsoft', ticker: 'MSFT', returnRate: 0.15 },
  { name: 'NVIDIA', ticker: 'NVDA', returnRate: 0.24 },
  { name: 'Amazon', ticker: 'AMZN', returnRate: 0.12 },
  { name: 'Tesla', ticker: 'TSLA', returnRate: 0.28 },
];

export default function ReceiptDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<ReceiptDetailsRouteProp>();
  const {
    totalAmount,
    merchantName,
    date,
    image,
  } = route.params;

  const [selectedYears, setSelectedYears] = useState<typeof YEAR_OPTIONS[number]>(5);
  const [selectedFutureYears, setSelectedFutureYears] = useState<typeof YEAR_OPTIONS[number]>(5);
  const { contentHorizontalPadding, sectionVerticalSpacing, isSmallPhone, isTablet, width } = useBreakpoint();

  const investmentOptions = useMemo(() => {
    return STOCK_PRESETS.map(stock => {
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

  const formattedYearsLabel = `${selectedYears} ${selectedYears === 1 ? 'year' : 'years'}`;
  const formattedFutureYearsLabel = `${selectedFutureYears} ${selectedFutureYears === 1 ? 'year' : 'years'}`;

  const renderStockCard = (
    investmentValue: typeof investmentOptions[number],
    isLastItem: boolean
  ) => {
    const futureDisplay = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(investmentValue.futureValue);

    const gainDisplay = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(investmentValue.gain);

    const percentDisplay = `${investmentValue.percentReturn.toFixed(1)}%`;

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
            <Text style={styles.footerValue}>{percentDisplay}</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.stockFooterItem}>
            <Text style={styles.footerLabel}>Gained</Text>
            <Text style={styles.footerValue}>{gainDisplay}</Text>
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
            <Text style={styles.receiptMerchant}>{merchantName}</Text>
            <Text style={styles.receiptAmount}>{formattedAmount}</Text>
            <Text style={styles.receiptDate}>{date}</Text>
          </View>
        </View>

        <View style={[styles.projectionHeader, isSmallPhone && styles.projectionHeaderCompact]}>
          <Text style={styles.projectionTitle}>Your {formattedAmount} could have been...</Text>
          <Text style={styles.projectionSubtitle}>If invested {formattedYearsLabel} ago</Text>
        </View>

        <View style={[styles.yearSelector, isSmallPhone && styles.yearSelectorCompact]}>
          {YEAR_OPTIONS.map(year => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearSegment,
                year === selectedYears ? styles.yearSegmentActive : styles.yearSegmentInactive,
              ]}
              onPress={() => setSelectedYears(year)}
            >
              <Text
                style={[
                  styles.yearText,
                  year === selectedYears ? styles.yearTextActive : styles.yearTextInactive,
                ]}
              >
                {year}Y
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
            renderStockCard(item, index === investmentOptions.length - 1)
          }
        />

        <View style={[styles.sectionSpacing, { height: sectionVerticalSpacing }]} />

        <View style={[styles.futureHeader, isSmallPhone && styles.futureHeaderCompact]}>
          <Text style={styles.futureTitle}>Your {formattedAmount} could become...</Text>
          <Text style={styles.futureSubtitle}>If invested today for {formattedFutureYearsLabel}</Text>
        </View>

        <View style={[styles.yearSelector, isSmallPhone && styles.yearSelectorCompact]}>
          {YEAR_OPTIONS.map(year => (
            <TouchableOpacity
              key={`future-${year}`}
              style={[
                styles.yearSegment,
                year === selectedFutureYears ? styles.yearSegmentActive : styles.yearSegmentInactive,
              ]}
              onPress={() => setSelectedFutureYears(year)}
            >
              <Text
                style={[
                  styles.yearText,
                  year === selectedFutureYears ? styles.yearTextActive : styles.yearTextInactive,
                ]}
              >
                {year}Y
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
            renderStockCard(item, index === futureInvestmentOptions.length - 1)
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
                { text: 'Delete', style: 'destructive' },
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
});