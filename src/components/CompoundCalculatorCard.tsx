import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { palette, alpha } from '../styles/palette';
import { radii, shadows, spacing, typography } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { PREFETCH_TICKERS } from '../services/dataService';
import { PRESET_RATES, computeCAGRFromSeries } from '../services/projectionService';
import { alphaVantageService } from '../services/alphaVantageService';

type Frequency = 'monthly' | 'annually';

export default function CompoundCalculatorCard({ defaultContribution = 25, defaultYears = 5 }: { defaultContribution?: number; defaultYears?: number }) {
  const { isTablet } = useBreakpoint();
  const [principalStr, setPrincipalStr] = useState<string>('0');
  const [contributionStr, setContributionStr] = useState<string>(String(defaultContribution));
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [years, setYears] = useState<number>(defaultYears);
  const [rateSource, setRateSource] = useState<'manual' | 'preset'>('preset');
  const [manualRateStr, setManualRateStr] = useState<string>('15');
  const [selectedTicker, setSelectedTicker] = useState<string>(PREFETCH_TICKERS[0]);
  const [effectiveRate, setEffectiveRate] = useState<number>(PRESET_RATES[PREFETCH_TICKERS[0]] ?? 0.15);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);

  // parse helpers
  const parseCurrency = (s: string) => {
    const cleaned = String(s).replace(/[^0-9.-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  // try to get cached historical rate for selectedTicker for `years` using cached monthly series only
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (rateSource !== 'preset') return;
      try {
        const series = await alphaVantageService.getCachedMonthlyAdjusted(selectedTicker);
        if (!mounted) return;
        if (!series || series.length < 2) {
          setEffectiveRate(PRESET_RATES[selectedTicker] ?? 0.15);
          setUsingFallback(true);
          return;
        }
        // slice last `years * 12` months if available, else use full series
        const monthsNeeded = Math.max(12 * years, 12);
        const slice = series.slice(Math.max(0, series.length - monthsNeeded));
        const rate = computeCAGRFromSeries(slice as any) ?? (PRESET_RATES[selectedTicker] ?? 0.15);
        setEffectiveRate(rate ?? (PRESET_RATES[selectedTicker] ?? 0.15));
        setUsingFallback(rate === null);
      } catch (e) {
        setEffectiveRate(PRESET_RATES[selectedTicker] ?? 0.15);
        setUsingFallback(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedTicker, years, rateSource]);

  // manual rate watcher
  useEffect(() => {
    if (rateSource === 'manual') {
      const parsed = Number(String(manualRateStr).replace(/,/g, '.'));
      setEffectiveRate(Number.isFinite(parsed) ? parsed / 100 : 0);
      setUsingFallback(false);
    }
  }, [manualRateStr, rateSource]);

  const P = useMemo(() => parseCurrency(principalStr), [principalStr]);
  const PMT = useMemo(() => parseCurrency(contributionStr), [contributionStr]);
  const r = useMemo(() => (rateSource === 'manual' ? effectiveRate : effectiveRate), [effectiveRate, rateSource]);
  const n = frequency === 'monthly' ? 12 : 1;
  const t = years;

  // compute future value
  const { fvTotal, totalContrib, interestEarned } = useMemo(() => {
    // handle zero rate specially
    if (r === 0) {
      const fvLump = P;
      const fvContrib = PMT * n * t;
      const fv = fvLump + fvContrib;
      return { fvTotal: fv, totalContrib: P + fvContrib, interestEarned: fv - (P + fvContrib) };
    }
    const periodicRate = r / n;
    const fvLump = P * Math.pow(1 + periodicRate, n * t);
    const fvContrib = PMT * ((Math.pow(1 + periodicRate, n * t) - 1) / periodicRate);
    const fv = fvLump + fvContrib;
    const totalContrib = P + PMT * n * t;
    const interest = fv - totalContrib;
    return { fvTotal: fv, totalContrib, interestEarned: interest };
  }, [P, PMT, r, n, t]);

  const cumulativePct = useMemo(() => {
    if (totalContrib <= 0) return 0;
    return (fvTotal / totalContrib - 1) * 100;
  }, [fvTotal, totalContrib]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(Math.round(v));

  return (
    <View style={[styles.card, styles.container, shadows.level2]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Compound interest calculator</Text>
        <Text style={styles.subtitle}>Try different contributions and rates</Text>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formCol}>
          <Text style={styles.label}>Principal (£)</Text>
          <TextInput keyboardType="decimal-pad" value={principalStr} onChangeText={setPrincipalStr} style={styles.input} />

          <Text style={[styles.label, { marginTop: spacing.md }]}>Contribution (£)</Text>
          <TextInput keyboardType="decimal-pad" value={contributionStr} onChangeText={setContributionStr} style={styles.input} />

          <Text style={[styles.label, { marginTop: spacing.md }]}>Frequency</Text>
          <View style={styles.rowButtons}>
            <TouchableOpacity onPress={() => setFrequency('monthly')} style={[styles.smallButton, frequency === 'monthly' && styles.smallButtonActive]}>
              <Text style={[styles.smallButtonText, frequency === 'monthly' && styles.smallButtonTextActive]}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFrequency('annually')} style={[styles.smallButton, frequency === 'annually' && styles.smallButtonActive]}>
              <Text style={[styles.smallButtonText, frequency === 'annually' && styles.smallButtonTextActive]}>Annually</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formCol}>
          <Text style={styles.label}>Years</Text>
          <View style={styles.rowButtons}>
            {[1, 3, 5, 10, 20].map(y => (
              <TouchableOpacity key={y} onPress={() => setYears(y)} style={[styles.yearButton, years === y && styles.yearButtonActive]}>
                <Text style={[styles.yearText, years === y && styles.yearTextActive]}>{y}Y</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: spacing.md }]}>Rate source</Text>
          <View style={styles.rowButtons}>
            <TouchableOpacity onPress={() => setRateSource('preset')} style={[styles.smallButton, rateSource === 'preset' && styles.smallButtonActive]}>
              <Text style={[styles.smallButtonText, rateSource === 'preset' && styles.smallButtonTextActive]}>Preset</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRateSource('manual')} style={[styles.smallButton, rateSource === 'manual' && styles.smallButtonActive]}>
              <Text style={[styles.smallButtonText, rateSource === 'manual' && styles.smallButtonTextActive]}>Manual</Text>
            </TouchableOpacity>
          </View>

          {rateSource === 'preset' ? (
            <View style={{ marginTop: spacing.sm }}>
              <View style={styles.rowButtonsWrap}>
                {PREFETCH_TICKERS.map(t => (
                  <TouchableOpacity key={t} onPress={() => setSelectedTicker(t)} style={[styles.presetButton, selectedTicker === t && styles.presetButtonActive]}>
                    <Text style={[styles.presetText, selectedTicker === t && styles.presetTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.rateHint}>Effective rate: {(effectiveRate * 100).toFixed(2)}% {usingFallback ? '(fallback)' : ''}</Text>
            </View>
          ) : (
            <View style={{ marginTop: spacing.sm }}>
              <TextInput keyboardType="decimal-pad" value={manualRateStr} onChangeText={setManualRateStr} style={styles.input} />
              <Text style={styles.rateHint}>Enter annual % (e.g. 12 for 12%)</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.resultsRow}>
        <View style={styles.resultsCol}>
          <Text style={styles.resultLabel}>Future value</Text>
          <Text style={styles.resultValue}>{formatCurrency(fvTotal)}</Text>
        </View>

        <View style={styles.resultsCol}>
          <Text style={styles.resultLabel}>Total contributed</Text>
          <Text style={[styles.resultValue, { fontSize: 16 }]}>{formatCurrency(totalContrib)}</Text>
        </View>

        <View style={styles.resultsCol}>
          <Text style={styles.resultLabel}>Interest earned</Text>
          <Text style={[styles.resultValue, { color: interestEarned >= 0 ? palette.green : palette.red }]}>{formatCurrency(interestEarned)}</Text>
        </View>

        <View style={styles.resultsCol}>
          <Text style={styles.resultLabel}>Cumulative return</Text>
          <Text style={[styles.resultValue, { color: cumulativePct >= 0 ? palette.green : palette.red }]}>{cumulativePct.toFixed(1)}%</Text>
        </View>
      </View>

      <Text style={styles.disclaimer}>Hypothetical projections only. Not financial advice.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerRow: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.bodyStrong,
    color: palette.black,
  },
  subtitle: {
    ...typography.caption,
    color: palette.black,
    opacity: 0.6,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  formCol: {
    flex: 1,
    minWidth: 140,
    marginRight: spacing.md,
  },
  label: {
    ...typography.overline,
    color: palette.black,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: palette.lightGray,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  rowButtons: { flexDirection: 'row', marginTop: spacing.sm },
  smallButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: 'transparent', marginRight: spacing.sm },
  smallButtonActive: { backgroundColor: palette.green },
  smallButtonText: { color: palette.black },
  smallButtonTextActive: { color: palette.white },
  yearButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radii.pill, backgroundColor: 'transparent', marginRight: spacing.xs, marginBottom: spacing.xs },
  yearButtonActive: { backgroundColor: palette.green },
  yearText: { ...typography.captionStrong, color: palette.black },
  yearTextActive: { color: palette.white },
  rowButtonsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  presetButton: { padding: spacing.xs, marginRight: spacing.xs, borderRadius: radii.md, backgroundColor: alpha.faintBlack },
  presetButtonActive: { backgroundColor: palette.blue },
  presetText: { color: palette.black },
  presetTextActive: { color: palette.white },
  rateHint: { ...typography.caption, color: palette.black, opacity: 0.6, marginTop: spacing.xs },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, alignItems: 'center' },
  resultsCol: { flex: 1, alignItems: 'center' },
  resultLabel: { ...typography.caption, color: palette.black, opacity: 0.7 },
  resultValue: { ...typography.bodyStrong, color: palette.black, marginTop: spacing.xs },
  disclaimer: { marginTop: spacing.md, ...typography.caption, color: palette.black, opacity: 0.6 },
  card: {},
});
