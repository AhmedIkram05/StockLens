import { stockService } from './dataService';
import { PRESET_RATES } from './stockPresets';

export async function getHistoricalCAGRFromToday(symbol: string, years: number): Promise<number | null> {
  try {
    const yearsInt = Math.max(1, Math.floor(Number(years) || 1));

    let data = null as any;
    try {
      data = await stockService.getHistoricalForTicker(symbol, yearsInt);
    } catch (e) {
      data = null;
    }

    if ((!data || data.length < 2) && yearsInt <= 1) {
      try {
        const monthly = await stockService.getHistoricalForTicker(symbol, 2);
        if (monthly && monthly.length >= 2) data = monthly;
      } catch (e) {}
    }

    if (!data || data.length < 2) return null;

    const now = new Date();
    const target = new Date(now);
    target.setFullYear(target.getFullYear() - yearsInt);

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

export function computeCAGRFromSeries(series: Array<{ date: string; adjustedClose?: number; close: number }>): number | null {
  if (!series || series.length < 2) return null;
  const first = series[0].adjustedClose ?? series[0].close;
  const last = series[series.length - 1].adjustedClose ?? series[series.length - 1].close;
  if (!first || !last || first <= 0) return null;
  const actualYears = (new Date(series[series.length - 1].date).getTime() - new Date(series[0].date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (!(actualYears > 0)) return null;
  return Math.pow(last / first, 1 / actualYears) - 1;
}

export async function projectUsingHistoricalCAGR(amount: number, symbol: string, years: number): Promise<{ rate: number; futureValue: number }> {
  const cagr = await getHistoricalCAGRFromToday(symbol, years);
  const rate = cagr ?? PRESET_RATES[symbol.toUpperCase()];
  const futureValue = amount * Math.pow(1 + rate, years);
  return { rate, futureValue };
}