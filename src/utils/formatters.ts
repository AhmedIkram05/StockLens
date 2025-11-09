/**
 * Formatters Utility - Currency and date formatting helpers
 * 
 * Features:
 * - formatCurrencyGBP: Format numbers as British pounds (£12.50)
 * - formatRelativeDate: Convert ISO dates to relative time (2m ago, Yesterday, etc.)
 * - formatCurrencyRounded: Format currency with exact 2 decimal places
 * 
 * Integration:
 * - Used by ReceiptCard, StatCard, StockCard for currency display
 * - Used by ReceiptCard for relative timestamps
 * - Uses Intl.NumberFormat for locale-aware formatting
 * - Fallback to manual formatting if Intl API unavailable
 */

/**
 * Format number as British pounds (GBP)
 * 
 * @param amount - Numeric value to format
 * @returns Formatted string (e.g., "£12.50")
 * 
 * Features:
 * - Uses Intl.NumberFormat with en-GB locale
 * - Minimum 2 decimal places
 * - Fallback to manual £X.XX formatting if Intl API fails
 * - Handles null/undefined (defaults to 0)
 * 
 * Usage:
 * formatCurrencyGBP(12.5) → "£12.50"
 * formatCurrencyGBP(1234.56) → "£1,234.56"
 */
export function formatCurrencyGBP(amount: number) {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  } catch (e) {
    return `£${(amount || 0).toFixed(2)}`;
  }
}

/**
 * Format ISO date as relative time string
 * 
 * @param isoDate - ISO 8601 date string (e.g., "2024-01-15T10:30:00Z")
 * @returns Relative time string
 * 
 * Time Ranges:
 * - < 1 minute: "Xs ago" (e.g., "45s ago")
 * - < 1 hour: "Xm ago" (e.g., "15m ago")
 * - < 24 hours: "Xh ago" (e.g., "3h ago")
 * - 1 day: "Yesterday"
 * - 2-7 days: "X days ago" (e.g., "5 days ago")
 * - > 7 days: "15 Jan 2024" (locale date format)
 * 
 * Features:
 * - Handles invalid/missing dates (returns "Receipt")
 * - Uses locale-aware date formatting for old dates
 * - Always shows relative time for recent items
 * 
 * Usage:
 * formatRelativeDate("2024-01-15T10:30:00Z") → "3h ago" or "15 Jan 2024"
 */
export function formatRelativeDate(isoDate?: string) {
  if (!isoDate) return 'Receipt';
  try {
    const d = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;

    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return 'Receipt';
  }
}

/**
 * Format number as currency with exactly 2 decimal places
 * 
 * @param amount - Numeric value to format
 * @returns Formatted string (e.g., "£12.50")
 * 
 * Features:
 * - Identical to formatCurrencyGBP but explicitly sets min/max decimals to 2
 * - Ensures consistent decimal places (12 → "£12.00", not "£12")
 * - Fallback to manual £X.XX formatting if Intl API fails
 * 
 * Usage:
 * formatCurrencyRounded(12) → "£12.00"
 * formatCurrencyRounded(1234.567) → "£1,234.57" (rounded)
 */
export function formatCurrencyRounded(amount: number) {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch (e) {
    return `£${(amount || 0).toFixed(2)}`;
  }
}
