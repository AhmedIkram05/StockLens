/**
 * ScanScreen
 * 
 * Camera screen for capturing receipt images and extracting transaction data via OCR.
 * Features:
 * - expo-camera integration for taking photos
 * - OCR processing with Google Cloud Vision API (fallback to mock data)
 * - Amount parsing from OCR text
 * - Manual entry modal for corrections
 * - Confirmation prompt for detected amounts
 * - Draft receipt creation and Firebase upload
 * 
 * Flow:
 * 1. User grants camera permission
 * 2. User captures receipt photo
 * 3. OCR processes image to extract text
 * 4. App parses amount from OCR text
 * 5. User confirms, manually edits, or rescans
 * 6. Receipt saved to Firestore and navigates to ReceiptDetails
 * 
 * Camera deactivates when screen loses focus to save battery.
 * Capture button size is responsive (60px/70px/80px based on device).
 */

import React, { useState, useRef, useCallback } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../components/ScreenContainer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { brandColors, useTheme } from '../contexts/ThemeContext';
import { radii, spacing, typography, shadows } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import Constants from 'expo-constants';
import { performOcrWithFallback } from '../services/ocrService';
import { parseAmountFromOcrText } from '../services/receiptParser';
import { receiptService } from '../services/dataService';
import { emit } from '../services/eventBus';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { formatCurrencyGBP } from '../utils/formatters';
import showConfirmationPrompt from '../components/ConfirmationPrompt';

/**
 * Renders the camera view with capture controls and photo preview.
 * Handles OCR processing, amount parsing, and receipt creation workflow.
 */
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
  const { isSmallPhone, isTablet, contentHorizontalPadding, sectionVerticalSpacing, width } = useBreakpoint();
  const insets = useSafeAreaInsets();

  const captureButtonSize = isSmallPhone ? 60 : isTablet ? 80 : 70;

  useFocusEffect(
    useCallback(() => {
      setIsCameraActive(true);
      return () => setIsCameraActive(false);
    }, [])
  );

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
        if ((photo as any).base64) setPhotoBase64((photo as any).base64 as string);
        let createdDraftId: number | null = null;
        try {
          const createdId = await receiptService.create({
            user_id: userProfile?.uid || 'anon',
            image_uri: photo.uri,
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
          console.warn('Failed to create draft receipt', e);
        }

        await processReceiptHandler(photo.uri, (photo as any).base64, createdDraftId);
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
    pendingRef.current = { draftId: null, ocrText: null, photoUri: null, amount: null };
  };

  const discardDraft = async (draftId?: number | null) => {
    const id = draftId ?? draftReceiptId;
    if (!id) return;
    try {
      await receiptService.delete(Number(id));
      try { emit('receipts-changed', { id }); } catch (e) {}
    } catch (e) {}
  };

  if (photo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: brandColors.black }}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.previewImage} />
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
                <View style={styles.modalRow}>
                  <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setManualModalVisible(false)}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalConfirm]}
                    onPress={async () => {
                      const cleaned = String(manualEntryText || '').replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
                      const parsed = Number(cleaned);
                      if (!Number.isFinite(parsed) || parsed <= 0) { Alert.alert('Invalid amount', 'Enter a valid number'); return; }
                      setManualModalVisible(false);
                      const draft = draftReceiptId;
                      await saveAndNavigate(parsed, draft, ocrRaw, photo);
                    }}
                  >
                    <Text style={styles.modalConfirmText}>Confirm</Text>
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
          const displayAmount = 'No amount detected';
          showConfirmationPrompt(displayAmount, {
            onConfirm: async () => { await saveAndNavigate(0, draft, ocrText || null, photoUri || null); },
            onEnterManually: () => {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: brandColors.black }}>
      <View style={styles.cameraContainer}>
        {isCameraActive && (
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
          />
        )}

        <View
          style={[
            styles.cameraControls,
            {
              paddingHorizontal: contentHorizontalPadding,
              bottom: (() => {
                const base = insets.bottom;
                if (isSmallPhone) return base + spacing.lg;
                if (isTablet) return base + spacing.xxl + spacing.xl;
                return base + spacing.xl;
              })(),
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={takePicture}
            style={[
              styles.captureButton,
              {
                width: captureButtonSize,
                height: captureButtonSize,
                borderRadius: captureButtonSize / 2,
              },
            ]}
          />
        </View>
      </View>
    </SafeAreaView>
  );

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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: brandColors.gray,
  },
  permissionText: {
    ...typography.body,
    textAlign: 'center',
    color: brandColors.black,
    opacity: 0.7,
  },
  permissionButton: {
    backgroundColor: brandColors.green,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  permissionButtonText: {
    color: brandColors.white,
    ...typography.button,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: brandColors.black,
  },
  camera: {
    flex: 1,
  },
  
  previewContainer: {
    flex: 1,
    backgroundColor: brandColors.black,
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
    backgroundColor: brandColors.black + 'CC',
  },
  processingText: {
    color: brandColors.white,
    ...typography.sectionTitle,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '80%',
    borderRadius: radii.lg,
    padding: spacing.lg,
    shadowColor: brandColors.black,
    shadowOffset: { width: 0, height: spacing.xs },
    shadowOpacity: 0.25,
    shadowRadius: spacing.md,
    elevation: 5,
  },
  modalTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...typography.body,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: brandColors.gray,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    marginLeft: spacing.sm,
  },
  modalCancel: {
    backgroundColor: brandColors.gray,
  },
  modalConfirm: {
    backgroundColor: brandColors.green,
  },
  modalCancelText: {
    color: brandColors.black,
  },
  modalConfirmText: {
    color: brandColors.white,
  },
  cameraControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  captureButton: {
    backgroundColor: brandColors.green,
    borderWidth: 1,
    borderColor: brandColors.white,
  },
});