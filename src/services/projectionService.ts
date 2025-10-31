import { stockService } from './dataService';
import { PRESET_RATES } from './stockPresets';

/**
 * Returns the annualized CAGR computed from the price at (today - years) up to the most recent price.
 * Uses adjustedClose when available. Returns null if insufficient data.
 */
export async function getHistoricalCAGRFromToday(symbol: string, years: number): Promise<number | null> {
  try {
    const yearsInt = Math.max(1, Math.floor(Number(years) || 1));

    // Request enough history for the requested years. stockService will select daily for <=1y and monthly otherwise.
    let data = null as any;
    try {
      data = await stockService.getHistoricalForTicker(symbol, yearsInt);
    } catch (e) {
      data = null;
    }

    // If daily data for 1-year is missing or insufficient (API key missing, rate limited,
    // or cached data absent) attempt a monthly fallback so we can still estimate a 1-year CAGR.
    if ((!data || data.length < 2) && yearsInt <= 1) {
      try {
        // asking for 2 years will force stockService to return monthly series which gives
        // enough points to compute a 1-year CAGR even when daily is unavailable.
        const monthly = await stockService.getHistoricalForTicker(symbol, 2);
        if (monthly && monthly.length >= 2) data = monthly;
      } catch (e) {
        // ignore and fall through to returning null
      }
    }

    if (!data || data.length < 2) return null;

    const now = new Date();
    const target = new Date(now);
    target.setFullYear(target.getFullYear() - yearsInt);

    // Find the entry with date <= target that is closest to the target (latest before or on target)
    let startEntry = data[0];
    for (let i = 0; i < data.length; i++) {
      const d = new Date(data[i].date);
      if (d <= target) startEntry = data[i];
      else break;
    }

    const endEntry = data[data.length - 1];
    const firstVal = (startEntry as any).adjustedClose ?? (startEntry as any).close;
    const lastVal = (endEntry as any).adjustedClose ?? (endEntry as any).close;
    if (!firstVal || !lastVal || firstVal <= 0) return null;

    const actualYears = (new Date(endEntry.date).getTime() - new Date(startEntry.date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (!(actualYears > 0)) return null;

    return Math.pow(lastVal / firstVal, 1 / actualYears) - 1;
  } catch (e) {
    return null;
  }
}

/**
 * Compute CAGR directly from an OHLCV series (assumes series sorted oldest->newest).
 * Returns annualized rate (e.g., 0.12 for +12%) or null when invalid.
 */
export function computeCAGRFromSeries(series: Array<{ date: string; adjustedClose?: number; close: number }>): number | null {
  if (!series || series.length < 2) return null;
  const first = series[0].adjustedClose ?? series[0].close;
  const last = series[series.length - 1].adjustedClose ?? series[series.length - 1].close;
  if (!first || !last || first <= 0) return null;
  const actualYears = (new Date(series[series.length - 1].date).getTime() - new Date(series[0].date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (!(actualYears > 0)) return null;
  return Math.pow(last / first, 1 / actualYears) - 1;
}

/**
 * Project an amount forward `years` using the historical CAGR (calculated from today - years to today).
 * If historical CAGR is unavailable, falls back to a preset rate, then to a conservative default.
 */
export async function projectUsingHistoricalCAGR(amount: number, symbol: string, years: number): Promise<{ rate: number; futureValue: number }> {
  const cagr = await getHistoricalCAGRFromToday(symbol, years);
  const rate = cagr ?? PRESET_RATES[symbol.toUpperCase()];
  const futureValue = amount * Math.pow(1 + rate, years);
  return { rate, futureValue };
}