/**
 * useReceipts Hook
 * 
 * Fetches and manages receipt data for a specific user from Firestore.
 * Provides automatic refresh on data changes via event bus subscription.
 * 
 * Features:
 * - Initial data load on mount
 * - Real-time updates via 'receipts-changed' event
 * - Auto-refresh every 30 seconds (silent, no loading spinner)
 * - Proper cleanup on unmount
 * - Loading and error state management
 * 
 * Data transformation:
 * - Converts Firestore receipt documents to simplified ReceiptShape format
 * - Formats scan dates for display
 * - Ensures image URIs are properly typed
 * 
 * @param userId - Firebase user ID to fetch receipts for. If undefined, returns empty array.
 * @returns Object with receipts array, loading boolean, and error string (null if no error)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { receiptService } from '../services/dataService';
import { subscribe } from '../services/eventBus';
import { formatRelativeDate } from '../utils/formatters';

export type ReceiptShape = {
  /** Unique receipt identifier (string representation of Firestore document ID) */
  id: string;
  /** Formatted label for display (relative date like "2 days ago" or "Yesterday") */
  label: string;
  /** Total purchase amount in currency */
  amount: number;
  /** ISO date string of when receipt was scanned */
  date: string;
  /** Time string (e.g., "14:30") for display purposes */
  time: string;
  /** URI to receipt image in Firebase Storage */
  image: string;
};

/**
 * Fetches receipts for the given user ID and subscribes to changes.
 * Automatically refreshes when 'receipts-changed' event is emitted.
 * Polls every 30 seconds for freshness while mounted.
 */
export default function useReceipts(userId?: string) {
  const [receipts, setReceipts] = useState<ReceiptShape[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    setError(null);
    try {
      if (!userId) {
        setReceipts([]);
        return;
      }
      const data = await receiptService.getByUserId(userId);
      if (!mountedRef.current) return;
      const mapped = data.map((r: any) => ({
        id: String(r.id),
        label: formatRelativeDate(r.date_scanned) || 'Receipt',
        amount: r.total_amount || 0,
        date: r.date_scanned || '',
        time: '',
        image: r.image_uri || undefined,
      }));
      setReceipts(mapped);
    } catch (err: any) {
      if (mountedRef.current) setError(err?.message || String(err));
    } finally {
      if (mountedRef.current && !opts.silent) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    fetch().catch(() => {});

    const unsub = subscribe('receipts-changed', async (payload) => {
      if (payload?.userId && payload.userId !== userId) return;
      await fetch({ silent: true });
    });

    // Poll while mounted (keeps UI reasonably fresh); consumer can still control refresh
    const id = setInterval(() => fetch({ silent: true }).catch(() => {}), 30000);

    return () => {
      mountedRef.current = false;
      try { unsub(); } catch (e) {}
      clearInterval(id);
    };
  }, [fetch, userId]);

  return { receipts, loading, error } as const;
}
