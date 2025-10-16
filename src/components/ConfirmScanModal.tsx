import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { palette, alpha } from '../styles/palette';
import { spacing, radii, typography } from '../styles/theme';

type Props = {
  visible: boolean;
  scannedTotal?: number | string;
  onConfirm: () => void;
  onRescan: () => void;
  onManual: (value: number) => void;
  onClose?: () => void;
};

export default function ConfirmScanModal({ visible, scannedTotal, onConfirm, onRescan, onManual, onClose }: Props) {
  const [manualStr, setManualStr] = useState<string>('');

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Scan detected</Text>
          <Text style={styles.subtitle}>Scanned total: {scannedTotal ?? '—'}</Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.primary} onPress={onConfirm} accessibilityRole="button">
              <Text style={styles.primaryText}>Yes, it's correct</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghost} onPress={onRescan} accessibilityRole="button">
              <Text style={styles.ghostText}>Rescan</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ ...typography.overline, marginTop: spacing.md }}>Enter manually</Text>
          <TextInput value={manualStr} onChangeText={setManualStr} keyboardType="decimal-pad" placeholder="0.00" style={styles.input} />
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.primary, { flex: 1 }]}
              onPress={() => {
                const cleaned = String(manualStr).replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
                const parsed = Number(cleaned);
                if (Number.isFinite(parsed) && parsed > 0) {
                  onManual(parsed);
                }
              }}
            >
              <Text style={styles.primaryText}>Use manual value</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.ghost, { marginLeft: spacing.md }]} onPress={onClose}>
              <Text style={styles.ghostText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  card: { width: '90%', backgroundColor: '#fff', borderRadius: radii.md, padding: spacing.lg },
  title: { ...typography.pageTitle, color: palette.black },
  subtitle: { ...typography.body, color: palette.black, marginTop: spacing.xs },
  row: { flexDirection: 'row', marginTop: spacing.md, alignItems: 'center' },
  primary: { backgroundColor: palette.green, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.md },
  primaryText: { color: '#fff', fontWeight: '600' },
  ghost: { borderWidth: 1, borderColor: alpha.faintBlack || '#ddd', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.md, marginLeft: spacing.xs },
  ghostText: { color: palette.black },
  input: { backgroundColor: palette.white, padding: spacing.md, borderRadius: radii.md, marginTop: spacing.xs },
});
