jest.mock('@/services/dataService', () => ({
  stockService: {
    getHistoricalForTicker: jest.fn(),
  },
  PREFETCH_TICKERS: [],
}));

import { stockService } from '@/services/dataService';
import * as projectionService from '@/services/projectionService';
import { PRESET_RATES } from '@/services/stockPresets';

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
    mockedStockService.getHistoricalForTicker.mockResolvedValue([
      { date: '2019-01-01', adjustedClose: 100, close: 100 },
      { date: '2024-01-01', adjustedClose: 100 * Math.pow(1.12, 5), close: 100 * Math.pow(1.12, 5) },
    ] as any);

    const result = await projectionService.projectUsingHistoricalCAGR(1000, 'NVDA', 5);

    expect(result.rate).toBeCloseTo(0.12, 3);
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
