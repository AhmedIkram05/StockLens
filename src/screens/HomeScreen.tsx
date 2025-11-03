import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';

import { useTheme } from '../contexts/ThemeContext';
import { radii, shadows, spacing, typography } from '../styles/theme';
import ScreenContainer from '../components/ScreenContainer';
import ResponsiveContainer from '../components/ResponsiveContainer';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ReceiptCard from '../components/ReceiptCard';
import EmptyState from '../components/EmptyState';
import { useBreakpoint } from '../hooks/useBreakpoint';
import useReceipts from '../hooks/useReceipts';
import { formatCurrencyGBP, formatRelativeDate, formatCurrencyRounded } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
import type { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import ReceiptsSorter, { SortBy, SortDirection } from '../components/ReceiptsSorter';
import { Ionicons } from '@expo/vector-icons';

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  StackNavigationProp<RootStackParamList>
>;
export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { theme } = useTheme();

  const { user } = useAuth();
  const { receipts: allScans, loading: receiptsLoading, error: receiptsError } = useReceipts(user?.uid);

  // Extract first name from user profile
  const { userProfile } = useAuth();
  const firstName = useMemo(() => {
    if (userProfile?.full_name) {
      const nameParts = userProfile.full_name.trim().split(' ');
      return nameParts[0];
    }
    return '';
  }, [userProfile?.full_name]);

  // Check if user has any scans
  const hasScans = allScans.length > 0;

  const { contentHorizontalPadding, sectionVerticalSpacing, isTablet, isLargePhone, width } = useBreakpoint();
  const scrollPadding = useMemo(() => ({ paddingBottom: sectionVerticalSpacing }), [sectionVerticalSpacing]);
  // contentWidth used for computing grid item sizes
  const contentWidth = Math.min(width - contentHorizontalPadding * 2, isTablet ? 960 : width - contentHorizontalPadding * 2);

  const formatAmount = (amount: number) => formatCurrencyRounded(amount || 0);

  const totalMoneySpentDerived = useMemo(() => {
    return allScans.reduce((s, r) => s + (r.amount || 0), 0);
  }, [allScans]);

  const sortedReceipts = useMemo(() => {
    const sorted = [...allScans].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [allScans, sortBy, sortDirection]);

  const formatReceiptLabel = (iso?: string) => formatRelativeDate(iso);

  return (
    <ScreenContainer contentStyle={{ paddingVertical: sectionVerticalSpacing }}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {hasScans ? (
          <>
            <ResponsiveContainer maxWidth={isTablet ? 960 : width - contentHorizontalPadding * 2}>
              <PageHeader>
                <View style={styles.titleContainer}>
                  <Text style={[styles.titlePrefix, { color: theme.text }]}>{firstName}'s </Text>
                  <Text style={[styles.titleStock, { color: theme.text }]}>Stock</Text>
                  <Text style={[styles.titleLens, { color: theme.primary }]}>Lens</Text>
                </View>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>What if you invested instead?</Text>
              </PageHeader>

            <View style={styles.statsContainer}>
              <StatCard
                value={
                  <View style={styles.valueWithIcon}>
                    <Ionicons name="cash-outline" size={28} color={theme.surface} />
                    <Text style={[styles.statValue, { color: theme.textOnColor, fontSize: 28 }]}>{formatAmount(totalMoneySpentDerived)}</Text>
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
                    <Text style={[styles.statValue, { color: theme.textOnColor, fontSize: 28 }]}>{allScans.length}</Text>
                  </View>
                }
                label="Receipts Scanned"
                variant="blue"
              />
            </View>

            <View style={styles.recentScans}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Scans</Text>
              <ReceiptsSorter
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={(by, dir) => {
                  setSortBy(by);
                  setSortDirection(dir);
                }}
              />
              {(() => {
                const preview = sortedReceipts.slice(0, 3);
                const list = showAllHistory ? sortedReceipts : preview;
                const cols = isTablet ? 2 : 1;
                // Use percentage widths so items wrap cleanly without negative margins
                const itemWidthPercent = `${100 / cols}%`;

                return (
                  // grid wrapper — keep simple row/wrap layout; padding is handled
                  // by ScreenContainer / ResponsiveContainer so we don't double-pad
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {list.map((scan) => (
                      <View
                        key={scan.id}
                        // flexBasis percentage ensures consistent wrapping; cast to any to satisfy RN typing for percentage strings
                        style={{ flexBasis: `${100 / cols}%`, paddingHorizontal: spacing.xs } as any}
                      >
                        <View style={{ width: '100%' }}>
                          <ReceiptCard
                            image={scan.image}
                            amount={formatAmount(scan.amount)}
                            merchant={scan.merchant ?? formatReceiptLabel(scan.date)}
                            time={scan.time}
                            onPress={() =>
                              navigation.navigate('ReceiptDetails', {
                                receiptId: scan.id,
                                totalAmount: scan.amount,
                                date: scan.date,
                                image: scan.image,
                              })
                            }
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })()}

              <TouchableOpacity style={styles.viewAllButton} onPress={() => setShowAllHistory(!showAllHistory)}>
                <Text style={[styles.viewAllText, { color: theme.text }]}>{showAllHistory ? 'Show Less' : 'View all history'}</Text>
              </TouchableOpacity>
            </View>
            </ResponsiveContainer>
          </>
        ) : (
          <>
            <PageHeader>
              <View style={styles.titleContainer}>
                <Text style={styles.titlePrefix}>Your </Text>
                <Text style={styles.titleStock}>Stock</Text>
                <Text style={styles.titleLens}>Lens</Text>
              </View>
              <Text style={styles.subtitle}>Track your missed opportunities</Text>
            </PageHeader>

            <ResponsiveContainer maxWidth={isTablet ? 960 : width - contentHorizontalPadding * 2}>
              <View style={styles.emptyStateContainer}>
              <EmptyState
                title="No Receipts Yet"
                subtitle="Scan your first receipt to discover what your purchases could have been worth"
                primaryText="Scan your first receipt"
                onPrimaryPress={() => navigation.navigate('MainTabs' as any, { screen: 'Scan' })}
              />

              <View style={styles.onboardingCards}>
                                <View style={[styles.onboardingCard, { backgroundColor: theme.surface }]}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>1</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Scan Your Receipts</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Take photos of your spending to track expenses</Text>
                  </View>
                </View>

                <View style={[styles.onboardingCard, { backgroundColor: theme.surface }]}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>2</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>See Investment Potential</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Discover what your spending could be worth if invested</Text>
                  </View>
                </View>

                <View style={[styles.onboardingCard, { backgroundColor: theme.surface }]}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>3</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Track Your Progress</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Monitor your spending patterns and investment opportunities</Text>
                  </View>
                </View>
              </View>
            </View>
            </ResponsiveContainer>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titlePrefix: {
    ...typography.pageTitle,
  },
  titleStock: {
    ...typography.pageTitle,
  },
  titleLens: {
    ...typography.pageTitle,
  },
  subtitle: {
    ...typography.pageSubtitle,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    // keep side-by-side on all devices
  },
  statCardGreen: {
    borderRadius: radii.md,
    padding: spacing.lg,
    width: '48%',
    alignItems: 'center',
    ...shadows.level2,
    marginBottom: spacing.md,
  },
  statCardBlue: {
    borderRadius: radii.md,
    padding: spacing.lg,
    width: '48%',
    alignItems: 'center',
    ...shadows.level2,
    marginBottom: spacing.md,
  },
  statSubtitle: {
    ...typography.caption,
    opacity: 0.9,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  statValue: {
    ...typography.metricSm,
    fontWeight: '700',
    textAlign: 'center',
  },
  statLabel: {
    ...typography.caption,
    textAlign: 'center',
    opacity: 0.9,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    opacity: 0.85,
    marginBottom: spacing.md,
  },
  recentScans: {
    paddingBottom: spacing.xl,
  },
  viewAllButton: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  viewAllText: {
    ...typography.button,
  },
  emptyStateContainer: {
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  onboardingCards: {
    width: '100%',
  },
  onboardingCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  onboardingCardTablet: {
    flex: 1,
    marginHorizontal: spacing.sm,
    // avoid hardcoded minWidth; derive from theme tokens
    minWidth: Math.round(spacing.xxl * 5),
  },
  onboardingCard: {
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.level1,
  },
  numberCircle: {
    width: Math.round(spacing.xxl * 1.5),
    height: Math.round(spacing.xxl * 1.5),
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  numberCircleTablet: {
    width: Math.round(spacing.xxl * 2),
    height: Math.round(spacing.xxl * 2),
    marginRight: spacing.lg,
  },
  numberText: {
    ...typography.metricSm,
  },
  numberTextTablet: {
    // use theme typography sizes instead of hardcoded values
    fontSize: (typography.metric && (typography.metric.fontSize as number)) || 20,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.caption,
    // derive lineHeight from the caption font size so it scales on tablets
    lineHeight: Math.round(((typography.caption.fontSize as number) || 14) * 1.4),
  },
  valueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});