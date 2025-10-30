import React, { useMemo, useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { palette } from '../styles/palette';
import { useTheme } from '../contexts/ThemeContext';

type OHLC = { open: number; high: number; low: number; close: number };

type Props = {
  width: number;
  height: number;
  count?: number;
  leftPad?: number; // set to 0 to align first candle flush with left edge
  rightPad?: number; // set to 0 to align last candle flush with right edge
};

const makeOHLCSeries = (count: number, start = 100) => {
  const res: OHLC[] = [];
  let prevClose = start;
  const majorSwings = Math.max(3, Math.round(count / 6));
  const phase = Math.random() * Math.PI * 2;

  for (let i = 0; i < count; i++) {
    const open = prevClose;
    const progress = i / Math.max(1, count - 1);
    const baselineUp = progress * (Math.random() * 8 + 6);
    const major = Math.sin(progress * Math.PI * majorSwings + phase) * (8 + Math.random() * 10);
    const micro = (Math.sin(progress * Math.PI * 2.3) + Math.sin(progress * Math.PI * 4.6) * 0.5) * (4 + Math.random() * 6);
    const shock = Math.random() < 0.12 ? -(6 + Math.random() * 22) : 0;
    const delta = baselineUp * 0.6 + major + micro + shock + (Math.random() - 0.5) * 4;
    const close = Math.max(1, open + delta);
    const high = Math.max(open, close) + Math.random() * (6 + Math.random() * 8);
    const low = Math.min(open, close) - Math.random() * (6 + Math.random() * 8);
    res.push({ open, high, low, close });
    prevClose = close;
  }
  return res;
};

export default function OnboardingCandles({ width, height, count = 14, leftPad = 0, rightPad = 0 }: Props) {
  const data = useMemo(() => makeOHLCSeries(count, 90), [count]);
  const { theme, isDark } = useTheme();

  const progresses = useRef<Animated.Value[]>(Array.from({ length: count }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = progresses.map((p, idx) =>
      Animated.timing(p, {
        toValue: 1,
        duration: 700,
        delay: idx * 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    );
    Animated.stagger(60, animations).start();
  }, [progresses]);

  const values = data.flatMap((d) => [d.high, d.low, d.open, d.close]);
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const pad = 10;
  const usableH = Math.max(40, height - pad * 2);

  const valueToY = (v: number) => {
    if (vMax === vMin) return pad + usableH / 2;
    const t = (v - vMin) / (vMax - vMin);
    return pad + (1 - t) * usableH;
  };

  const approxStep = count > 1 ? width / (count - 1) : width;
  const approxBody = Math.max(8, Math.min(approxStep * 0.64, 36));

  let bodyWidth: number;
  let step: number;
  let computeXCenter: (i: number) => number;

  if (leftPad === 0 && rightPad === 0) {
    const maxBody = Math.max(8, Math.min(approxStep * 0.64, 36));
    const maxPer = Math.floor(width / Math.max(1, count));
    bodyWidth = Math.max(6, Math.min(maxBody, Math.floor(maxPer * 0.85)));
    step = count > 1 ? (width - bodyWidth) / (count - 1) : width - bodyWidth;
    computeXCenter = (i: number) => step * i + bodyWidth / 2;
  } else {
    const minSidePad = Math.ceil(approxBody / 2) + 2;
    const effectiveLeftPad = Math.max(0, leftPad ?? 0, minSidePad);
    const effectiveRightPad = Math.max(typeof rightPad === 'number' ? rightPad : minSidePad, minSidePad);
    const availableW = Math.max(40, width - effectiveLeftPad - effectiveRightPad);

    let estStep = count > 1 ? availableW / (count - 1) : availableW;
    let estBody = Math.max(8, Math.min(estStep * 0.64, 36));
    if (count > 1) {
      const refined = Math.max(6, (availableW - estBody) / (count - 1));
      estStep = refined;
      estBody = Math.max(8, Math.min(estStep * 0.64, 36));
    }

    step = estStep;
    bodyWidth = estBody;
    computeXCenter = (i: number) => effectiveLeftPad + bodyWidth / 2 + step * i;
  }

  const AnimatedRect: any = Animated.createAnimatedComponent(Rect as any);
  const AnimatedLine: any = Animated.createAnimatedComponent(Line as any);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const p = progresses[i];
        const xCenter = computeXCenter(i);
        const x = xCenter - bodyWidth / 2;

        const yOpen = valueToY(d.open);
        const yClose = valueToY(d.close);
        const yHigh = valueToY(d.high);
        const yLow = valueToY(d.low);

        const isUp = d.close >= d.open;
        const fill = isUp ? palette.green : palette.red;
        const stroke = isDark ? '#ffffff6e' : '#00000014';

        const bodyY = Math.min(yOpen, yClose);
        const bodyH = Math.max(1, Math.abs(yClose - yOpen));

        const animY = p.interpolate({ inputRange: [0, 1], outputRange: [pad + usableH, bodyY] }) as any;
        const animH = p.interpolate({ inputRange: [0, 1], outputRange: [0, bodyH] }) as any;
        const animHigh = p.interpolate({ inputRange: [0, 1], outputRange: [pad + usableH, yHigh] }) as any;
        const animLow = p.interpolate({ inputRange: [0, 1], outputRange: [pad + usableH, yLow] }) as any;

        return (
          <React.Fragment key={`c-${i}`}>
            <AnimatedLine
              x1={xCenter}
              x2={xCenter}
              y1={animHigh}
              y2={animLow}
              stroke={stroke}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.95}
            />

            <AnimatedRect
              x={x}
              y={animY}
              width={bodyWidth}
              height={animH}
              fill={fill}
              stroke={palette.black}
              strokeOpacity={0.06}
              rx={2}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
