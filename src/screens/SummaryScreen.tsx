import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SummaryScreen() {
  // Placeholder values; replace with real analytics once available
  const totalMoneySpent = 12450;
  const totalMissedFiveYears = 18720;
  const receiptsScanned = 68;
  const totalMissedTenYears = 27430;

  const topStocks = [
    {
      company: 'NVIDIA Corporation',
      ticker: 'NVDA',
      sector: 'AI/Semiconductors',
      growth: '+180%',
      period: '5Y est.',
    },
    {
      company: 'Tesla Inc',
      ticker: 'TSLA',
      sector: 'Electric Vehicles',
      growth: '+145%',
      period: '5Y est.',
    },
    {
      company: 'Microsoft Corporation',
      ticker: 'MSFT',
      sector: 'Cloud/AI',
      growth: '+120%',
      period: '5Y est.',
    },
  ];

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Summary</Text>
          <Text style={styles.subtitle}>Your investment insights at a glance</Text>
        </View>

        <View style={styles.cardsGrid}>
          <View style={[styles.card, styles.cardBlue]}>
            <Text style={styles.cardValue}>{formatCurrency(totalMoneySpent)}</Text>
            <Text style={styles.cardTitle}>Total Money Spent</Text>
            <Text style={styles.cardSubtitle}>Across all scanned receipts</Text>
          </View>

          <View style={[styles.card, styles.cardGreen]}>
            <Text style={styles.cardValue}>{formatCurrency(totalMissedFiveYears)}</Text>
            <Text style={styles.cardTitle}>Total missed opportunity</Text>
            <Text style={styles.cardSubtitle}>If invested 5 years ago</Text>
          </View>

          <View style={[styles.card, styles.cardWhite]}>
            <Text style={[styles.cardValue, styles.cardValueDark]}>{receiptsScanned}</Text>
            <Text style={styles.cardTitleDark}>Receipts scanned</Text>
          </View>

          <View style={[styles.card, styles.cardGreen]}>
            <Text style={styles.cardValue}>{formatCurrency(totalMissedTenYears)}</Text>
            <Text style={styles.cardTitle}>Total missed opportunity</Text>
            <Text style={styles.cardSubtitle}>If invested 10 years ago</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top 3 Future Stocks (5Y Projection)</Text>
        </View>

        <View style={styles.stockList}>
          {topStocks.map((stock, index) => (
            <View key={stock.ticker} style={[styles.stockRow, index < topStocks.length - 1 && styles.rowDivider]}>
              <View style={styles.stockInfo}>
                <Text style={styles.stockCompany}>{stock.company}</Text>
                <Text style={styles.stockMeta}>{`${stock.ticker} • ${stock.sector}`}</Text>
              </View>
              <View style={styles.stockGrowthContainer}>
                <Text style={styles.stockGrowth}>{stock.growth}</Text>
                <Text style={styles.stockPeriod}>{stock.period}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
        </View>

        <View style={styles.quickStatsRow}>
          {quickStats.map((stat, index) => (
            <View
              key={stat.label}
              style={[styles.quickStatCard, index === 0 && styles.quickStatCardMargin]}
            >
              <Text style={styles.quickStatValue}>{stat.value}</Text>
              <Text style={styles.quickStatLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

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
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 18,
    color: '#333333',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardBlue: {
    backgroundColor: '#007AFF',
  },
  cardGreen: {
    backgroundColor: '#10b981',
  },
  cardWhite: {
    backgroundColor: '#ffffff',
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  cardValueDark: {
    color: '#000000',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  cardTitleDark: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitleDark: {
    fontSize: 14,
    color: '#333333',
    opacity: 0.9,
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  stockList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  stockInfo: {
    flexShrink: 1,
    paddingRight: 12,
  },
  stockCompany: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  stockMeta: {
    fontSize: 14,
    color: '#475569',
  },
  stockGrowthContainer: {
    alignItems: 'flex-end',
  },
  stockGrowth: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  stockPeriod: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 12,
  },
  quickStatCardMargin: {
    marginRight: 12,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  quickStatLabel: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  insightsList: {
    marginBottom: 20,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  insightEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#4b5563',
  },
});