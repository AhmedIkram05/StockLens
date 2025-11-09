/**
 * Stock Presets - Predefined stock tickers with fallback return rates
 * 
 * Features:
 * - PRESET_RATES: Fallback annual return rates when API data unavailable
 * - STOCK_PRESETS: User-friendly list with name, ticker, and return rate
 * - NAME_MAP: Human-readable names for tickers (NVDA → NVIDIA)
 * 
 * Preset Stocks:
 * - NVDA (NVIDIA): 26% annual return
 * - AAPL (Apple): 11%
 * - MSFT (Microsoft): 18%
 * - TSLA (Tesla): 25%
 * - NKE (Nike): 8%
 * - AMZN (Amazon): 17%
 * - GOOGL (Alphabet): 16%
 * - META (Meta): 20%
 * - JPM (JPMorgan Chase): 10%
 * - UNH (UnitedHealth): 12%
 * 
 * Integration:
 * - Used by projectionService as fallback when historical data unavailable
 * - PREFETCH_TICKERS (from dataService) drives the preset list
 * - Displayed in StockCard and ReceiptDetailsScreen
 * 
 * Note:
 * Preset rates are approximate historical averages (not investment advice).
 * Real projections use actual historical CAGR when API data is available.
 */

import { PREFETCH_TICKERS } from './dataService';

/**
 * PRESET_RATES - Fallback annual return rates for common stocks
 * 
 * Map of ticker symbol → annual return rate (as decimal, e.g., 0.26 = 26%)
 * Used when Alpha Vantage API is unavailable or rate-limited
 */
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

/**
 * NAME_MAP - Human-friendly display names for stock tickers
 * 
 * Map of ticker symbol → company name for UI display
 */
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

/**
 * StockPreset type - Preset stock option for UI display
 * 
 * @property name - Company name (e.g., 'NVIDIA')
 * @property ticker - Stock symbol (e.g., 'NVDA')
 * @property returnRate - Annual return rate as decimal (e.g., 0.26)
 */
export type StockPreset = { name: string; ticker: string; returnRate: number };

/**
 * STOCK_PRESETS - Canonical list of preset stock options
 * 
 * Built by combining PREFETCH_TICKERS with NAME_MAP and PRESET_RATES
 * 
 * Usage:
 * - Displayed in stock selection UI (ReceiptDetailsScreen)
 * - Provides quick preset options for users
 * - Ensures consistency between prefetch and presets
 */
export const STOCK_PRESETS: StockPreset[] = PREFETCH_TICKERS.map(ticker => ({
  name: NAME_MAP[ticker] ?? ticker,
  ticker,
  returnRate: PRESET_RATES[ticker], 
}));

export default STOCK_PRESETS;
