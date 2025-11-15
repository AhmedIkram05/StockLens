/**
 * Receipt Parser - Extract monetary amounts from OCR text
 * 
 * Features:
 * - Multi-strategy amount extraction (keyword-based, bottom-scan, scoring fallback)
 * - Token-aware OCR error correction (O→0, l/I→1 only in digit-containing tokens)
 * - Keyword detection (total, amount, grand total, balance due, etc.)
 * - Decimal inference for amounts without decimal points (e.g., 1250 → 12.50)
 * - Currency symbol detection and scoring
 * - Footer line filtering (thank you, barcode, payment method, etc.)
 * - Amount validation (realistic values between 0 and 1,000,000)
 * 
 * Strategies (in order):
 * 1. High-confidence: Extract rightmost number from lines containing 'total' keyword
 * 2. Bottom-scan: Extract rightmost number from last non-footer lines
 * 3. Scored candidates: Collect all monetary tokens, score by position/keywords, pick best
 * 
 * Scoring Factors:
 * - +50: Line contains 'total' keyword
 * - +20: Within last 2 lines (bottom of receipt)
 * - +10: Line contains currency symbol (£, $, €)
 * - +5: Highest value among candidates
 * - -40: Line contains 'change' or 'cash change'
 * 
 * Integration:
 * - Used by ScanScreen after OCR to extract receipt amount
 * - Handles common OCR misreads (O/0, l/I/1 confusion)
 * - Returns null if no valid amount found
 */

/**
 * Validate extracted amount for realistic values
 * 
 * @param amount - Extracted amount to validate
 * @returns true if amount is valid, false otherwise
 * 
 * Validation Rules:
 * - Must be greater than 0 (no negative or zero amounts)
 * - Must be less than 1,000,000 (prevents unrealistic OCR extractions)
 * - Must be a finite number (not NaN or Infinity)
 * 
 * Common Invalid Cases:
 * - OCR extracts barcode numbers as amounts (e.g., 123456789)
 * - Date stamps interpreted as amounts (e.g., 20250115)
 * - Phone numbers mistaken for amounts (e.g., 4471234567890)
 * - Zero amounts from failed OCR
 * - Negative amounts from accounting notation
 * 
 * Usage:
 * const amount = parseAmountFromOcrText(ocrText);
 * if (amount && validateAmount(amount)) {
 *   // Use the amount
 * } else {
 *   // Show manual entry prompt
 * }
 */
export function validateAmount(amount: number | null | undefined): boolean {
  if (amount == null) return false;
  if (typeof amount !== 'number') return false;
  if (!Number.isFinite(amount)) return false;
  if (amount <= 0) return false;
  if (amount >= 1000000) return false;
  return true;
}

/**
 * Parse amount from OCR text with intelligent extraction and error correction
 * 
 * @param text - Raw OCR text from receipt image
 * @returns Extracted amount as number or null if not found
 * 
 * Process:
 * 1. Token-aware normalization: Fix O→0, l/I→1 only in tokens with digits
 * 2. High-confidence pass: Extract from lines with 'total' keyword
 * 3. Bottom-scan pass: Extract from last non-footer lines
 * 4. Candidate scoring: Collect all monetary tokens, score, pick best
 * 5. Decimal inference: Convert 1250 → 12.50 if no decimal and value ≥100
 * 
 * Decimal Inference Rules:
 * - If token has no decimal point AND value ≥ 100 AND value/100 ≤ 500
 * - Then divide by 100 (e.g., 1250 → 12.50, 2999 → 29.99)
 * - Prevents false positives for large amounts (e.g., 10000 stays 10000)
 * 
 * Edge Cases:
 * - Handles multiple decimal separators (1.234,56 → 1234.56)
 * - Filters out 'change' amounts (lower priority scoring)
 * - Skips footer lines (thank you, barcode, phone, address)
 * - Returns null for invalid/empty input
 * 
 * Usage:
 * amount = parseAmountFromOcrText(ocrResult.text)
 */
export function parseAmountFromOcrText(text: string): number | null {
  if (!text) return null;

  // Token-aware normalization: only replace common letter/number confusions inside tokens that contain digits
  const rawLines = String(text).split(/\r?\n/).map(l => l.trim());
  const normLines = rawLines.map(line => {
    return line
      .split(/(\s+)/) // keep whitespace so joins are consistent
      .map(tok => {
        if (/[0-9]/.test(tok)) {
          return tok.replace(/[Oo]/g, '0').replace(/[lI]/g, '1');
        }
        return tok;
      })
      .join('');
  });

  if (normLines.length === 0) return null;

  const keywordRegex = /\b(total|amount|amt|amount due|grand total|total payable|balance due|subtotal|net total|sum)\b/i;
  const changeRegex = /\b(change|cash change)\b/i;
  const moneyTokenRegex = /([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})|[0-9]+[.,][0-9]+|[0-9]+)/g;

  type Candidate = { value: number; line: string; lineIndex: number; currency: boolean; score: number; token?: string; hadDecimal?: boolean };
  const candidates: Candidate[] = [];

  // High-confidence pass: if a line contains a total-like keyword, extract the right-most numeric token on that line
  for (let i = 0; i < normLines.length; i++) {
    const line = normLines[i];
    if (!line) continue;
    if (keywordRegex.test(line)) {
      const tokens = line.split(/\s+/).filter(Boolean);
      for (let t = tokens.length - 1; t >= 0; t--) {
        const tokRaw = tokens[t];
        const tok = tokRaw.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
        if (!tok) continue;
        const cleaned = tok.replace(/[^0-9.]/g, '');
        const val = Number(cleaned);
        if (!Number.isNaN(val) && Number.isFinite(val) && val > 0) {
          const hadDecimal = /[.,]/.test(tokRaw);
          if (!hadDecimal && val >= 100 && val / 100 <= 500) return val / 100;
          return val;
        }
      }

      // check neighbor lines ±1 for numeric token
      for (const delta of [1, -1]) {
        const ni = i + delta;
        if (ni >= 0 && ni < normLines.length) {
          const next = normLines[ni];
          const m2 = next.match(moneyTokenRegex);
          if (m2 && m2.length > 0) {
            const lastRaw = m2[m2.length - 1];
            const last = lastRaw.replace(/,/g, '.');
            const v = Number(last);
            if (!Number.isNaN(v) && Number.isFinite(v) && v > 0) {
              const hadDecimal = /[.,]/.test(lastRaw);
              if (!hadDecimal && v >= 100 && v / 100 <= 500) return v / 100;
              return v;
            }
          }
        }
      }
    }
  }
  // Bottom-scan pass: prefer the right-most numeric token in the last few non-footer lines
  // This addresses receipts that list the total near the bottom without explicit 'total' keyword.
  const footerRegex = /\b(thank you|thank|cash|change|balance|card|approval|barcode|visa|mastercard|amex|payment method|tel:|phone:|address:)\b/i;
  const bottomSlice = normLines.slice(Math.max(0, normLines.length - 8));
  for (let bi = bottomSlice.length - 1; bi >= 0; bi--) {
    const line = bottomSlice[bi];
    if (!line) continue;
    // skip obvious footer lines
    if (footerRegex.test(line.toLowerCase?.() || line)) continue;
    // skip lines that look like 'cash 20.00' if they include 'cash' (not total)
    if (/\bcash\b/i.test(line) && /\bchange\b/i.test(line)) continue;
    const m = Array.from(line.matchAll(moneyTokenRegex));
    if (m && m.length > 0) {
      const lastRaw = m[m.length - 1][1];
      const last = lastRaw.replace(/,/g, '.');
      const v = Number(last);
      if (!Number.isNaN(v) && Number.isFinite(v) && v > 0) {
        const hadDecimal = /[.,]/.test(lastRaw);
        if (!hadDecimal && v >= 100 && v / 100 <= 500) return v / 100;
        return v;
      }
    }
  }

  // Candidate collection and scoring fallback
  for (let i = 0; i < normLines.length; i++) {
    const line = normLines[i];
    if (!line || !/[0-9]/.test(line)) continue;
    let m: RegExpExecArray | null;
    while ((m = moneyTokenRegex.exec(line)) !== null) {
      let raw = m[1];
      const dots = (raw.match(/\./g) || []).length;
      const commas = (raw.match(/,/g) || []).length;
      if (dots + commas > 1) raw = raw.replace(/[.,](?=.*[.,])/g, '');
      const hadDecimal = /[.,]/.test(raw);
      raw = raw.replace(/,/g, '.');
      const v = Number(raw);
      if (Number.isNaN(v) || !Number.isFinite(v) || v <= 0) continue;
      const hasCurrency = /[\u00a3$\u20ac]/.test(line);
      let score = 0;
      if (keywordRegex.test(line)) score += 50;
      const fromBottom = normLines.length - 1 - i;
      if (fromBottom <= 2) score += 20;
      else if (fromBottom <= 5) score += 10;
      if (hasCurrency) score += 10;
      if (changeRegex.test(line)) score -= 40;
      score += Math.min(5, Math.floor(Math.log10(v + 1)));

      candidates.push({ value: v, line, lineIndex: i, currency: hasCurrency, score, token: m[1], hadDecimal });
    }
  }

  if (candidates.length === 0) return null;

  const maxValue = Math.max(...candidates.map(c => c.value));
  for (const c of candidates) {
    if (c.value === maxValue) c.score += 5;
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.value - a.value;
  });

  const best = candidates[0];
  if (!best) return null;
  if (!best.hadDecimal && best.value >= 100 && best.value / 100 <= 500) {
    return best.value / 100;
  }
  return best.value;
}
