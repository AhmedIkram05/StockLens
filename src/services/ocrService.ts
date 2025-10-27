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
  try {
    console.debug('[ocrService] sending request to OCR.Space');
    const resp = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { apikey: apiKey } as any,
      body: formData as any,
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`OCR.Space request failed: ${resp.status} ${txt}`);
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
    console.error('[ocrService] doOcrForm failed', e?.message || e);
    throw e;
  }
}

export async function recognizeImageWithOCRSpace(imageUri: string, apiKey: string): Promise<OcrResult> {
  if (!apiKey) throw new Error('OCR Space API key is required');
  const uri = imageUri;
  const filename = uri.split('/').pop() || 'photo.jpg';
  const match = filename.match(/\.(\w+)$/);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  const formData = new FormData();
  // @ts-ignore
  formData.append('file', { uri, name: filename, type });
  console.debug('[ocrService] recognizeImageWithOCRSpace - file upload', { filename, type });
  // try the newer OCR engine when available
  formData.append('OCREngine', '2');
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  return doOcrForm(formData, apiKey);
}

export async function recognizeBase64WithOCRSpace(base64Data: string, apiKey: string): Promise<OcrResult> {
  if (!apiKey) throw new Error('OCR Space API key is required');
  let payload = base64Data;
  if (!payload.startsWith('data:')) payload = `data:image/jpeg;base64,${payload}`;
  const formData = new FormData();
  formData.append('base64Image', payload as any);
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
