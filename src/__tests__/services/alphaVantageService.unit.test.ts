/**
 * alphaVantageService Unit Tests
 *
 * Purpose: Validate stock data retrieval, caching, and parsing logic from
 * the Alpha Vantage API. Tests ensure cache usage, API fetching, and
 * conversion to internal OHLCV structures.
 */

import { alphaVantageService, OHLCV } from '@/services/alphaVantageService';
import Constants from 'expo-constants';
import { databaseService } from '@/services/database';

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY: 'test-api-key',
    },
  },
}));

jest.mock('@/services/database', () => ({
  databaseService: {
    executeQuery: jest.fn(),
    executeNonQuery: jest.fn(),
  },
}));

jest.mock('@/services/eventBus', () => ({
  emit: jest.fn(),
}));

global.fetch = jest.fn();

const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>;
const mockedDb = databaseService as jest.Mocked<typeof databaseService>;

describe('alphaVantageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDb.executeQuery.mockResolvedValue([]);
  });

  describe('getMonthlyAdjusted', () => {
    it('fetches monthly data from API when cache miss', async () => {
      const mockApiResponse = {
        'Monthly Adjusted Time Series': {
          '2024-01-01': {
            '1. open': '100',
            '2. high': '105',
            '3. low': '99',
            '4. close': '104',
            '5. adjusted close': '104',
            '6. volume': '1000000',
          },
        },
      };

      mockedFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const result = await alphaVantageService.getMonthlyAdjusted('AAPL');

      expect(mockedFetch).toHaveBeenCalled();
      expect(result).toEqual([
        {
          date: '2024-01-01',
          open: 100,
          high: 105,
          low: 99,
          close: 104,
          adjustedClose: 104,
          volume: 1000000,
        },
      ]);
    });

    it('returns cached data when available and fresh', async () => {
      const cachedData = [
        { date: '2024-01-01', open: 100, high: 105, low: 99, close: 104, adjustedClose: 104, volume: 1000000 },
      ];

      mockedDb.executeQuery.mockResolvedValue([
        {
          data: JSON.stringify(cachedData),
          expires_at: Date.now() + 100000,
        },
      ]);

      const result = await alphaVantageService.getMonthlyAdjusted('AAPL');

      expect(mockedFetch).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
    });

    it('handles API errors gracefully', async () => {
      mockedFetch.mockRejectedValue(new Error('Network failure'));

      await expect(alphaVantageService.getMonthlyAdjusted('INVALID')).rejects.toThrow();
    });
  });

  describe('cache management', () => {
    it('caches fetched data to database', async () => {
      const mockApiResponse = {
        'Monthly Adjusted Time Series': {
          '2024-01-01': { '1. open': '100', '2. high': '105', '3. low': '99', '4. close': '104', '5. adjusted close': '104', '6. volume': '1000000' },
        },
      };

      mockedFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      await alphaVantageService.getMonthlyAdjusted('NVDA');

      expect(mockedDb.executeNonQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE'),
        expect.arrayContaining(['NVDA', 'monthly'])
      );
    });
  });
});
