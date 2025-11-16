/**
 * useReceipts Unit Tests
 * 
 * Purpose: Validates the receipt management hook that fetches and transforms
 * receipt data for display in the UI.
 * 
 * What it tests:
 * - Initial data fetching for authenticated users
 * - Event bus subscription for real-time updates
 * - Periodic refresh intervals (30 seconds)
 * - Data normalization (converting DB receipts to display format)
 * - Error handling and cleanup on unmount
 * 
 * Why it's important: This hook powers the receipt list display across
 * multiple screens (Home, Summary). Ensures receipts stay synchronized
 * across the app when users add/delete receipts, and properly cleans up
 * subscriptions to prevent memory leaks.
 */

import { act, renderHook, waitFor } from '@testing-library/react-native';
import useReceipts from '@/hooks/useReceipts';
import { receiptService } from '@/services/dataService';
import { subscribe } from '@/services/eventBus';
import { createReceipt } from '../fixtures';

// Handler type used by the mocked event bus
type ReceiptsChangedHandler = (payload?: { userId?: string }) => void;

// Mock the data service and event bus to avoid network/DB calls
jest.mock('@/services/dataService', () => ({
  receiptService: {
    getByUserId: jest.fn(),
  },
}));

jest.mock('@/services/eventBus', () => ({
  subscribe: jest.fn(),
}));

const mockedReceiptService = receiptService as jest.Mocked<typeof receiptService>;
const mockedSubscribe = subscribe as jest.MockedFunction<typeof subscribe>;

describe('useReceipts', () => {
  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
  });

  /**
   * Test: Fetch, refresh, and cleanup
   * - Verifies initial fetch for the provided user id
   * - Ensures the hook responds to event bus notifications by re-fetching
   * - Verifies periodic refresh via timers and cleanup/unsubscribe on unmount
   */
  it('fetches receipts for the user, refreshes on events, and cleans up on unmount', async () => {
    jest.useFakeTimers();
    const unsubSpy = jest.fn();
    const handlers: ReceiptsChangedHandler[] = [];
    mockedSubscribe.mockImplementation((_event: string, handler: ReceiptsChangedHandler) => {
      handlers.push(handler);
      return unsubSpy;
    });

    // Initial response returned by mocked service
    const receipt1 = createReceipt({ id: 7, total_amount: 42.5, date_scanned: '2025-01-01T10:00:00Z', image_uri: 'uri://1' });
    mockedReceiptService.getByUserId.mockResolvedValueOnce([receipt1] as any);

    const { result, unmount } = renderHook(() => useReceipts('user-123'));

    // Wait until loading completes
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Verify initial fetch and normalized data shape
    expect(mockedReceiptService.getByUserId).toHaveBeenCalledWith('user-123');
    expect(result.current.receipts).toEqual([
      {
        id: '7',
        label: expect.any(String),
        amount: 42.5,
        date: '2025-01-01T10:00:00Z',
        time: '',
        image: 'uri://1',
      },
    ]);

    // Simulate event bus telling hook to refresh; mock next service response
    const receipt2 = createReceipt({ id: 8, total_amount: 99.99, date_scanned: '2025-01-05T12:00:00Z' });
    mockedReceiptService.getByUserId.mockResolvedValueOnce([receipt2] as any);

    await act(async () => {
      await handlers[0]?.({ userId: 'user-123' });
    });

    await waitFor(() => expect(result.current.receipts[0].id).toBe('8'));

    // Advance timers for periodic refresh and verify calls
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    expect(mockedReceiptService.getByUserId).toHaveBeenCalledTimes(3);

    // Unmount should unsubscribe from event bus
    unmount();
    expect(unsubSpy).toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  /**
   * Test: Error handling on fetch
   * - Ensures errors from the data service are captured and surfaced in hook state
   */
  it('captures fetch errors', async () => {
    mockedReceiptService.getByUserId.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useReceipts('user-321'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('boom');
  });
});
