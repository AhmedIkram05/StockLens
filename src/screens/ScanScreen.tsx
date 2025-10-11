import React, { useState, useRef } from 'react';
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

export default function ScanScreen() {
  const facing: CameraType = 'back';
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
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
          base64: false,
        });
        setPhoto(photo.uri);
        Alert.alert('Success', 'Receipt captured! Processing...');
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
          <View style={styles.previewButtons}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.processButton} onPress={() => {
              Alert.alert('Processing', 'Receipt analysis will be implemented here');
            }}>
              <Text style={styles.processButtonText}>Process Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
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
          <View style={styles.scanFrame} />
          <Text style={styles.instructionText}>
            Position receipt within the frame
          </Text>
        </View>

        <View style={styles.controls}>
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
});