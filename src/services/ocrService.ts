/**
 * OCR service (minimal)
 * - Provides two helpers: upload image file URI or base64 payload to OCR.Space
 * - Small preprocess helper to resize and return base64 (used to improve OCR quality)
 */
export type OcrResult = {
  text: string;
  raw?: any;
  success: boolean;
  errorMessage?: string;
};

async function doOcrForm(formData: FormData, apiKey: string): Promise<OcrResult> {
  // Use an AbortController to avoid hanging forever if the provider is slow/unresponsive.
  const TIMEOUT_MS = 30000; // 30s
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Ensure the API key is present in the multipart form body as some
    // platforms/proxies may strip custom headers. Having it in the form is
    // accepted by OCR.Space API as an alternative to the `apikey` header.
    try {
      // only append if not already present
      // FormData in RN doesn't provide a stable iterator, but append is safe
      formData.append('apikey', apiKey as any);
    } catch (e) {
      // ignore if append not supported for this FormData implementation
    }

    console.debug('[ocrService] sending request to OCR.Space');
    const resp = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      // keep header as a best-effort too
      headers: { apikey: apiKey, Accept: 'application/json' } as any,
      body: formData as any,
      signal: (controller as any).signal,
    });
    clearTimeout(timeout);

    console.debug('[ocrService] OCR.Space responded', { status: resp.status });
    if (!resp.ok) {
      const txt = await resp.text();
      console.warn('[ocrService] OCR.Space non-OK response', resp.status, txt);
      return { text: '', raw: txt, success: false, errorMessage: `OCR.Space request failed: ${resp.status}` };
    }
    const json = await resp.json();
    const isErrored = json?.IsErroredOnProcessing;
    const parsed = json?.ParsedResults?.[0];
    const text = parsed?.ParsedText ?? '';
    if (isErrored) {
      const msg = json?.ErrorMessage || parsed?.ErrorMessage || 'OCR.Space reported an error';
      console.warn('[ocrService] OCR.Space error', msg, json);
      return { text: '', raw: json, success: false, errorMessage: String(msg) };
    }
    if (!text || text.trim().length === 0) {
      console.warn('[ocrService] OCR.Space returned empty ParsedText', json);
      return { text: '', raw: json, success: false, errorMessage: 'No text detected in image' };
    }
    return { text, raw: json, success: true };
  } catch (e: any) {
    clearTimeout(timeout);
    // Abort errors have a message that varies by platform. Normalize to a clearer message.
    const isAbort = e?.name === 'AbortError' || String(e).toLowerCase().includes('abort');
    const message = isAbort ? `OCR request timed out after ${TIMEOUT_MS / 1000}s` : (e?.message || String(e));
    console.error('[ocrService] doOcrForm failed', message, e);
    return { text: '', raw: e, success: false, errorMessage: message };
  }
}

export async function recognizeImageWithOCRSpace(imageUri: string, apiKey: string): Promise<OcrResult> {
  if (!apiKey) throw new Error('OCR Space API key is required');
  const uri = imageUri;
  const filename = uri.split('/').pop() || 'photo.jpg';
  const match = filename.match(/\.(\w+)$/);
  // normalize common extensions to proper mime types
  let ext = match ? match[1].toLowerCase() : 'jpg';
  if (ext === 'jpg') ext = 'jpeg';
  const type = `image/${ext}`;
  const formData = new FormData();
  // @ts-ignore
  formData.append('file', { uri, name: filename, type });
  console.debug('[ocrService] recognizeImageWithOCRSpace - file upload', { filename, type });
  // try the newer OCR engine when available
  formData.append('OCREngine', '2');
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  // append apikey here too so doOcrForm can rely on form presence
  try { formData.append('apikey', apiKey as any); } catch (e) {}
  return doOcrForm(formData, apiKey);
}

export async function recognizeBase64WithOCRSpace(base64Data: string, apiKey: string): Promise<OcrResult> {
  if (!apiKey) throw new Error('OCR Space API key is required');
  let payload = base64Data;
  if (!payload.startsWith('data:')) payload = `data:image/jpeg;base64,${payload}`;
  const formData = new FormData();
  formData.append('base64Image', payload as any);
  // ensure apikey is present in form body for reliability on mobile
  try { formData.append('apikey', apiKey as any); } catch (e) {}
  try {
    const len = (payload.split(',')[1] || '').length;
    console.debug('[ocrService] recognizeBase64WithOCRSpace - base64 length', len);
  } catch (e) {}
  // try the newer OCR engine when available
  formData.append('OCREngine', '2');
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  return doOcrForm(formData, apiKey);
}

export async function preprocessImageToBase64(uri: string, targetWidth = 2200): Promise<string | null> {
  try {
    const ImageManipulator = await import('expo-image-manipulator');
    // increase default resolution and reduce compression to preserve small text
    const manip = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: targetWidth } }], { compress: 1.0, format: ImageManipulator.SaveFormat.JPEG, base64: true });
    if (manip?.base64) console.debug('[ocrService] preprocessImageToBase64 produced base64 length', manip.base64.length);
    return manip?.base64 || null;
  } catch (e: any) {
    console.warn('preprocessImageToBase64 failed', e?.message || e);
    return null;
  }
}

/**
 * High-level OCR flow used by UI: try base64 upload first (fast), fallback to
 * file upload when base64 yields no text, and optionally re-run preprocessing
 * at a higher resolution and retry base64.
 */
export async function performOcrWithFallback(imageUri: string, base64Data: string | null, apiKey: string): Promise<OcrResult> {
  if (!apiKey) throw new Error('OCR Space API key is required');
  let b64 = base64Data || null;
  let ocrResult: OcrResult | undefined;

  try {
    // Ensure we have a base64 payload when possible
    if (!b64) {
      b64 = await preprocessImageToBase64(imageUri, 1400);
    }

    if (b64) {
      try {
        ocrResult = await recognizeBase64WithOCRSpace(b64, apiKey);
      } catch (e) {
        ocrResult = { text: '', raw: null, success: false, errorMessage: String(e) } as OcrResult;
      }
    }

    // If base64 returned empty text, try file upload (some platforms/providers handle multipart better)
    if ((!ocrResult || !ocrResult.text || !ocrResult.text.trim()) && imageUri) {
      try {
        const fileTry = await recognizeImageWithOCRSpace(imageUri, apiKey);
        if (fileTry && fileTry.text && fileTry.text.trim().length > 0) {
          ocrResult = fileTry;
        }
      } catch (e) {
        // swallow - we'll try a higher-res preprocess next
      }
    }

    // If still no text, try a higher resolution preprocess and retry base64
    if ((!ocrResult || !ocrResult.text || !ocrResult.text.trim()) && imageUri) {
      try {
        const bigger = await preprocessImageToBase64(imageUri, 2000);
        if (bigger) {
          const tryB = await recognizeBase64WithOCRSpace(bigger, apiKey);
          if (tryB && tryB.text && tryB.text.trim().length > 0) {
            ocrResult = tryB;
          }
        }
      } catch (e) {
        // final fallback ignored
      }
    }

    return ocrResult || { text: '', raw: null, success: false, errorMessage: 'No OCR result' };
  } catch (e: any) {
    console.error('[ocrService] performOcrWithFallback error', e?.message || e);
    return { text: '', raw: null, success: false, errorMessage: String(e) };
  }
}
