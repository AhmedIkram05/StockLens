/**
 * HomeScreen Integration Tests
 *
 * Purpose: Verify the main dashboard behaviour including empty state,
 * displaying spending stats, toggling history, and navigating to the
 * Scan and ReceiptDetails screens.
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '@/screens/HomeScreen';
import { renderWithProviders } from '../utils';
import useReceipts from '@/hooks/useReceipts';
import { useNavigation } from '@react-navigation/native';

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

  const renderScreen = () =>
    renderWithProviders(<HomeScreen />, {
      providerOverrides: {
        withNavigation: false,
        authValue: {
          userProfile: { full_name: 'Alex Johnson' } as any,
          user: { uid: 'user-1' } as any,
        },
      },
    });

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
      ],
      loading: false,
      error: null,
    });

    const { getByText, getAllByTestId } = renderScreen();

    await waitFor(() => expect(getByText('Total Money Spent')).toBeTruthy());
    expect(getByText('£120.00')).toBeTruthy();
    expect(getByText('Receipts Scanned')).toBeTruthy();
    expect(getByText('£80.00')).toBeTruthy();

    fireEvent.press(getByText('View all history'));
    expect(getByText('Show Less')).toBeTruthy();

    fireEvent.press(getAllByTestId('receipt-card')[0]);
    expect(navigateSpy).toHaveBeenCalledWith('ReceiptDetails', expect.objectContaining({ receiptId: '1', totalAmount: 80 }));
  });
});
