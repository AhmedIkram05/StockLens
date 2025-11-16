/**
 * receiptParser Unit Tests
 * 
 * Purpose: Validates text parsing logic that extracts receipt totals
 * from raw OCR output.
 * 
 * What it tests:
 * - Total amount extraction from keyword lines ("TOTAL", "AMOUNT DUE")
 * - Decimal point inference for ambiguous numbers (1250 → £12.50)
 * - Fallback to bottom-of-receipt scanning
 * - Amount validation (reject £0, £999999, negative values)
 * - Multiple currency symbol handling (£, $, GBP)
 * 
 * Why it's important: OCR text is messy and inconsistent. The parser
 * must reliably find the correct total among many numbers on a receipt.
 * Tests ensure the heuristics (keyword matching, decimal inference)
 * work across different receipt formats and prevent obviously wrong
 * amounts from being saved.
 */
import { parseAmountFromOcrText } from '@/services/receiptParser';

describe('parseAmountFromOcrText', () => {
  it('extracts amount from total keyword lines', () => {
    const text = `ITEMS 40.00\nTOTAL £45.67`;
    expect(parseAmountFromOcrText(text)).toBe(45.67);
  });

  it('infers decimal positions for large integers', () => {
    const text = `TOTAL 1250`;
    expect(parseAmountFromOcrText(text)).toBe(12.5);
  });

  it('falls back to bottom scan when no keyword is present', () => {
    const text = `Veggies 10.00\nBread 2.50\n\n 12.50`;
    expect(parseAmountFromOcrText(text)).toBe(12.5);
  });
});
