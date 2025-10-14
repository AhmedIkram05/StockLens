/**
 * Simple receipt parser heuristics
 * - Extracts monetary values using regex
 * - Returns the largest found value (assumes total is largest monetary amount on receipt)
 */

export function parseAmountFromOcrText(text: string): number | null {
  if (!text) return null;

  // Normalize common separators and currency symbols
  const cleaned = text.replace(/,/g, '.').replace(/\s+/g, ' ');

  // Regex to find monetary patterns like 12.34, $12.34, 12.34 GBP, 12, or .99
  // Accepts formats with optional grouping separators and leading-dot decimals (e.g. .99)
  const moneyRegex = /\b(?:[$£€]?\s?)([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?|[.,][0-9]{1,2})\b/g;

  const matches: number[] = [];
  let m;
  while ((m = moneyRegex.exec(cleaned)) !== null) {
    let raw = m[1];
    // Replace thousand separators (e.g., 1.234,56 or 1,234.56) - naive approach
    // If there are multiple dots/commas, remove thousand separators leaving last separator as decimal
    const dots = (raw.match(/\./g) || []).length;
    const commas = (raw.match(/,/g) || []).length;

    if (dots + commas > 1) {
      // remove all separators except the last
      raw = raw.replace(/[.,](?=.*[.,])/g, '');
    }

    // Normalise comma to dot for decimal
    raw = raw.replace(/,/g, '.');

    const value = Number(raw);
    if (!Number.isNaN(value)) matches.push(value);
  }

  if (matches.length === 0) return null;

  // Heuristic: the total is commonly the largest amount on the receipt
  const largest = matches.reduce((a, b) => (a > b ? a : b), -Infinity);
  return largest;
}

// Improved parser: prefer lines with keywords like TOTAL or SALES, then fallback to largest amount
export function parseAmountPreferKeywords(text: string): number | null {
  if (!text) return null;

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const keywordRegex = /\b(total|amount due|amount|grand total|total payable|sales|sales total|balance due|amt due)\b/i;
  const currencyRegex = /[$£€]/;
  // Find all lines that contain a keyword and at least one digit
  const keywordLines = lines.filter(l => keywordRegex.test(l) && /\d/.test(l));

  // Prefer the last keyword-containing line (commonly the bottom of the receipt)
  if (keywordLines.length > 0) {
    const lastLine = keywordLines[keywordLines.length - 1];

  // Extract numeric tokens from that line and return the last numeric token found
  // Accept values like 1, 1.98, 1,234.56 and also leading-dot decimals like .99
  const moneyRegex = /(?:[$£€]?\s?)([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?|[.,][0-9]{1,2})/g;
    const values: number[] = [];
    let m;
    while ((m = moneyRegex.exec(lastLine)) !== null) {
      let raw = m[1];
      const dots = (raw.match(/\./g) || []).length;
      const commas = (raw.match(/,/g) || []).length;
      if (dots + commas > 1) {
        raw = raw.replace(/[.,](?=.*[.,])/g, '');
      }
      raw = raw.replace(/,/g, '.');
      const value = Number(raw);
      if (!Number.isNaN(value)) values.push(value);
    }

    if (values.length > 0) {
      // Return the last numeric token on that line (right-most amount)
      return values[values.length - 1];
    }

    // If the last keyword line didn't parse any numbers, try any other keyword lines (from bottom to top)
    for (let i = keywordLines.length - 2; i >= 0; i--) {
      const line = keywordLines[i];
      let mm;
      const vals: number[] = [];
      while ((mm = moneyRegex.exec(line)) !== null) {
        let raw = mm[1];
        const dots = (raw.match(/\./g) || []).length;
        const commas = (raw.match(/,/g) || []).length;
        if (dots + commas > 1) raw = raw.replace(/[.,](?=.*[.,])/g, '');
        raw = raw.replace(/,/g, '.');
        const v = Number(raw);
        if (!Number.isNaN(v)) vals.push(v);
      }
      if (vals.length > 0) return vals[vals.length - 1];
    }
  }

  // Fallback: use the generic extraction heuristic (largest amount)
  return parseAmountFromOcrText(text);
}
