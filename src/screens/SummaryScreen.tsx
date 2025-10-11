import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '../styles/palette';
import { radii, shadows, spacing, typography } from '../styles/theme';

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
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
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