import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import Constants from 'expo-constants';
import * as MediaLibrary from 'expo-media-library';
import { recognizeImageWithOCRSpace } from '../services/ocrService';
import { parseAmountFromOcrText } from '../services/receiptParser';
import { receiptService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function ScanScreen() {
  const { userProfile } = useAuth();
  const navigation = useNavigation<any>();
  const facing: CameraType = 'back';
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { width, isSmallPhone, isTablet, contentHorizontalPadding, sectionVerticalSpacing } = useBreakpoint();

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
        // Auto-process immediately after capture. Pass captured URI/base64 directly
        // to avoid race conditions with state updates.
        (async () => {
          await processReceiptHandler(photo.uri, (photo as any).base64 || null);
        })();
      } catch (error) {
        Alert.alert('Error', 'Failed to capture image');
      }
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
  };

  if (photo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.previewImage} />
          {processing && (
            <View style={styles.processingOverlay} pointerEvents="none">
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          )}
          <View
            style={[
              styles.previewButtons,
              {
                paddingHorizontal: contentHorizontalPadding,
                paddingVertical: isSmallPhone ? spacing.lg : spacing.xl,
              },
            ]}
          >
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  async function processReceiptHandler(overrideUri?: string | null, overrideBase64?: string | null) {
    const photoUri = overrideUri ?? photo;
    const photoB64 = overrideBase64 ?? photoBase64;
    if (!photoUri) return;
    // small helper to avoid hanging promises (timeout)
    const withTimeout = async <T,>(p: Promise<T>, ms = 20000): Promise<T> => {
      return await Promise.race([
        p,
        new Promise<T>((_res, rej) => setTimeout(() => rej(new Error('Operation timed out')), ms)),
      ] as any);
    };

    try {
      setProcessing(true);
      const extras = (Constants as any).manifest?.extra || (Constants as any).expoConfig?.extra || {};
      const apiKey = extras?.OCR_SPACE_API_KEY || process.env.OCR_SPACE_API_KEY || '';
      if (!apiKey) {
        setProcessing(false);
        Alert.alert('Missing API Key', 'Set OCR_SPACE_API_KEY in app config (app.json) or process.env');
        return;
      }
      // Try OCR, preferring base64. If no text, retry after preprocessing (resize/compress)
  const { recognizeBase64WithOCRSpace, recognizeImageWithOCRSpace: recognizeImageWithOCRSpaceLocal } = await import('../services/ocrService');
      let result: any = null;
      let attempts = 0;
      const maxAttempts = 3; // initial + 2 preprocessing retries

      // helper to preprocess image and return base64 (with timeout)
      const preprocessAndGetBase64 = async (uri: string) => {
        try {
          // Dynamic import to avoid top-level type dependency issues in TS
          const ImageManipulator = (await import('expo-image-manipulator')) as any;
          // Resize to improve OCR accuracy, keep aspect ratio
          const manipPromise = ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1600 } }],
            { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          const manipResult = await withTimeout(manipPromise, 20000) as any;
          return manipResult?.base64 || null;
        } catch (e: any) {
          console.warn('Preprocess failed', e?.message || e);
          return null;
        }
      };

      // Loop attempts: first try existing base64 (if present) or direct URI; then try preprocessing and retry
      while (attempts < maxAttempts) {
        attempts += 1;
        try {
            if (attempts === 1) {
            if (photoB64) {
              result = await withTimeout(recognizeBase64WithOCRSpace(photoB64, apiKey), 25000);
            } else {
              // try using manipulated base64 directly from uri
              const pre = await preprocessAndGetBase64(photoUri);
              if (pre) result = await withTimeout(recognizeBase64WithOCRSpace(pre, apiKey), 25000);
              else result = await withTimeout(recognizeImageWithOCRSpaceLocal(photoUri, apiKey), 25000);
            }
          } else {
            // subsequent attempts: preprocess then call base64 endpoint
            const pre = await preprocessAndGetBase64(photoUri);
            if (pre) result = await withTimeout(recognizeBase64WithOCRSpace(pre, apiKey), 25000);
            else result = await withTimeout(recognizeImageWithOCRSpaceLocal(photoUri, apiKey), 25000);
          }
        } catch (e: any) {
          console.warn(`OCR attempt ${attempts} failed`, e?.message || e);
          result = { success: false, errorMessage: e?.message || String(e), text: '' };
        }

        if (result && result.success && result.text && result.text.trim().length > 0) {
          break; // success
        }

        // small backoff before retrying
        if (attempts < maxAttempts) await new Promise(res => setTimeout(res, 600 * attempts));
      }

      setProcessing(false);

  const ocrText: string = (result && result.text) ? result.text : '';

      if (!ocrText || !ocrText.trim()) {
        Alert.alert(
          'No text found',
          'We could not detect text on the receipt after multiple attempts. Would you like to try again or enter details manually?',
          [
            { text: 'Retry', onPress: () => processReceiptHandler() },
            { text: 'Enter Manually', onPress: () => navigation.navigate('ReceiptDetails' as any, { receiptId: '', totalAmount: 0, date: new Date().toISOString(), image: photo }) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      const { parseAmountPreferKeywords } = await import('../services/receiptParser');
      const keywordAmount = parseAmountPreferKeywords(ocrText);
      const fallbackAmount = parseAmountFromOcrText(ocrText);
      const chosenAmount = keywordAmount != null ? keywordAmount : (fallbackAmount != null ? fallbackAmount : null);

      const scannedAt = new Date();

      const amountToPass = chosenAmount != null ? chosenAmount : 0;
      // Auto-save receipt to local DB and navigate to details with the saved id
      try {
        const createdId = await receiptService.create({
          user_id: userProfile?.uid || 'anon',
          image_uri: photoUri as string,
          total_amount: amountToPass,
          ocr_data: ocrText,
          synced: 0,
        });
        // update date_scanned to precise scannedAt
        await receiptService.update(Number(createdId), { date_scanned: scannedAt.toISOString() });
        navigation.navigate('ReceiptDetails' as any, {
          receiptId: String(createdId),
          totalAmount: amountToPass,
          date: scannedAt.toISOString(),
          image: photo,
        });
      } catch (e) {
        console.warn('Failed to save receipt', e);
        // fallback: still navigate to details allowing manual save
        navigation.navigate('ReceiptDetails' as any, {
          receiptId: '',
          totalAmount: amountToPass,
          date: scannedAt.toISOString(),
          image: photo,
        });
      }
    } catch (err: any) {
      setProcessing(false);
      console.error('OCR process error', err);
      Alert.alert('OCR Error', err.message || 'Failed to process receipt', [
        { text: 'Retry', onPress: () => processReceiptHandler() },
            { text: 'Enter Manually', onPress: () => navigation.navigate('ReceiptDetails' as any, { receiptId: '', totalAmount: 0, date: new Date().toISOString(), image: photo }) },
        { text: 'Cancel', style: 'cancel' },
      ]);
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
            styles.controls,
            {
              paddingHorizontal: contentHorizontalPadding,
              paddingVertical: isSmallPhone ? spacing.lg : spacing.xl,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
          >
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.black,
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
    marginBottom: spacing.lg,
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
    marginLeft: spacing.md,
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
});