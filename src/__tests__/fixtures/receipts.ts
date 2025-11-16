/**
 * Receipt Test Fixtures
 * 
 * Purpose: Factory functions for generating consistent receipt test data
 * across all test files.
 * 
 * What it provides:
 * - createReceipt(): Factory function with partial overrides pattern
 * - buildReceiptList(): Generate multiple receipts with custom logic
 * - sampleReceipts: Pre-built array of 5 receipts with varied data
 * - Auto-incrementing ID sequence for unique receipts
 * 
 * Why it's important: Eliminates inline mock data duplication across
 * tests. Changes to Receipt type are centralized here. Tests become
 * more readable and maintainable with consistent factory-generated data.
 * 
 * Usage:
 * createReceipt({ total_amount: 50 }) → Full receipt with £50 total
 * buildReceiptList(3) → Array of 3 receipts with sequential data
 */

import { Receipt } from '@/services/dataService';

let receiptCounter = 1;

export const createReceipt = (overrides: Partial<Receipt> = {}): Receipt => {
  const base: Receipt = {
    id: overrides.id ?? receiptCounter++,
    user_id: overrides.user_id ?? 'test-user-uid',
    image_uri: overrides.image_uri ?? 'file:///receipt.jpg',
    total_amount: overrides.total_amount ?? 42.5,
    date_scanned: overrides.date_scanned ?? new Date().toISOString(),
    ocr_data: overrides.ocr_data ?? 'Total: $42.50',
    synced: overrides.synced ?? 1,
  };

  return { ...base, ...overrides };
};

export const buildReceiptList = (
  count = 3,
  overrides?: (index: number) => Partial<Receipt>
): Receipt[] => Array.from({ length: count }, (_unused, index) => createReceipt(overrides?.(index)));

export const sampleReceipts: Receipt[] = buildReceiptList(5, index => ({
  total_amount: 25 + index * 7,
  date_scanned: new Date(Date.now() - index * 86400000).toISOString(),
}));
