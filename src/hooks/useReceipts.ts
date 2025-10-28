import { useEffect, useRef, useState, useCallback } from 'react';
import { receiptService } from '../services/dataService';
import { subscribe } from '../services/eventBus';
import { formatRelativeDate } from '../utils/formatters';

export type ReceiptShape = {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  time?: string;
  image?: string;
};

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
        merchant: r.merchant || formatRelativeDate(r.date_scanned) || 'Receipt',
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
