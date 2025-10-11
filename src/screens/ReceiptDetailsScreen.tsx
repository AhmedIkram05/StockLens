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

  const formattedAmount = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(totalAmount);

  const formattedYearsLabel = `${selectedYears} ${selectedYears === 1 ? 'year' : 'years'}`;
  const formattedFutureYearsLabel = `${selectedFutureYears} ${selectedFutureYears === 1 ? 'year' : 'years'}`;

  const renderStockCard = (investmentValue: typeof investmentOptions[number]) => {
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
      <View style={styles.stockCard}>
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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
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

        <View style={styles.projectionHeader}>
          <Text style={styles.projectionTitle}>Your {formattedAmount} could have been...</Text>
          <Text style={styles.projectionSubtitle}>If invested {formattedYearsLabel} ago</Text>
        </View>

        <View style={styles.yearSelector}>
          {YEAR_OPTIONS.map(year => (
            <TouchableOpacity
              key={year}
              style={[styles.yearPill, year === selectedYears ? styles.yearPillActive : styles.yearPillInactive]}
              onPress={() => setSelectedYears(year)}
            >
              <Text style={[styles.yearText, year === selectedYears ? styles.yearTextActive : styles.yearTextInactive]}>
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
          contentContainerStyle={styles.carousel}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={280}
          renderItem={({ item }) => renderStockCard(item)}
        />

        <View style={styles.sectionSpacing} />

        <View style={styles.futureHeader}>
          <Text style={styles.futureTitle}>Your {formattedAmount} could become...</Text>
          <Text style={styles.futureSubtitle}>If invested today for {formattedFutureYearsLabel}</Text>
        </View>

        <View style={styles.yearSelector}>
          {YEAR_OPTIONS.map(year => (
            <TouchableOpacity
              key={`future-${year}`}
              style={[styles.yearPill, year === selectedFutureYears ? styles.yearPillActive : styles.yearPillInactive]}
              onPress={() => setSelectedFutureYears(year)}
            >
              <Text
                style={[styles.yearText, year === selectedFutureYears ? styles.yearTextActive : styles.yearTextInactive]}
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
          contentContainerStyle={styles.carousel}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={280}
          renderItem={({ item }) => renderStockCard(item)}
        />

        <TouchableOpacity
          style={styles.deleteButton}
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

        <View style={styles.warningBox}>
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
  headerRow: ViewStyle;
  backButton: ViewStyle;
  receiptCard: ViewStyle;
  receiptImage: ImageStyle;
  receiptPlaceholder: ViewStyle;
  receiptInfo: ViewStyle;
  receiptMerchant: TextStyle;
  receiptAmount: TextStyle;
  receiptDate: TextStyle;
  projectionHeader: ViewStyle;
  projectionTitle: TextStyle;
  projectionSubtitle: TextStyle;
  yearSelector: ViewStyle;
  yearPill: ViewStyle;
  yearPillActive: ViewStyle;
  yearPillInactive: ViewStyle;
  yearText: TextStyle;
  yearTextActive: TextStyle;
  yearTextInactive: TextStyle;
  carouselHeader: ViewStyle;
  carouselTitle: TextStyle;
  carouselSubtitle: TextStyle;
  carousel: ViewStyle;
  sectionSpacing: ViewStyle;
  futureHeader: ViewStyle;
  futureTitle: TextStyle;
  futureSubtitle: TextStyle;
  stockCard: ViewStyle;
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
  deleteIcon: TextStyle;
  deleteText: TextStyle;
  warningBox: ViewStyle;
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
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
    justifyContent: 'space-between',
    marginBottom: spacing.xl + spacing.sm,
  },
  yearPill: {
    flex: 1,
    marginHorizontal: spacing.xs,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearPillActive: {
    backgroundColor: palette.green,
  },
  yearPillInactive: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: alpha.faintBlack,
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
    width: 260,
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginRight: spacing.lg,
    ...shadows.level2,
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