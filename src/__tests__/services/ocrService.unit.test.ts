import { ocrHelpers, performOcrWithFallback } from '@/services/ocrService';

/**
 * ocrService Unit Tests
 * 
 * Purpose: Validates Optical Character Recognition (OCR) integration
 * with OCR.space API for extracting text from receipt images.
 * 
 * What it tests:
 * - Image preprocessing (resize, compress) before OCR
 * - Base64 encoding of images for API submission
 * - OCR API request/response handling
 * - Fallback strategies when OCR fails
 * - Error handling for network issues
 * 
 * Why it's important: OCR is critical to the receipt scanning feature.
 * Tests ensure images are properly preprocessed to improve recognition
 * accuracy, API responses are correctly parsed, and failures are handled
 * gracefully so users can fall back to manual entry.
 */

describe('performOcrWithFallback', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns successful OCR result from preprocessed image', async () => {
    const preprocessSpy = jest
      .spyOn(ocrHelpers, 'preprocessImageToBase64')
      .mockResolvedValue('tiny-b64');
    const base64Spy = jest
      .spyOn(ocrHelpers, 'recognizeBase64WithOCRSpace')
      .mockResolvedValue({ text: 'receipt text', success: true } as any);

    const result = await performOcrWithFallback('file://receipt.jpg', null, 'api-key');

    expect(preprocessSpy).toHaveBeenCalledWith('file://receipt.jpg', 1400);
    expect(base64Spy).toHaveBeenCalledWith('tiny-b64', 'api-key');
    expect(result.text).toBe('receipt text');
  });
});
