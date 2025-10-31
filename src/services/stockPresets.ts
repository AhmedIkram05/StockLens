import { PREFETCH_TICKERS } from './dataService';

// Preset fallback annual rates for when historical data is unavailable
export const PRESET_RATES: Record<string, number> = {
  NVDA: 0.26,
  AAPL: 0.11,
  MSFT: 0.18,
  TSLA: 0.25,
  NKE: 0.08,
  AMZN: 0.17,
  GOOGL: 0.16,
  META: 0.20,
  JPM: 0.10,
  UNH: 0.12,
};

// Human-friendly display names for common tickers used in the app.
const NAME_MAP: Record<string, string> = {
  NVDA: 'NVIDIA',
  AAPL: 'Apple',
  MSFT: 'Microsoft',
  TSLA: 'Tesla',
  NKE: 'Nike',
  AMZN: 'Amazon',
  GOOGL: 'Alphabet',
  META: 'Meta',
  JPM: 'JPMorgan Chase',
  UNH: 'UnitedHealth',
};

export type StockPreset = { name: string; ticker: string; returnRate: number };

// Build the canonical presets list by combining the prefetch tickers and
// the preset rates. This keeps the source of truth in one place and avoids
// duplication across screens.
export const STOCK_PRESETS: StockPreset[] = PREFETCH_TICKERS.map(ticker => ({
  name: NAME_MAP[ticker] ?? ticker,
  ticker,
  returnRate: PRESET_RATES[ticker], 
}));

export default STOCK_PRESETS;
