import { Platform } from 'react-native';

/**
 * Minimal OCR service using OCR.Space free REST API.
 * - Quick to integrate, works in Expo Go because it's a network request.
 * - For production, consider Google Vision, AWS Textract, or on-device ML Kit.
 *
 * Usage:
 *  const result = await recognizeImageWithOCRSpace(imageUri, apiKey)
 *
 */

export type OcrResult = {
  text: string;
  raw?: any;
  success: boolean;
  errorMessage?: string;
};

export async function recognizeImageWithOCRSpace(imageUri: string, apiKey: string): Promise<OcrResult> {
  if (!apiKey) throw new Error('OCR Space API key is required');

  // Build form data. Expo/FileSystem on managed apps provides a file:// URI.
  const uri = imageUri;
  const filename = uri.split('/').pop() || 'photo.jpg';
  const match = filename.match(/\.(\w+)$/);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const formData = new FormData();
  // Field name expected by OCR.Space is "file" for multipart upload
  // @ts-ignore - React Native's FormData accepts objects with uri/name/type
  formData.append('file', { uri, name: filename, type });
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');

  const resp = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: {
      // Don't set Content-Type header; let fetch set the correct multipart boundary
      apikey: apiKey,
    } as any,
    body: formData as any,
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`OCR.Space request failed: ${resp.status} ${txt}`);
  }

  const json = await resp.json();

  // OCR.Space response shape: { IsErroredOnProcessing: bool, ErrorMessage, ParsedResults: [...] }
  const isErrored = json?.IsErroredOnProcessing;
  const parsed = json?.ParsedResults?.[0];
  const text = parsed?.ParsedText ?? '';

  if (isErrored) {
    const msg = json?.ErrorMessage || parsed?.ErrorMessage || 'OCR.Space reported an error';
    return { text: '', raw: json, success: false, errorMessage: String(msg) };
  }

  // If no parsed text, treat as unsuccessful for UX purposes (caller can still decide)
  if (!text || text.trim().length === 0) {
    return { text: '', raw: json, success: false, errorMessage: 'No text detected in image' };
  }

  return { text, raw: json, success: true };
}

// Accepts a base64 string (without data: prefix or with) and sends to OCR.Space
export async function recognizeBase64WithOCRSpace(base64Data: string, apiKey: string): Promise<OcrResult> {
  if (!apiKey) throw new Error('OCR Space API key is required');

  // Ensure prefix exists as OCR.Space expects data URI format for base64 payloads
  let payload = base64Data;
  if (!payload.startsWith('data:')) {
    // default to jpeg
    payload = `data:image/jpeg;base64,${payload}`;
  }

  const formData = new FormData();
  formData.append('base64Image', payload as any);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');

  const resp = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: {
      apikey: apiKey,
    } as any,
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
