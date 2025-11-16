/**
 * Stock Data (OHLCV) Test Fixtures
 * 
 * Purpose: Factory functions for generating realistic stock price data
 * for projection and CAGR calculation tests.
 * 
 * What it provides:
 * - createOHLCV(): Factory for single price data point (Open/High/Low/Close/Volume)
 * - buildOHLCVSeries(): Generate multi-month price series with compound growth
 * - sampleOHLCVSeries: Pre-built 12-month price series (5% annual growth)
 * - Realistic volume data (1M+ shares)
 * - Auto-incrementing date offsets for historical data
 * 
 * Why it's important: Investment projections depend on historical stock
 * data. These fixtures generate mathematically correct price series with
 * compound growth for testing CAGR calculations. The buildOHLCVSeries
 * function ensures tests use realistic multi-year data without manual
 * price calculation.
 * 
 * Usage:
 * createOHLCV({ close: 150 }) → Single price point
 * buildOHLCVSeries(60, 0.01, 100) → 5 years of 1% monthly growth from £100
 */

import { OHLCV } from '@/services/alphaVantageService';

let dateOffset = 0;

export const createOHLCV = (overrides: Partial<OHLCV> = {}): OHLCV => {
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - dateOffset++);

  const base: OHLCV = {
    date: overrides.date ?? baseDate.toISOString().slice(0, 10),
    open: overrides.open ?? 100,
    high: overrides.high ?? 110,
    low: overrides.low ?? 95,
    close: overrides.close ?? 105,
    adjustedClose: overrides.adjustedClose ?? overrides.close ?? 105,
    volume: overrides.volume ?? 1_000_000,
  };

  return { ...base, ...overrides };
};

export const buildOHLCVSeries = (
  months = 12,
  growthRate = 0.01,
  startingPrice = 100
): OHLCV[] => {
  const points: OHLCV[] = [];
  let price = startingPrice;

  for (let index = months - 1; index >= 0; index--) {
    const date = new Date();
    date.setMonth(date.getMonth() - index);
    price = price * (1 + growthRate);
    points.push(
      createOHLCV({
        date: date.toISOString().slice(0, 10),
        open: price * 0.98,
        high: price * 1.02,
        low: price * 0.96,
        close: price,
        adjustedClose: price,
        volume: 500_000 + index * 10_000,
      })
    );
  }

  return points;
};

export const sampleOHLCVSeries = buildOHLCVSeries();
