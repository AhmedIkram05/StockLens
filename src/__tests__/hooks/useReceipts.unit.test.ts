import { act, renderHook, waitFor } from '@testing-library/react-native';
import useReceipts from '@/hooks/useReceipts';
import { receiptService } from '@/services/dataService';
import { subscribe } from '@/services/eventBus';

type ReceiptsChangedHandler = (payload?: { userId?: string }) => void;

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
    jest.clearAllMocks();
  });

  it('fetches receipts for the user, refreshes on events, and cleans up on unmount', async () => {
    jest.useFakeTimers();
    const unsubSpy = jest.fn();
    const handlers: ReceiptsChangedHandler[] = [];
    mockedSubscribe.mockImplementation((_event, handler) => {
      handlers.push(handler);
      return unsubSpy;
    });

    mockedReceiptService.getByUserId.mockResolvedValueOnce([
      { id: 7, total_amount: 42.5, date_scanned: '2025-01-01T10:00:00Z', image_uri: 'uri://1' },
    ] as any);

    const { result, unmount } = renderHook(() => useReceipts('user-123'));

    await waitFor(() => expect(result.current.loading).toBe(false));

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

    mockedReceiptService.getByUserId.mockResolvedValueOnce([
      { id: 8, total_amount: 99.99, date_scanned: '2025-01-05T12:00:00Z' },
    ] as any);

    await act(async () => {
      await handlers[0]?.({ userId: 'user-123' });
    });

    await waitFor(() => expect(result.current.receipts[0].id).toBe('8'));

    act(() => {
      jest.advanceTimersByTime(30000);
    });
    expect(mockedReceiptService.getByUserId).toHaveBeenCalledTimes(3);

    unmount();
    expect(unsubSpy).toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('captures fetch errors', async () => {
    mockedReceiptService.getByUserId.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useReceipts('user-321'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('boom');
  });
});
