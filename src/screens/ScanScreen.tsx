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
import { receiptService } from '../services/dataService';
import { emit } from '../services/eventBus';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useReceiptCapture } from '../hooks/useReceiptCapture';

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
  const [isCameraActive, setIsCameraActive] = useState(true);
  const clearPhotoPreview = useCallback(() => {
    setPhoto(null);
    setPhotoBase64(null);
  }, []);
  const capture = useReceiptCapture({ navigation, userUid: userProfile?.uid, onResetCamera: clearPhotoPreview });
  const { processing, ocrRaw, draftReceiptId, manualModalVisible, manualEntryText } = capture.state;
  const {
    setDraftReceiptId,
    setManualEntryText,
    setManualModalVisible,
    processReceipt,
    saveAndNavigate,
  } = capture.actions;
  const cameraRef = useRef<CameraView>(null);
  const { isSmallPhone, isTablet, contentHorizontalPadding, sectionVerticalSpacing, width } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

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
          <Text testID="camera-permission-text" style={[styles.permissionText, { color: theme.text }]}> 
            Camera permission is required to scan receipts
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.primary }]}
            onPress={requestPermission}
          >
            <Text style={[styles.permissionButtonText, { color: brandColors.white }]}>Grant Permission</Text>
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
        }

        await processReceipt({
          photoUri: photo.uri,
          photoBase64: (photo as any).base64 ?? null,
          draftIdArg: createdDraftId,
        });
      } catch (error) {
        Alert.alert('Error', 'Failed to capture image');
      }
    }
  };
  if (photo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: brandColors.black }}>
        <View style={styles.previewContainer}>
          <Image testID="scan-preview-image" source={{ uri: photo }} style={styles.previewImage} />
          <Modal visible={manualModalVisible} transparent animationType="fade" onRequestClose={() => setManualModalVisible(false)}>
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Manual entry</Text>
                <Text style={styles.modalSubtitle}>Enter the total amount</Text>
                <TextInput
                  testID="manual-entry-input"
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
                    testID="manual-confirm-button"
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
                if (isSmallPhone) return base + spacing.xl;
                if (isTablet) return base + spacing.xxl + spacing.xl;
                return base + spacing.xxl + spacing.sm;
              })(),
            },
          ]}
        >
          <TouchableOpacity
            testID="capture-button"
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

}

const styles = StyleSheet.create({
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionText: {
    ...typography.body,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: spacing.lg,
  },
  permissionButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  permissionButtonText: {
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