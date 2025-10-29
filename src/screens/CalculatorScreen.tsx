import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography, sizes } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { useBreakpoint } from '../hooks/useBreakpoint';
import YearSelector from '../components/YearSelector';
import ScreenContainer from '../components/ScreenContainer';
import PageHeader from '../components/PageHeader';
import FormInput from '../components/FormInput';
import { formatCurrencyRounded } from '../utils/formatters';
import BackButton from '../components/BackButton';

export default function CalculatorScreen() {
  const navigation = useNavigation();
  const { contentHorizontalPadding, sectionVerticalSpacing, isSmallPhone } = useBreakpoint();
  // Use the shared contentHorizontalPadding so page side gutters stay consistent
  const sidePadding = contentHorizontalPadding;

  return (
    <ScreenContainer contentStyle={{ paddingVertical: sectionVerticalSpacing, paddingHorizontal: sidePadding }}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingHorizontal: sidePadding, paddingTop: 0, paddingBottom: sectionVerticalSpacing }]}>
        <PageHeader subtitle="Try different contributions and rates">
          <BackButton onPress={() => navigation.goBack()} />
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.titleLarge}>Compound Interest Calculator</Text>
          </View>
        </PageHeader>

        <CalculatorBody defaultContribution={25} defaultYears={5} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.lightGray },
  header: {
    backgroundColor: palette.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: palette.lightGray,
  },
  headerTitle: { ...typography.pageTitle, color: palette.black },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  content: { paddingHorizontal: 0, paddingBottom: spacing.xxl, flexGrow: 1 },
  // leave room for sticky footer
  contentWithFooter: { padding: spacing.lg, paddingBottom: spacing.xxl + 96, flexGrow: 1 },
  scrollView: { flex: 1 },
  footerClose: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    backgroundColor: palette.green,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  footerCloseText: { ...typography.bodyStrong, color: palette.white },
  /* calcContainer is the full-width, cardless wrapper for the calculator */
  calcContainer: {
    flex: 1,
    width: '100%',
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  titleBlock: {
    flexDirection: 'column',
    marginBottom: spacing.xl,
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
  titleLarge: {
    ...typography.pageTitle,
    color: palette.black,
  },
  subtitleLarge: {
    marginTop: spacing.sm,
    ...typography.pageSubtitle,
    color: palette.black,
    opacity: 0.7,
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
  formColStack: {
    width: '100%',
    minWidth: 0,
    marginRight: 0,
    marginBottom: spacing.lg,
  },
  formRowStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  label: {
    ...typography.overline,
    color: palette.black,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: palette.white,
    padding: spacing.md,
    borderRadius: radii.md,
    ...typography.body,
    color: palette.black,
    borderWidth: 1,
    borderColor: alpha.faintBlack,
  },
  rowButtons: { flexDirection: 'row', marginTop: spacing.md },
  smallButton: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.md, backgroundColor: 'transparent', marginRight: spacing.sm },
  smallButtonActive: { backgroundColor: palette.green },
  smallButtonText: { color: palette.black },
  smallButtonTextActive: { color: palette.white },
  yearButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: 'transparent', marginRight: spacing.xs, marginBottom: spacing.xs },
  yearButtonActive: { backgroundColor: palette.green },
  yearText: { ...typography.bodyStrong, color: palette.black },
  yearTextActive: { color: palette.white },
  yearSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs / 2,
    borderRadius: radii.pill,
  },
  yearSegmentActive: {
    backgroundColor: palette.green,
    shadowColor: palette.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  yearSegmentInactive: {
    backgroundColor: 'transparent',
  },
  yearTextInactive: {
    color: palette.black,
    opacity: 0.6,
  },
  rowButtonsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  presetButton: { padding: spacing.xs, marginRight: spacing.xs, borderRadius: radii.md, backgroundColor: alpha.faintBlack },
  presetButtonActive: { backgroundColor: palette.blue },
  presetText: { color: palette.black },
  presetTextActive: { color: palette.white },
  rateHint: { ...typography.caption, color: palette.black, opacity: 0.6, marginTop: spacing.xs },
  rateInputWrapper: { marginTop: spacing.sm },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, alignItems: 'center' },
  resultsRowStack: { flexDirection: 'column', alignItems: 'flex-start' },
  resultsCol: { flex: 1, alignItems: 'center', minWidth: 80 },
  resultsColStack: { alignItems: 'flex-start', marginBottom: spacing.md },
  resultLabel: { ...typography.caption, color: palette.black, opacity: 0.7 },
  resultValue: { ...typography.sectionTitle, color: palette.black, marginTop: spacing.xs },
  // disclaimer removed (calculator uses no bottom warning by design)
  card: {
    // kept for backwards compatibility with combinations; empty on purpose
  },
  backButton: {
    width: sizes.controlMd,
    height: sizes.controlMd,
    borderRadius: radii.pill,
    backgroundColor: palette.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerFixed: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    alignItems: 'center',
  },
  footerButton: {
    backgroundColor: palette.green,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.lg,
  },
  footerButtonText: { ...typography.bodyStrong, color: palette.white },
});

function CalculatorBody({ defaultContribution = 25, defaultYears = 5 }: { defaultContribution?: number; defaultYears?: number }) {
  const { isTablet, isSmallPhone } = useBreakpoint();
  const yearsOptions = [1, 3, 5, 10, 20];
  const [principalStr, setPrincipalStr] = useState<string>('0');
  const [contributionStr, setContributionStr] = useState<string>(String(defaultContribution));
  const [frequency, setFrequency] = useState<'monthly' | 'annually'>('monthly');
  const [years, setYears] = useState<number>(defaultYears);
  const [manualRateStr, setManualRateStr] = useState<string>('15');
  const [effectiveRate, setEffectiveRate] = useState<number>(Number(String(manualRateStr).replace(/,/g, '.')) / 100 || 0.15);

  const parseCurrency = (s: string) => {
    const cleaned = String(s).replace(/[^0-9.-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    const parsed = Number(String(manualRateStr).replace(/,/g, '.'));
    setEffectiveRate(Number.isFinite(parsed) ? parsed / 100 : 0);
  }, [manualRateStr]);

  const P = useMemo(() => parseCurrency(principalStr), [principalStr]);
  const PMT = useMemo(() => parseCurrency(contributionStr), [contributionStr]);
  const r = effectiveRate;
  const n = frequency === 'monthly' ? 12 : 1;
  const t = years;

  const { fvTotal, totalContrib, interestEarned } = useMemo(() => {
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

  // animate pill when years changes
  // Removed unused animation: the previous pill animation relied on
  // container dimensions that weren't set. Keeping UI simple and static.

  const cumulativePct = useMemo(() => {
    if (totalContrib <= 0) return 0;
    return (fvTotal / totalContrib - 1) * 100;
  }, [fvTotal, totalContrib]);

  const formatCurrency = (v: number) => formatCurrencyRounded(v);

  return (
    <View style={[styles.calcContainer]}>
      <View style={[styles.formRow, !isTablet && styles.formRowStack]}>
        <View style={[styles.formCol, !isTablet && styles.formColStack]}>
          <Text style={styles.label}>Principal (£)</Text>
          <FormInput
            keyboardType="decimal-pad"
            value={principalStr}
            onChangeText={setPrincipalStr}
            inputStyle={{ minHeight: 48 }}
            placeholder="0.00"
            selectionColor={palette.green}
          />

          <Text style={[styles.label, { marginTop: spacing.md }]}>Contribution (£)</Text>
          <FormInput
            keyboardType="decimal-pad"
            value={contributionStr}
            onChangeText={setContributionStr}
            inputStyle={{ minHeight: 48 }}
            placeholder="0.00"
            selectionColor={palette.green}
          />

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

        <View style={[styles.formCol, !isTablet && styles.formColStack]}>
          <Text style={styles.label}>Years</Text>
          <YearSelector options={yearsOptions} value={years} onChange={setYears} compact={isSmallPhone} />

          <Text style={[styles.label, { marginTop: spacing.md }]}>Rate (%)</Text>
          <View style={styles.rateInputWrapper}>
            <FormInput
              keyboardType="decimal-pad"
              value={manualRateStr}
              onChangeText={setManualRateStr}
              inputStyle={{ minHeight: 48 }}
              placeholder="12"
              selectionColor={palette.green}
            />
            <Text style={styles.rateHint}>Enter annual % (e.g. 12 for 12%)</Text>
          </View>
        </View>
      </View>

      {!isTablet && <View style={{ height: spacing.lg }} />}

      <View style={[styles.resultsRow, !isTablet && styles.resultsRowStack]}>
        <View style={[styles.resultsCol, !isTablet && styles.resultsColStack]}>
          <Text style={styles.resultLabel}>Future value</Text>
          <Text style={styles.resultValue}>{formatCurrency(fvTotal)}</Text>
        </View>

        <View style={[styles.resultsCol, !isTablet && styles.resultsColStack]}>
          <Text style={styles.resultLabel}>Total contributed</Text>
          <Text style={styles.resultValue}>{formatCurrency(totalContrib)}</Text>
        </View>

        <View style={[styles.resultsCol, !isTablet && styles.resultsColStack]}>
          <Text style={styles.resultLabel}>Interest earned</Text>
          <Text style={[styles.resultValue, { color: interestEarned >= 0 ? palette.green : palette.red }]}>{formatCurrency(interestEarned)}</Text>
        </View>

        <View style={[styles.resultsCol, !isTablet && styles.resultsColStack]}>
          <Text style={styles.resultLabel}>Cumulative return</Text>
          <Text style={[styles.resultValue, { color: cumulativePct >= 0 ? palette.green : palette.red }]}>{cumulativePct.toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  );
}
