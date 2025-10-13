import Constants from 'expo-constants';
import { cache } from './cache';

export type OHLCV = {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose?: number;
  volume?: number;
};

const API_BASE = 'https://www.alphavantage.co/query';

function getApiKey(): string {
  return (
    Constants.expoConfig?.extra?.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY ||
    process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY ||
    process.env.ALPHA_VANTAGE_KEY ||
    ''
  );
}

async function fetchJson(url: string) {
  // simple retry
  let lastErr: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`AlphaVantage HTTP error ${res.status}`);
      }
      const json = await res.json();
      if (json['Error Message']) {
        throw new Error(`AlphaVantage API Error: ${json['Error Message']}`);
      }
      if (json['Note']) {
        // rate limit or other note
        throw new Error(`AlphaVantage Note: ${json['Note']}`);
      }
      return json;
    } catch (err: any) {
      lastErr = err;
      // exponential backoff before retrying
      await new Promise(r => setTimeout(r, 250 * Math.pow(2, attempt)));
    }
  }
  throw lastErr;
}

/**
 * Parse monthly adjusted time series returned by Alpha Vantage into OHLCV[]
 */
function parseMonthlyAdjusted(json: any): OHLCV[] {
  const series = json['Monthly Adjusted Time Series'] || json['Monthly Time Series'];
  if (!series) throw new Error('Unexpected AlphaVantage monthly response');

  return Object.keys(series)
    .map(date => {
      const row = series[date];
      return {
        date,
        open: parseFloat(row['1. open']),
        high: parseFloat(row['2. high']),
        low: parseFloat(row['3. low']),
        close: parseFloat(row['4. close']),
        adjustedClose: row['5. adjusted close'] ? parseFloat(row['5. adjusted close']) : undefined,
        volume: row['6. volume'] ? parseInt(row['6. volume'], 10) : undefined,
      } as OHLCV;
    })
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

/**
 * Parse daily adjusted time series returned by Alpha Vantage into OHLCV[]
 */
function parseDailyAdjusted(json: any): OHLCV[] {
  const series = json['Time Series (Daily)'] || json['Daily Time Series'] || json['Time Series (Daily)'];
  if (!series) throw new Error('Unexpected AlphaVantage daily response');

  return Object.keys(series)
    .map(date => {
      const row = series[date];
      return {
        date,
        open: parseFloat(row['1. open']),
        high: parseFloat(row['2. high']),
        low: parseFloat(row['3. low']),
        close: parseFloat(row['4. close']),
        adjustedClose: row['5. adjusted close'] ? parseFloat(row['5. adjusted close']) : undefined,
        volume: row['6. volume'] ? parseInt(row['6. volume'], 10) : undefined,
      } as OHLCV;
    })
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

export const alphaVantageService = {
  getMonthlyAdjusted: async (symbol: string): Promise<OHLCV[]> => {
    const key = getApiKey();
    if (!key) throw new Error('Alpha Vantage API key not configured. Set ALPHA_VANTAGE_KEY in expo extra or environment.');
    const cacheKey = `av:monthly:${symbol}`;
    const cached = await cache.get<OHLCV[]>(cacheKey);
    if (cached) return cached;

    const url = `${API_BASE}?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
    const json = await fetchJson(url);
    const parsed = parseMonthlyAdjusted(json);
    // cache 24 hours
    await cache.set(cacheKey, parsed, 24 * 60 * 60 * 1000);
    return parsed;
  },

  getDailyAdjusted: async (symbol: string): Promise<OHLCV[]> => {
    const key = getApiKey();
    if (!key) throw new Error('Alpha Vantage API key not configured. Set ALPHA_VANTAGE_KEY in expo extra or environment.');
    const cacheKey = `av:daily:${symbol}`;
    const cached = await cache.get<OHLCV[]>(cacheKey);
    if (cached) return cached;

    const url = `${API_BASE}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(symbol)}&outputsize=full&apikey=${encodeURIComponent(key)}`;
    const json = await fetchJson(url);
    const parsed = parseDailyAdjusted(json);
    // cache 24 hours (daily full doesn't change much)
    await cache.set(cacheKey, parsed, 24 * 60 * 60 * 1000);
    return parsed;
  },

  getQuote: async (symbol: string): Promise<{ price: number; timestamp?: string }> => {
    const key = getApiKey();
    if (!key) throw new Error('Alpha Vantage API key not configured. Set ALPHA_VANTAGE_KEY in expo extra or environment.');
    const cacheKey = `av:quote:${symbol}`;
    const cached = await cache.get<{ price: number; timestamp?: string }>(cacheKey);
    if (cached) return cached;

    const url = `${API_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
    const json = await fetchJson(url);
    const quote = json['Global Quote'] || json['01. symbol'] ? json : null;
    if (!quote || !quote['05. price'] && !quote['price']) {
      // Some variants may return different shapes
      const firstKey = Object.keys(json).find(k => k.startsWith('Global Quote'));
      if (firstKey) {
        const q = json[firstKey];
        return { price: parseFloat(q['05. price']), timestamp: q['07. latest trading day'] };
      }
      throw new Error('Unexpected Global Quote response');
    }

    const price = quote['05. price'] ? parseFloat(quote['05. price']) : parseFloat(quote['price']);
    const timestamp = quote['07. latest trading day'] || quote['07. latest trading day'] || undefined;
    const result = { price, timestamp };
    // cache short TTL: 5 minutes
    await cache.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  },
};
