import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import Constants from 'expo-constants';
import * as MediaLibrary from 'expo-media-library';
import { recognizeImageWithOCRSpace, recognizeBase64WithOCRSpace } from '../services/ocrService';
import { parseAmountFromOcrText } from '../services/receiptParser';
import { receiptService } from '../services/dataService';
import { emit } from '../services/eventBus';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function ScanScreen() {
  const { userProfile } = useAuth();
  const navigation = useNavigation<any>();
  const facing: CameraType = 'back';
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [draftReceiptId, setDraftReceiptId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrSuggestion, setOcrSuggestion] = useState<number | null>(null);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'scanning' | 'done' | 'failed'>('idle');
  const [ocrRaw, setOcrRaw] = useState<string | null>(null);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualEntryText, setManualEntryText] = useState<string>('');
  const pendingRef = useRef<{ draftId: number | null; ocrText: string | null; photoUri: string | null; amount: number | null }>({ draftId: null, ocrText: null, photoUri: null, amount: null });
  const cameraRef = useRef<CameraView>(null);
  const { width, isSmallPhone, isTablet, contentHorizontalPadding, sectionVerticalSpacing } = useBreakpoint();
  const insets = useSafeAreaInsets();

  const frameDimensions = useMemo(() => {
    const baseWidth = isTablet ? width * 0.45 : isSmallPhone ? width * 0.7 : width * 0.8;
    const clampedWidth = Math.max(220, Math.min(baseWidth, isTablet ? 420 : 360));
    const heightMultiplier = isTablet ? 1.2 : isSmallPhone ? 1.4 : 1.6;
    const calculatedHeight = clampedWidth * heightMultiplier;
    const clampedHeight = Math.max(300, Math.min(calculatedHeight, isTablet ? 520 : 480));
    return { width: clampedWidth, height: clampedHeight };
  }, [isSmallPhone, isTablet, width]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={[
            styles.permissionContainer,
            {
              paddingHorizontal: contentHorizontalPadding,
              paddingVertical: sectionVerticalSpacing,
            },
          ]}
        >
          <Text style={styles.permissionText}>
            Camera permission is required to scan receipts
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });
        setPhoto(photo.uri);
        // photo.base64 is available when base64: true
        if ((photo as any).base64) setPhotoBase64((photo as any).base64 as string);
        // Optionally save to media library so Expo Go can access the file reliably on some platforms
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            await MediaLibrary.createAssetAsync(photo.uri);
          }
        } catch (e) {
          // ignore
        }
        // Create a lightweight draft receipt immediately so it appears on the
        // dashboard while OCR runs (quicker UX). We save image_uri and scanned
        // timestamp; OCR results will update this draft later.
        let createdDraftId: number | null = null;
        try {
          const createdId = await receiptService.create({
            user_id: userProfile?.uid || 'anon',
            image_uri: photo.uri,
            // draft: leave total_amount undefined until OCR completes
            total_amount: undefined,
            ocr_data: '',
            synced: 0,
          });
          if (createdId && Number(createdId) > 0) {
            createdDraftId = Number(createdId);
            setDraftReceiptId(createdDraftId);
            try { emit('receipts-changed', { id: createdId, userId: userProfile?.uid }); } catch (e) {}
          }
        } catch (e) {
          // ignore draft creation failures - OCR will still continue
          console.warn('Failed to create draft receipt', e);
        }

        // Run OCR in background and populate a suggestion when ready so the user can accept it on iOS
        setOcrSuggestion(null);
        setOcrStatus('scanning');
        (async () => {
          // run OCR in background and update suggestion via callback
          await processReceiptHandler(photo.uri, (photo as any).base64 || null, createdDraftId, (amount, ocrText) => {
            if (amount != null) {
              setOcrSuggestion(amount);
              setOcrStatus('done');
            } else {
              setOcrSuggestion(null);
              setOcrStatus('failed');
            }
            // store the OCR text for later save
            pendingRef.current = { draftId: createdDraftId, ocrText: ocrText || null, photoUri: photo.uri, amount: amount };
          });
        })();
      } catch (error) {
        Alert.alert('Error', 'Failed to capture image');
      }
    }
  };

  const resetCamera = () => {
    setPhoto(null);
    setPhotoBase64(null);
    setDraftReceiptId(null);
    setProcessing(false);
    // clear any pending reference data
    pendingRef.current = { draftId: null, ocrText: null, photoUri: null, amount: null };
  };

  // Delete a draft receipt (used when user chooses to rescan and we don't want
  // to keep the lightweight draft row that was created when the photo was taken)
  const discardDraft = async (draftId?: number | null) => {
    const id = draftId ?? draftReceiptId;
    if (!id) return;
    try {
      await receiptService.delete(Number(id));
      try { emit('receipts-changed', { id }); } catch (e) {}
    } catch (e) {
      // ignore delete errors
    }
  };

  if (photo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.previewImage} />
          {/* Manual entry modal (Android) */}
          <Modal visible={manualModalVisible} transparent animationType="fade" onRequestClose={() => setManualModalVisible(false)}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Manual entry</Text>
                <Text style={styles.modalSubtitle}>Enter the total amount</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="decimal-pad"
                  value={manualEntryText}
                  onChangeText={setManualEntryText}
                  placeholder="0.00"
                />
                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <TouchableOpacity style={[styles.retakeButton, { marginRight: 8 }]} onPress={() => setManualModalVisible(false)}>
                    <Text style={styles.retakeButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.processButton} onPress={async () => {
                    const cleaned = String(manualEntryText || '').replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
                    const parsed = Number(cleaned);
                    if (!Number.isFinite(parsed) || parsed <= 0) { Alert.alert('Invalid amount', 'Enter a valid number'); return; }
                    setManualModalVisible(false);
                    const draft = draftReceiptId;
                    await saveAndNavigate(parsed, draft, ocrRaw, photo);
                  }}>
                    <Text style={styles.processButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
          {processing && (
            <View style={styles.processingOverlay} pointerEvents="none">
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
    {/* No Android manual fallback — manual entry is via iOS native prompt only */}
        </View>
      </SafeAreaView>
    );
  }

  async function processReceiptHandler(
    overrideUri?: string | null,
    overrideBase64?: string | null,
    draftIdArg?: number | null,
    onSuggestion?: (amount: number | null, ocrText: string | null) => void,
    skipOverlay = false
  ) {
    const photoUri = overrideUri ?? photo;
    const photoB64 = overrideBase64 ?? photoBase64;
    if (!photoUri) return;
    // Minimal flow:
    // 1) Preprocess to base64 (resize) when possible
    // 2) Send base64 to OCR.Space (fallback to file upload)
    // 3) Parse total using parser and show confirmation
    if (!skipOverlay) setProcessing(true);
    try {
      const extras = (Constants as any).manifest?.extra || (Constants as any).expoConfig?.extra || {};
      const apiKey = extras?.OCR_SPACE_API_KEY || process.env.OCR_SPACE_API_KEY || '';
      if (!apiKey) {
        if (!skipOverlay) setProcessing(false);
        Alert.alert('Missing API Key', 'Set OCR_SPACE_API_KEY in app config (app.json) or process.env');
        return;
      }

      // Preprocess -> base64
      let b64: string | null = photoB64 || null;
      if (!b64) {
        try {
          const { preprocessImageToBase64 } = await import('../services/ocrService');
          b64 = await preprocessImageToBase64(photoUri, 1400);
        } catch (e) {
          b64 = null;
        }
      }

      let ocrResult;
      if (b64) {
        const methodUsed = b64 ? 'base64' : 'file';
        try {
          if (b64) {
            ocrResult = await recognizeBase64WithOCRSpace(b64, apiKey);
          } else {
            ocrResult = await recognizeImageWithOCRSpace(photoUri, apiKey);
          }
        } catch (e: any) {
          ocrResult = { text: '', raw: null, success: false, errorMessage: e?.message || String(e) } as any;
        }

        let ocrText = ocrResult?.text || '';
        setOcrRaw(ocrText || null);

        // If OCR service reported an error flag, surface it and abort early so
        // the user isn't left on a permanent 'Processing...' overlay.
        if (ocrResult && ocrResult.success === false) {
          const msg = ocrResult.errorMessage || 'OCR provider returned an error';
          console.warn('OCR service error', msg, ocrResult.raw || '');
          if (!skipOverlay) {
            Alert.alert('OCR Error', String(msg));
          }
          if (onSuggestion) try { onSuggestion(null, ocrText || null); } catch (e) {}
          if (!skipOverlay) setProcessing(false);
          setOcrStatus('failed');
          pendingRef.current = { draftId: draftIdArg ?? draftReceiptId ?? null, ocrText: ocrText || null, photoUri: photoUri || null, amount: null };
          return;
        }
        // Minimal debug output for tuning

        // If OCR returned no text, try a couple of low-risk fallbacks:
        // 1) If we used base64, try file upload (some platforms/providers handle multipart better)
        // 2) Re-preprocess at a larger width and retry base64
        if (!ocrText || !ocrText.trim()) {
          try {
            // fallback 1: try file upload when initial used base64
            if (b64) {
              try {
                const tryFile = await recognizeImageWithOCRSpace(photoUri, apiKey);
                if (tryFile?.text && tryFile.text.trim().length > 0) {
                  ocrResult = tryFile;
                  ocrText = tryFile.text;
                  setOcrRaw(ocrText);
                }
              } catch (e) {
              }
            }

            // fallback 2: re-run preprocessing at higher resolution and retry base64 upload
            if ((!ocrText || !ocrText.trim()) && photoUri) {
              try {
                // small delay to avoid hitting provider too quickly
                await new Promise(res => setTimeout(res, 300));
                const { preprocessImageToBase64 } = await import('../services/ocrService');
                const bigger = await preprocessImageToBase64(photoUri, 2000);
                if (bigger) {
                  const tryB = await recognizeBase64WithOCRSpace(bigger, apiKey);
                  if (tryB?.text && tryB.text.trim().length > 0) {
                    ocrResult = tryB;
                    ocrText = tryB.text;
                    setOcrRaw(ocrText);
                  }
                }
              } catch (e) {
              }
            }
          } catch (e) {
            // swallow fallback errors - we'll handle empty result below
          }
        }
      } else {
        ocrResult = await recognizeImageWithOCRSpace(photoUri, apiKey);
      }

  const ocrText = ocrResult?.text || '';
  setOcrRaw(ocrText || null);
  // Minimal debug output for tuning — shows up in device logs

      if (!ocrText || !ocrText.trim()) {
        // When OCR returns empty text, surface fuller details to device logs to aid debugging.
        try {
          // Log the raw JSON (truncated), success flag and any error message from OCR service
        } catch (e) {
          // ignore logging errors
        }
        if (onSuggestion) try { onSuggestion(null, ocrText || null); } catch (e) {}
        if (!skipOverlay) {
          const draft = draftIdArg ?? draftReceiptId ?? null;
          pendingRef.current = { draftId: draft, ocrText: ocrText || null, photoUri: photoUri || null, amount: null };
          showConfirmationAlert(null, draft, ocrText || null, photoUri || null);
        } else {
          setOcrStatus('failed');
        }
        return;
      }

  const parsed = parseAmountFromOcrText(ocrText);
      // treat <=0 as no detection
      const amount = parsed != null && parsed > 0 ? parsed : null;
      if (onSuggestion) try { onSuggestion(amount, ocrText); } catch (e) {}

      const draft = draftIdArg ?? draftReceiptId ?? null;
      pendingRef.current = { draftId: draft, ocrText, photoUri: photoUri || null, amount: amount };
      showConfirmationAlert(amount, draft, ocrText, photoUri || null);
      return;
    } catch (err: any) {
      console.error('OCR process error', err);
      if (!skipOverlay) Alert.alert('OCR Error', err?.message || 'Failed to process receipt');
      if (onSuggestion) try { onSuggestion(null, null); } catch (e) {}
      setOcrStatus('failed');
    } finally {
      if (!skipOverlay) setProcessing(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
        />

        {/* Camera overlay positioned absolutely */}
        <View style={styles.cameraOverlay}>
          <View style={[styles.scanFrame, frameDimensions]} />
          <Text style={styles.instructionText}>
            Position receipt within the frame
          </Text>
        </View>

        <View
          style={[
            styles.controlsAbsolute,
            {
              paddingHorizontal: contentHorizontalPadding,
              bottom: insets.bottom + (isSmallPhone ? spacing.lg : spacing.xl),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
          >
          </TouchableOpacity>
        </View>
        {/* Android fallback manual modal (only used when needed) */}
  {/* manual modal removed: Android fallback modal removed per request. iOS will use native Alert.prompt where available */}
      </View>
    </SafeAreaView>
  );

  // Helper: save receipt (create/update) and navigate to ReceiptDetails
  async function saveAndNavigate(amount: number, draftId: number | null, ocrText: string | null, photoUri: string | null) {
    try {
      if (draftId) {
        await receiptService.update(Number(draftId), { total_amount: amount, ocr_data: ocrText || '', date_scanned: new Date().toISOString(), synced: 0 });
        try { emit('receipts-changed', { id: draftId }); } catch (e) {}
        resetCamera();
        navigation.navigate('ReceiptDetails' as any, { receiptId: String(draftId), totalAmount: amount, date: new Date().toISOString(), image: photoUri ?? undefined });
      } else {
        const created = await receiptService.create({ user_id: userProfile?.uid || 'anon', image_uri: photoUri ?? undefined, total_amount: amount, ocr_data: ocrText || '', synced: 0 });
        if (created && Number(created) > 0) {
          try { emit('receipts-changed', { id: created }); } catch (e) {}
          resetCamera();
          navigation.navigate('ReceiptDetails' as any, { receiptId: String(created), totalAmount: amount, date: new Date().toISOString(), image: photoUri ?? undefined });
        }
      }
    } catch (e: any) {
      Alert.alert('Save error', e?.message || 'Failed to save receipt');
    }
  }

  function showConfirmationAlert(amount: number | null, draftId: number | null, ocrText: string | null, photoUri: string | null) {
    const displayAmount = amount != null ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount) : 'No amount detected';
    const buttons: any[] = [
      { text: 'Confirm', onPress: async () => { await saveAndNavigate(amount ?? 0, draftId, ocrText, photoUri); } },
      { text: 'Enter manually', onPress: () => {
        // Use native iOS prompt when available. On Android open an in-app modal for manual entry
        if (Platform.OS === 'ios' && (Alert as any).prompt) {
          (Alert as any).prompt('Enter total', '', async (value: string | undefined) => {
            const cleaned = String(value || '').replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
            const parsed = Number(cleaned);
            if (!Number.isFinite(parsed) || parsed <= 0) { Alert.alert('Invalid amount', 'Enter a valid number'); return; }
            await saveAndNavigate(parsed, draftId, ocrText, photoUri);
          }, 'plain-text', '');
        } else {
          // open Android modal, prefill with OCR suggestion or empty
          setManualEntryText(amount != null ? String(amount) : '');
          setManualModalVisible(true);
        }
      } },
  { text: 'Rescan', onPress: async () => { try { await discardDraft(draftId); } catch (e) {} resetCamera(); } },
    ];

    Alert.alert('Confirm scanned total', displayAmount, buttons, { cancelable: true });
  }

  // Manual fallback removed: manual entry supported only via iOS native prompt

}

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.lightGray,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: palette.lightGray,
  },
  permissionText: {
    ...typography.body,
    textAlign: 'center',
    color: palette.black,
    opacity: 0.7,
  },
  permissionButton: {
    backgroundColor: palette.green,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  permissionButtonText: {
    color: palette.white,
    ...typography.button,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: palette.black,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scanFrame: {
    width: 280,
    height: 500,
    borderWidth: 2,
    borderColor: palette.green,
    borderRadius: radii.md,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: palette.white,
    ...typography.button,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    textAlign: 'center',
    backgroundColor: alpha.overlayBlack,
    padding: spacing.sm + spacing.xs,
    borderRadius: radii.md,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: alpha.deepBlack,
  },
  controlsAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: palette.green,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.white,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: palette.black,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewButtons: {
    flexDirection: 'row',
    padding: spacing.xl,
    backgroundColor: alpha.deepBlack,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: alpha.subtleBlack,
    padding: spacing.md,
    borderRadius: radii.md,
    marginRight: spacing.md,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: palette.white,
    ...typography.button,
  },
  processButton: {
    flex: 1,
    backgroundColor: palette.green,
    padding: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  processButtonText: {
    color: palette.white,
    ...typography.button,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  processingText: {
    color: palette.white,
    ...typography.sectionTitle,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: palette.white,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.sectionTitle,
    color: palette.black,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    ...typography.metric,
    color: palette.black,
    marginBottom: spacing.md,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: palette.lightGray,
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: palette.white,
    marginTop: spacing.sm,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.md,
  },
  modalPrimary: {
    backgroundColor: palette.green,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
  },
  modalPrimaryText: {
    color: palette.white,
    ...typography.button,
  },
  modalGhost: {
    borderWidth: 1,
    borderColor: palette.green,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: palette.white,
  },
  modalGhostText: {
    color: palette.green,
    ...typography.button,
  },
  modalCancel: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: 'transparent',
  },
  modalCancelText: {
    color: palette.black,
    ...typography.button,
  },
});