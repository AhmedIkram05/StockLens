import React, { useRef, useEffect, Dispatch, SetStateAction } from 'react';
import { View, TouchableOpacity, Text, Animated, ViewStyle, StyleProp } from 'react-native';
import { spacing } from '../styles/theme';
import { palette, alpha } from '../styles/palette';
import { radii, shadows } from '../styles/theme';

type Props<T extends number> = {
  options: T[];
  value: T;
  // accept either a simple callback or a React setState dispatcher (common caller pattern)
  onChange: ((v: T) => void) | Dispatch<SetStateAction<T>>;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function YearSelector<T extends number = number>({ options, value, onChange, compact = false, style }: Props<T>) {
  const containerWidthRef = useRef<number>(0);
  const containerHeightRef = useRef<number>(0);
  const animatedX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (containerWidthRef.current <= 0) return;
    const width = containerWidthRef.current;
    const pad = spacing.xs;
    const totalMargins = spacing.xs * options.length;
    const segmentWidth = (width - pad * 2 - totalMargins) / options.length;
    const idx = options.indexOf(value);
    if (idx < 0) return;
    const target = idx * (segmentWidth + spacing.xs) + pad;
    Animated.timing(animatedX, { toValue: target, duration: 220, useNativeDriver: true }).start();
  }, [value]);

  return (
    <View
      style={[{ flexDirection: 'row', borderRadius: radii.pill, backgroundColor: alpha.faintBlack, padding: spacing.xs, alignItems: 'center' }, style]}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        containerWidthRef.current = width;
        containerHeightRef.current = height;
        const idx = options.indexOf(value);
        if (width > 0 && idx >= 0) {
          const pad = spacing.xs;
          const totalMargins = spacing.xs * options.length;
          const segmentWidth = (width - pad * 2 - totalMargins) / options.length;
          const target = idx * (segmentWidth + spacing.xs) + pad;
          animatedX.setValue(target);
        }
      }}
    >
      {containerWidthRef.current > 0 && (() => {
        const width = containerWidthRef.current;
        const pad = spacing.xs;
        const totalMargins = spacing.xs * options.length;
        const segmentWidth = (width - pad * 2 - totalMargins) / options.length;
        const height = Math.max(32, containerHeightRef.current - pad * 2);
        return (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              top: pad,
              width: segmentWidth,
              height,
              borderRadius: radii.pill,
              backgroundColor: palette.green,
              shadowColor: palette.green,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 2,
              transform: [{ translateX: animatedX }],
            }}
          />
        );
      })()}

      {options.map(o => (
        <TouchableOpacity
          key={o}
          onPress={() => {
            // call either dispatcher or callback
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - call signature can be a dispatcher or callback
            onChange(o);
          }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, marginHorizontal: spacing.xs / 2 }}
        >
          <Text style={{ color: o === value ? '#fff' : '#000', fontWeight: '600' }}>{o}Y</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
