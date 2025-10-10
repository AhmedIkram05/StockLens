import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import type { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  StackNavigationProp<RootStackParamList>
>;
// Temporary mock data for recent scans - to be replaced with real data from backend
export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const [showAllHistory, setShowAllHistory] = useState(false);

  const recentScans = useMemo(
    () => [
      {
        id: 'receipt-001',
        merchant: 'Tesco Superstore',
        amount: 42.78,
        date: '15 Sep 2025',
        time: '2 hours ago',
        image:
          'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=200&q=60',
      },
      {
        id: 'receipt-002',
        merchant: 'Starbucks',
        amount: 8.5,
        date: '14 Sep 2025',
        time: '1 day ago',
        image:
          'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=200&q=60',
      },
    ],
    []
  );

  const allScans = recentScans;

  // Check if user has any scans
  const hasScans = recentScans.length > 0;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {hasScans ? (
          // Regular dashboard with scans
          <>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.titlePrefix}>Your </Text>
                <Text style={styles.titleStock}>Stock</Text>
                <Text style={styles.titleLens}>Lens</Text>
              </View>
              <Text style={styles.subtitle}>What if you invested instead?</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statCardGreen}>
                <Text style={styles.statValue}>£12,450</Text>
                {/* Mock total possible value to be replaced with real calculation for 5 year projection */}
                <Text style={styles.statLabel}>Total Possible Value (5 Yrs)</Text>
              </View>
              <View style={styles.statCardBlue}>
                <Text style={styles.statValue}>{recentScans.length}</Text>
                <Text style={styles.statLabel}>Receipts Scanned</Text>
              </View>
            </View>

            <View style={styles.recentScans}>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
              {(showAllHistory ? allScans : recentScans).map((scan) => (
                <TouchableOpacity
                  key={scan.id}
                  style={styles.scanCard}
                  onPress={() =>
                    navigation.navigate('ReceiptDetails', {
                      receiptId: scan.id,
                      merchantName: scan.merchant,
                      totalAmount: scan.amount,
                      date: scan.date,
                      image: scan.image,
                    })
                  }
                >
                  <Image source={{ uri: scan.image }} style={styles.scanImage} />
                  <View style={styles.scanInfo}>
                    <Text style={styles.scanAmount}>{formatAmount(scan.amount)}</Text>
                    <Text style={styles.scanMerchant}>{scan.merchant}</Text>
                    <Text style={styles.scanTime}>{scan.time}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => setShowAllHistory(!showAllHistory)}
              >
                <Text style={styles.viewAllText}>
                  {showAllHistory ? 'Show Less' : 'View all history'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // Empty state dashboard
          <>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Text style={styles.titlePrefix}>Your </Text>
                <Text style={styles.titleStock}>Stock</Text>
                <Text style={styles.titleLens}>Lens</Text>
              </View>
              <Text style={styles.subtitle}>Track your missed opportunities</Text>
            </View>

            <View style={styles.emptyStateContainer}>
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark-circle" size={120} color="#10b981" />
              </View>

              <Text style={styles.emptyTitle}>No Receipts Yet</Text>
              <Text style={styles.emptySubtitle}>
                Scan your first receipt to discover what your purchases could have been worth
              </Text>

              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => navigation.navigate('Scan' as never)}
              >
                <Ionicons name="camera-outline" size={24} color="#ffffff" />
                <Text style={styles.scanButtonText}>Scan your first receipt</Text>
              </TouchableOpacity>

              <View style={styles.onboardingCards}>
                <View style={styles.onboardingCard}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>1</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Scan Your Receipt</Text>
                    <Text style={styles.cardSubtitle}>Take a photo of any receipt to get started</Text>
                  </View>
                </View>

                <View style={styles.onboardingCard}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>2</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>See Investment Potential</Text>
                    <Text style={styles.cardSubtitle}>Discover what your spending could be worth if invested</Text>
                  </View>
                </View>

                <View style={styles.onboardingCard}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>3</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Track Your Progress</Text>
                    <Text style={styles.cardSubtitle}>Monitor your spending patterns and investment opportunities</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#f5f5f5', // Light gray background instead of blue
    padding: 20,    // Reduced top padding to bring closer to status bar
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titlePrefix: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#000000', // Black
  },
  titleStock: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#000000', // Black
  },
  titleLens: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#10b981', // Green
  },
  subtitle: {
    fontSize: 22,
    fontStyle: 'italic',
    color: '#000000', // Black
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  statCardGreen: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardBlue: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  recentScans: {
    padding: 20,
  },
  scanCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 22,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scanImage: {
    width: 60,
    height: 40,
    borderRadius: 6,
    marginRight: 15,
  },
  scanInfo: {
    flex: 1,
  },
  scanAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  scanTime: {
    fontSize: 14,
    color: '#666666',
  },
  scanMerchant: {
    fontSize: 14,
    color: '#333333',
  },
  chevron: {
    fontSize: 24,
    color: 'grey',
    fontWeight: 'bold',
  },
  viewAllButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  viewAllText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
  },
  checkmarkContainer: {
    marginVertical: 30,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  scanButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  onboardingCards: {
    width: '100%',
  },
  onboardingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  numberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  numberText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});