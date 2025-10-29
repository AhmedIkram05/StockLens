import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

export function Row(props: ViewProps) {
  return <View {...props} style={[styles.row, props.style]} />;
}

export function Column(props: ViewProps) {
  return <View {...props} style={[styles.column, props.style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  column: { flexDirection: 'column' },
});

export default { Row, Column };
