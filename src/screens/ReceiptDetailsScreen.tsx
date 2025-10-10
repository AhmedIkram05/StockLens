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
            <Ionicons name="chevron-back" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.receiptCard}>
          {image ? (
            <Image source={{ uri: image }} style={styles.receiptImage} />
          ) : (
            <View style={styles.receiptPlaceholder}>
              <Ionicons name="receipt-outline" size={28} color="#10b981" />
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
          <Text style={styles.futureTitle}>If invested today...</Text>
          <Text style={styles.futureSubtitle}>Your {formattedAmount} could be worth in the future</Text>
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
          <Ionicons name="trash-outline" size={20} color="#ffffff" style={styles.deleteIcon} />
          <Text style={styles.deleteText}>Delete Receipt</Text>
        </TouchableOpacity>

        <View style={styles.warningBox}>
          <Ionicons name="warning" size={28} color="#8a8a8aff" style={styles.warningIcon} />
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  receiptImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
  },
  receiptPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptInfo: {
    flex: 1,
  },
  receiptMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  receiptAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 14,
    color: '#666666',
  },
  projectionHeader: {
    marginTop: 30,
    marginBottom: 20,
  },
  projectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  projectionSubtitle: {
    fontSize: 16,
    color: '#000000',
    opacity: 0.7,
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  yearPill: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearPillActive: {
    backgroundColor: '#10b981',
  },
  yearPillInactive: {
    backgroundColor: '#e5e5e5',
  },
  yearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  yearTextActive: {
    color: '#ffffff',
  },
  yearTextInactive: {
    color: '#000000',
    opacity: 0.6,
  },
  carouselHeader: {
    marginBottom: 12,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  carouselSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  carousel: {
    paddingBottom: 10,
  },
  sectionSpacing: {
    height: 32,
  },
  futureHeader: {
    marginBottom: 20,
  },
  futureTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  futureSubtitle: {
    fontSize: 16,
    color: '#000000',
    opacity: 0.7,
  },
  stockCard: {
    width: 260,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  stockCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  stockTicker: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  stockValueContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stockValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  stockValueCaption: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#000000ff',
    marginBottom: 16,
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
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  footerValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#000000ff',
    marginHorizontal: 12,
  },
  deleteButton: {
    marginTop: 36,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  warningIcon: {
    marginRight: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#000000',
    opacity: 0.8,
    lineHeight: 18,
    flex: 1,
    textAlign: 'left',
  },
});