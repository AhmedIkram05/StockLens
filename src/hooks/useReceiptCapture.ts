import { useCallback, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { receiptService } from '@/services/dataService';
import { performOcrWithFallback } from '@/services/ocrService';
import { parseAmountFromOcrText, validateAmount } from '@/services/receiptParser';
import { emit } from '@/services/eventBus';
import { formatCurrencyGBP } from '@/utils/formatters';
import showConfirmationPrompt from '@/components/ConfirmationPrompt';

export type PendingReceiptState = {
  draftId: number | null;
  ocrText: string | null;
  photoUri: string | null;
  amount: number | null;
};

type UseReceiptCaptureOptions = {
  navigation: any;
  userUid?: string;
  onResetCamera?: () => void;
};

type ProcessReceiptOptions = {
  photoUri?: string | null;
  photoBase64?: string | null;
  draftIdArg?: number | null;
  onSuggestion?: (amount: number | null, ocrText: string | null) => void;
  skipOverlay?: boolean;
};

export const useReceiptCapture = ({ navigation, userUid, onResetCamera }: UseReceiptCaptureOptions) => {
  const [processing, setProcessing] = useState(false);
  const [ocrRaw, setOcrRaw] = useState<string | null>(null);
  const [draftReceiptId, setDraftReceiptId] = useState<number | null>(null);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualEntryText, setManualEntryText] = useState('');
  const pendingRef = useRef<PendingReceiptState>({ draftId: null, ocrText: null, photoUri: null, amount: null });

  const resetWorkflowState = useCallback(() => {
    setProcessing(false);
    setOcrRaw(null);
    setDraftReceiptId(null);
    pendingRef.current = { draftId: null, ocrText: null, photoUri: null, amount: null };
  }, []);

  const discardDraft = useCallback(async (draftId?: number | null) => {
    const id = draftId ?? draftReceiptId;
    if (!id) return;
    try {
      await receiptService.delete(Number(id));
      try { emit('receipts-changed', { id }); } catch (e) {}
    } catch (e) {}
  }, [draftReceiptId]);

  const saveAndNavigate = useCallback(async (amount: number, draftId: number | null, ocrText: string | null, photoUri: string | null) => {
    try {
      if (draftId) {
        await receiptService.update(Number(draftId), {
          total_amount: amount,
          ocr_data: ocrText || '',
          synced: 0,
        });
        try { emit('receipts-changed', { id: draftId }); } catch (e) {}
        resetWorkflowState();
        navigation.navigate('ReceiptDetails' as any, {
          receiptId: String(draftId),
          totalAmount: amount,
          date: new Date().toISOString(),
          image: photoUri ?? undefined,
        });
        onResetCamera?.();
      } else {
        const created = await receiptService.create({
          user_id: userUid || 'anon',
          image_uri: photoUri ?? undefined,
          total_amount: amount,
          ocr_data: ocrText || '',
          synced: 0,
        });
        if (created && Number(created) > 0) {
          try { emit('receipts-changed', { id: created }); } catch (e) {}
          resetWorkflowState();
          navigation.navigate('ReceiptDetails' as any, {
            receiptId: String(created),
            totalAmount: amount,
            date: new Date().toISOString(),
            image: photoUri ?? undefined,
          });
          onResetCamera?.();
        }
      }
    } catch (e: any) {
      Alert.alert('Save error', e?.message || 'Failed to save receipt');
    }
  }, [navigation, onResetCamera, resetWorkflowState, userUid]);

  const handleManualEntry = useCallback((prefill?: number | null) => {
    const preset = prefill != null ? String(prefill) : '';
    if (Platform.OS === 'ios' && (Alert as any).prompt) {
      (Alert as any).prompt(
        'Enter total',
        '',
        async (value: string | undefined) => {
          const cleaned = String(value || '').replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
          const parsed = Number(cleaned);
          if (!Number.isFinite(parsed) || parsed <= 0) {
            Alert.alert('Invalid amount', 'Enter a valid number');
            return;
          }
          const draft = pendingRef.current.draftId ?? draftReceiptId ?? null;
          await saveAndNavigate(parsed, draft, pendingRef.current.ocrText, pendingRef.current.photoUri);
        },
        'plain-text',
        preset,
      );
    } else {
      setManualEntryText(preset);
      setManualModalVisible(true);
    }
  }, [draftReceiptId, saveAndNavigate]);

  const processReceipt = useCallback(async ({ photoUri, photoBase64, draftIdArg, onSuggestion, skipOverlay }: ProcessReceiptOptions) => {
    if (!photoUri) return;
    if (!skipOverlay) setProcessing(true);
    try {
      const extras = (Constants as any).manifest?.extra || (Constants as any).expoConfig?.extra || {};
      const apiKey = extras?.OCR_SPACE_API_KEY || process.env.OCR_SPACE_API_KEY || '';
      if (!apiKey) {
        if (!skipOverlay) setProcessing(false);
        Alert.alert('Missing API Key', 'Set OCR_SPACE_API_KEY in app config (app.json) or process.env');
        return;
      }

      const result = await performOcrWithFallback(photoUri, photoBase64 || null, apiKey);
      const ocrText = result?.text || '';
      setOcrRaw(ocrText || null);

      if (!ocrText || !ocrText.trim()) {
        if (onSuggestion) onSuggestion(null, ocrText || null);
        const draft = draftIdArg ?? draftReceiptId ?? null;
        pendingRef.current = { draftId: draft, ocrText: ocrText || null, photoUri: photoUri ?? null, amount: null };
        if (!skipOverlay) {
          showConfirmationPrompt('No amount detected', {
            onConfirm: async () => {
              await saveAndNavigate(0, draft, ocrText || null, photoUri || null);
            },
            onEnterManually: () => handleManualEntry(null),
            onRescan: async () => {
              await discardDraft(draft);
              resetWorkflowState();
              onResetCamera?.();
            },
          });
        }
        return;
      }

      const parsed = parseAmountFromOcrText(ocrText);
      const amount = parsed != null && parsed > 0 ? parsed : null;
      
      // Validate extracted amount for realistic values
      if (amount !== null && !validateAmount(amount)) {
        // Amount is unrealistic (too high, negative, etc.)
        if (onSuggestion) onSuggestion(null, ocrText);
        const draft = draftIdArg ?? draftReceiptId ?? null;
        pendingRef.current = { draftId: draft, ocrText, photoUri: photoUri ?? null, amount: null };
        if (!skipOverlay) {
          Alert.alert(
            'Invalid Amount Detected',
            `The detected amount (${formatCurrencyGBP(amount)}) seems unrealistic. Please enter the amount manually.`,
            [
              {
                text: 'Enter Manually',
                onPress: () => handleManualEntry(null),
              },
              {
                text: 'Rescan',
                onPress: async () => {
                  await discardDraft(draft);
                  resetWorkflowState();
                  onResetCamera?.();
                },
              },
            ]
          );
        }
        return;
      }
      
      if (onSuggestion) onSuggestion(amount, ocrText);

      const draft = draftIdArg ?? draftReceiptId ?? null;
      pendingRef.current = { draftId: draft, ocrText, photoUri: photoUri ?? null, amount };
      const displayAmount = amount != null ? formatCurrencyGBP(amount) : 'No amount detected';
      showConfirmationPrompt(displayAmount, {
        onConfirm: async () => {
          await saveAndNavigate(amount ?? 0, draft, ocrText || null, photoUri || null);
        },
        onEnterManually: () => handleManualEntry(amount),
        onRescan: async () => {
          await discardDraft(draft);
          resetWorkflowState();
          onResetCamera?.();
        },
      });
    } catch (err: any) {
      console.error('OCR process error', err);
      if (!skipOverlay) Alert.alert('OCR Error', err?.message || 'Failed to process receipt');
      if (onSuggestion) onSuggestion(null, null);
    } finally {
      if (!skipOverlay) setProcessing(false);
    }
  }, [discardDraft, draftReceiptId, handleManualEntry, onResetCamera, resetWorkflowState, saveAndNavigate]);

  return {
    state: {
      processing,
      ocrRaw,
      draftReceiptId,
      manualModalVisible,
      manualEntryText,
    },
    actions: {
      setDraftReceiptId,
      setManualEntryText,
      setManualModalVisible,
      setProcessing,
      setOcrRaw,
      resetWorkflowState,
      discardDraft,
      saveAndNavigate,
      processReceipt,
    },
    pendingRef,
  };
};

export type UseReceiptCaptureReturn = ReturnType<typeof useReceiptCapture>;
