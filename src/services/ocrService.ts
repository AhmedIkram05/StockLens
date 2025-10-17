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
    return { text: '', raw: json, success: false, errorMessage: String(msg) };
  }
  if (!text || text.trim().length === 0) {
    return { text: '', raw: json, success: false, errorMessage: 'No text detected in image' };
  }
  return { text, raw: json, success: true };
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
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  return doOcrForm(formData, apiKey);
}

export async function preprocessImageToBase64(uri: string, targetWidth = 1400): Promise<string | null> {
  try {
    const ImageManipulator = await import('expo-image-manipulator');
    const manip = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: targetWidth } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true });
    return manip?.base64 || null;
  } catch (e: any) {
    console.warn('preprocessImageToBase64 failed', e?.message || e);
    return null;
  }
}
