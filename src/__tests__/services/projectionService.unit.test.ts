/**
 * projectionService Unit Tests
 * 
 * Purpose: Validates financial projection calculations that show users
 * what their spending could have become if invested in stocks.
 * 
 * What it tests:
 * - CAGR (Compound Annual Growth Rate) calculations from price series
 * - Historical stock data fetching and processing
 * - Fallback to preset rates when data is unavailable
 * - Future value projections using compound interest formula
 * - Edge cases (empty series, single data point)
 * 
 * Why it's important: These projections are the core value proposition
 * of the app. Accuracy is critical - users need to trust the numbers.
 * Tests ensure the compound interest math is correct and that the app
 * gracefully handles missing stock data.
 */

jest.mock('@/services/dataService', () => ({
  stockService: {
    getHistoricalForTicker: jest.fn(),
  },
  PREFETCH_TICKERS: [],
}));

import { stockService } from '@/services/dataService';
import * as projectionService from '@/services/projectionService';
import { PRESET_RATES } from '@/services/stockPresets';
import { buildOHLCVSeries } from '../fixtures';

const mockedStockService = stockService as jest.Mocked<typeof stockService>;

describe('projectionService.computeCAGRFromSeries', () => {
  it('calculates CAGR using first and last entries in the series', () => {
    const series = [
      { date: '2020-01-01', close: 100 },
      { date: '2021-01-01', close: 121 },
    ];

    const cagr = projectionService.computeCAGRFromSeries(series);

    expect(cagr).not.toBeNull();
    expect(cagr!).toBeCloseTo(0.21, 2); // (121/100)^(1/1) - 1 = 0.21
  });

  it('returns null when the series is shorter than two points or invalid', () => {
    expect(projectionService.computeCAGRFromSeries([])).toBeNull();
    expect(projectionService.computeCAGRFromSeries([{ date: '2020-01-01', close: 0 }])).toBeNull();
  });
});

describe('projectionService.projectUsingHistoricalCAGR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses fetched CAGR when stock history is available', async () => {
    // Use fixture to generate 60 months of data with 12% growth (1% per month)
    const historicalSeries = buildOHLCVSeries(60, 0.01, 100);
    
    mockedStockService.getHistoricalForTicker.mockResolvedValue(historicalSeries.map(ohlcv => ({
      date: ohlcv.date,
      adjustedClose: ohlcv.adjustedClose,
      close: ohlcv.close,
    })) as any);

    const result = await projectionService.projectUsingHistoricalCAGR(1000, 'NVDA', 5);

    // The fixture uses 1% monthly growth which compounds to ~12.7% annual CAGR
    expect(result.rate).toBeCloseTo(0.127, 2);
    expect(result.futureValue).toBeCloseTo(1000 * Math.pow(1 + result.rate, 5), 5);
  });

  it('falls back to preset rates when historical data is insufficient', async () => {
    mockedStockService.getHistoricalForTicker.mockResolvedValue([
      { date: '2024-01-01', adjustedClose: 150, close: 150 },
    ] as any);

    const result = await projectionService.projectUsingHistoricalCAGR(500, 'aapl', 3);

    const presetRate = PRESET_RATES.AAPL;
    expect(result.rate).toBe(presetRate);
    expect(result.futureValue).toBeCloseTo(500 * Math.pow(1 + presetRate, 3), 5);
  });
});
