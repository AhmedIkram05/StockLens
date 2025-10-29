import React, { useRef, useEffect, useState, Dispatch, SetStateAction } from 'react';
import { View, TouchableOpacity, Text, Animated, ViewStyle, StyleProp } from 'react-native';
import { spacing, typography, radii, shadows } from '../styles/theme';
import { palette, alpha } from '../styles/palette';

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
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
  if (!measured) return;
    const width = containerWidthRef.current;
    const pad = spacing.xs;
    const totalMargins = spacing.xs * options.length;
    const segmentWidth = (width - pad * 2 - totalMargins) / options.length;
    const idx = options.indexOf(value);
    if (idx < 0) return;
    const target = idx * (segmentWidth + spacing.xs) + pad;
    Animated.timing(animatedX, { toValue: target, duration: 220, useNativeDriver: true }).start();
  }, [value]);

  const pad = spacing.xs;
  const segPadVert = compact ? spacing.xs : spacing.sm;
  const width = containerWidthRef.current;
  const totalMargins = spacing.xs * options.length;
  const segmentWidth = width > 0 ? (width - pad * 2 - totalMargins) / options.length : 0;
  const height = Math.max(compact ? 28 : 32, containerHeightRef.current - pad * 2);

  return (
    <View
      style={[{ flexDirection: 'row', borderRadius: radii.pill, backgroundColor: alpha.faintBlack, padding: pad, alignItems: 'center' }, style]}
      onLayout={e => {
        const { width: w, height: h } = e.nativeEvent.layout;
        containerWidthRef.current = w;
        containerHeightRef.current = h;
        const idx = options.indexOf(value);
        if (w > 0 && idx >= 0) {
          const padInner = spacing.xs;
          const totalMarginsInner = spacing.xs * options.length;
          const segmentWidthInner = (w - padInner * 2 - totalMarginsInner) / options.length;
          const target = idx * (segmentWidthInner + spacing.xs) + padInner;
          animatedX.setValue(target);
          setMeasured(true);
        }
      }}
    >
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
          opacity: measured ? 1 : 0,
        }}
      />

      {options.map(o => (
        <TouchableOpacity
          key={o}
          onPress={() => {
            // call either dispatcher or callback
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - call signature can be a dispatcher or callback
            onChange(o);
          }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: segPadVert, marginHorizontal: spacing.xs / 2 }}
        >
          <Text style={[typography.captionStrong, { color: o === value ? palette.white : palette.black, opacity: o === value ? 1 : 0.8 }]}>{o}Y</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
