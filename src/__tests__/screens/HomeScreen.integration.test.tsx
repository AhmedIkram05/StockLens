/**
 * HomeScreen Integration Tests
 * 
 * Purpose: Validates the main dashboard screen that displays spending
 * overview and quick access to scanning.
 * 
 * What it tests:
 * - Empty state with onboarding message when no receipts exist
 * - Spending stats display (total, average, receipt count)
 * - History list expansion/collapse toggle
 * - Navigation to Scan screen from CTA button
 * - Navigation to ReceiptDetails when tapping a receipt
 * - Receipt data transformation and display format
 * 
 * Why it's important: HomeScreen is the first screen users see after
 * login. It must gracefully handle empty state to guide new users,
 * accurately display spending statistics, and provide quick access
 * to key features (scanning, viewing receipt details).
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '@/screens/HomeScreen';
import { renderWithProviders } from '../utils';
import useReceipts from '@/hooks/useReceipts';
import { useNavigation } from '@react-navigation/native';
import { createUserProfile } from '../fixtures';

jest.mock('@/hooks/useReceipts', () => jest.fn());

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

const mockedUseReceipts = useReceipts as jest.MockedFunction<typeof useReceipts>;
const mockedUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = () => {
    const testUser = createUserProfile({ first_name: 'Alex', uid: 'user-1' });
    return renderWithProviders(<HomeScreen />, {
      providerOverrides: {
        withNavigation: false,
        authValue: {
          userProfile: testUser as any,
          user: { uid: testUser.uid } as any,
        },
      },
    });
  };

  it('shows onboarding empty state and navigates to Scan when CTA pressed', () => {
    const navigateSpy = jest.fn();
    mockedUseNavigation.mockReturnValue({ navigate: navigateSpy } as any);
    mockedUseReceipts.mockReturnValue({ receipts: [], loading: false, error: null });

    const { getByText } = renderScreen();

    expect(getByText('No Receipts Yet')).toBeTruthy();
    fireEvent.press(getByText('Scan Your First Receipt'));

    expect(navigateSpy).toHaveBeenCalledWith('MainTabs', { screen: 'Scan' });
  });

  it('renders stats, toggles history, and opens receipt details', async () => {
    const navigateSpy = jest.fn();
    mockedUseNavigation.mockReturnValue({ navigate: navigateSpy } as any);
    mockedUseReceipts.mockReturnValue({
      receipts: [
        { id: '1', label: '2 hours ago', amount: 80, date: '2025-02-01T10:00:00Z', time: '9:00', image: 'uri://receipt-1' },
        { id: '2', label: 'Yesterday', amount: 40, date: '2025-01-05T10:00:00Z', time: '12:00', image: 'uri://receipt-2' },
        { id: '3', label: 'Last week', amount: 20, date: '2024-12-15T10:00:00Z', time: '15:00', image: 'uri://receipt-3' },
        { id: '4', label: '2 weeks ago', amount: 10, date: '2024-12-01T10:00:00Z', time: '11:00', image: 'uri://receipt-4' },
      ],
      loading: false,
      error: null,
    });

    const { getByText, getAllByTestId } = renderScreen();

    await waitFor(() => expect(getByText('Total Money Spent')).toBeTruthy());
    expect(getByText('£150.00')).toBeTruthy();
    expect(getByText('Receipts Scanned')).toBeTruthy();
    expect(getByText('£80.00')).toBeTruthy();

    fireEvent.press(getByText('View all history'));
    expect(getByText('Show Less')).toBeTruthy();

    fireEvent.press(getAllByTestId('receipt-card')[0]);
    expect(navigateSpy).toHaveBeenCalledWith('ReceiptDetails', expect.objectContaining({ receiptId: '1', totalAmount: 80 }));
  });
});
