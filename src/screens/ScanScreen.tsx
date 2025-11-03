import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../components/ScreenContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import Constants from 'expo-constants';
import { performOcrWithFallback } from '../services/ocrService';
import { parseAmountFromOcrText } from '../services/receiptParser';
import { receiptService } from '../services/dataService';
import { emit } from '../services/eventBus';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import ManualEntryModal from '../components/ManualEntryModal';
import CameraControls from '../components/CameraControls';
import { formatCurrencyGBP } from '../utils/formatters';
import showConfirmationPrompt from '../components/ConfirmationPrompt';

export default function ScanScreen() {
  const { userProfile } = useAuth();
  const navigation = useNavigation<any>();
  const facing: CameraType = 'back';
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [draftReceiptId, setDraftReceiptId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrRaw, setOcrRaw] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualEntryText, setManualEntryText] = useState<string>('');
  const pendingRef = useRef<{ draftId: number | null; ocrText: string | null; photoUri: string | null; amount: number | null }>({ draftId: null, ocrText: null, photoUri: null, amount: null });
  const cameraRef = useRef<CameraView>(null);
  const { width, isSmallPhone, isTablet, contentHorizontalPadding, sectionVerticalSpacing } = useBreakpoint();
  const insets = useSafeAreaInsets();

  // Automatically manage camera based on screen focus
  useFocusEffect(
    useCallback(() => {
      setIsCameraActive(true);
      return () => setIsCameraActive(false);
    }, [])
  );

  // frameDimensions previously used for a rectangular overlay — removed to
  // simplify UI; Camera fills the view and preview shows the captured image.

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <ScreenContainer>
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
      </ScreenContainer>
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
        // Intentionally do NOT save captured photos to the user's photo library.
        // We avoid requesting photo-library permissions and keep captured images private to the app.
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
        
        (async () => {
          // run OCR in background and update suggestion via callback
          await processReceiptHandler(photo.uri, (photo as any).base64 || null, createdDraftId, (amount, ocrText) => {
            // suggestion handled via pendingRef and UI prompt
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
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.black }}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.previewImage} />
          {/* Manual entry modal (Android fallback) */}
          <ManualEntryModal
            visible={manualModalVisible}
            value={manualEntryText}
            onChange={setManualEntryText}
            onCancel={() => setManualModalVisible(false)}
            onConfirm={async () => {
              const cleaned = String(manualEntryText || '').replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
              const parsed = Number(cleaned);
              if (!Number.isFinite(parsed) || parsed <= 0) { Alert.alert('Invalid amount', 'Enter a valid number'); return; }
              setManualModalVisible(false);
              const draft = draftReceiptId;
              await saveAndNavigate(parsed, draft, ocrRaw, photo);
            }}
          />
          {processing && (
            <View style={styles.processingOverlay} pointerEvents="none">
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
  {/* Android uses the ManualEntryModal above; iOS uses a native prompt where available */}
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
    // Minimal flow: call service helper that encapsulates preprocessing + fallbacks
    if (!skipOverlay) setProcessing(true);
    try {
      const extras = (Constants as any).manifest?.extra || (Constants as any).expoConfig?.extra || {};
      const apiKey = extras?.OCR_SPACE_API_KEY || process.env.OCR_SPACE_API_KEY || '';
      if (!apiKey) {
        if (!skipOverlay) setProcessing(false);
        Alert.alert('Missing API Key', 'Set OCR_SPACE_API_KEY in app config (app.json) or process.env');
        return;
      }

      const result = await performOcrWithFallback(photoUri, photoB64 || null, apiKey);
      const ocrText = result?.text || '';
      setOcrRaw(ocrText || null);

      if (!ocrText || !ocrText.trim()) {
        if (onSuggestion) try { onSuggestion(null, ocrText || null); } catch (e) {}
        if (!skipOverlay) {
          const draft = draftIdArg ?? draftReceiptId ?? null;
          pendingRef.current = { draftId: draft, ocrText: ocrText || null, photoUri: photoUri ?? null, amount: null };
          // show prompt (preserves existing Confirm / Enter manually / Rescan options)
          const displayAmount = 'No amount detected';
          showConfirmationPrompt(displayAmount, {
            onConfirm: async () => { await saveAndNavigate(0, draft, ocrText || null, photoUri || null); },
            onEnterManually: () => {
              // keep existing iOS-native prompt behaviour in the screen
              if (Platform.OS === 'ios' && (Alert as any).prompt) {
                (Alert as any).prompt('Enter total', '', async (value: string | undefined) => {
                  const cleaned = String(value || '').replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
                  const parsed = Number(cleaned);
                  if (!Number.isFinite(parsed) || parsed <= 0) { Alert.alert('Invalid amount', 'Enter a valid number'); return; }
                  await saveAndNavigate(parsed, draft, ocrText || null, photoUri || null);
                }, 'plain-text', '');
              } else {
                setManualEntryText('');
                setManualModalVisible(true);
              }
            },
            onRescan: async () => { try { await discardDraft(draft); } catch (e) {} resetCamera(); },
          });
        }
        return;
      }

      const parsed = parseAmountFromOcrText(ocrText);
      const amount = parsed != null && parsed > 0 ? parsed : null;
      if (onSuggestion) try { onSuggestion(amount, ocrText); } catch (e) {}

      const draft = draftIdArg ?? draftReceiptId ?? null;
      pendingRef.current = { draftId: draft, ocrText, photoUri: photoUri ?? null, amount: amount };
      const displayAmount = amount != null ? formatCurrencyGBP(amount) : 'No amount detected';
      showConfirmationPrompt(displayAmount, {
        onConfirm: async () => { await saveAndNavigate(amount ?? 0, draft, ocrText || null, photoUri || null); },
        onEnterManually: () => {
          if (Platform.OS === 'ios' && (Alert as any).prompt) {
            (Alert as any).prompt('Enter total', '', async (value: string | undefined) => {
              const cleaned = String(value || '').replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
              const parsed2 = Number(cleaned);
              if (!Number.isFinite(parsed2) || parsed2 <= 0) { Alert.alert('Invalid amount', 'Enter a valid number'); return; }
              await saveAndNavigate(parsed2, draft, ocrText || null, photoUri || null);
            }, 'plain-text', amount != null ? String(amount) : '');
          } else {
            setManualEntryText(amount != null ? String(amount) : '');
            setManualModalVisible(true);
          }
        },
        onRescan: async () => { try { await discardDraft(draft); } catch (e) {} resetCamera(); },
      });
      return;
  } catch (err: any) {
      console.error('OCR process error', err);
      if (!skipOverlay) Alert.alert('OCR Error', err?.message || 'Failed to process receipt');
      if (onSuggestion) try { onSuggestion(null, null); } catch (e) {}
      
    } finally {
      if (!skipOverlay) setProcessing(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.black }}>
      <View style={styles.cameraContainer}>
        {isCameraActive && (
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
          />
        )}

        <CameraControls
          onCapture={takePicture}
          bottomOffset={insets.bottom + (isSmallPhone ? spacing.lg : spacing.xl)}
          horizontalPadding={contentHorizontalPadding}
        />
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
  
  previewContainer: {
    flex: 1,
    backgroundColor: palette.black,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000080',
  },
  processingText: {
    color: palette.white,
    ...typography.sectionTitle,
  },
});