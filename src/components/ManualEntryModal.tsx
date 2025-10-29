import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography, shadows } from '../styles/theme';

type Props = {
  visible: boolean;
  value: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  placeholder?: string;
};

export default function ManualEntryModal({ visible, value, onChange, onCancel, onConfirm, placeholder = '0.00' }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Manual entry</Text>
          <Text style={styles.subtitle}>Enter the total amount</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
          />

          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.confirm]} onPress={onConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: alpha.overlayBlack, justifyContent: 'center', alignItems: 'center' },
  card: { width: '86%', backgroundColor: palette.white, borderRadius: radii.md, padding: spacing.lg, ...shadows.level2 },
  title: { ...typography.bodyStrong, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: alpha.subtleBlack, marginBottom: spacing.md },
  input: { backgroundColor: palette.lightGray, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'flex-end' },
  btn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.md, marginLeft: spacing.sm },
  cancel: { backgroundColor: palette.lightGray },
  confirm: { backgroundColor: palette.green },
  cancelText: { color: palette.black },
  confirmText: { color: palette.white },
});
