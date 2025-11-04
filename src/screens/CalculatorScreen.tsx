import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native';
import { palette, alpha } from '../styles/palette';
import { radii, spacing, typography, sizes } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { useBreakpoint } from '../hooks/useBreakpoint';
import ScreenContainer from '../components/ScreenContainer';
import PageHeader from '../components/PageHeader';
import FormInput from '../components/FormInput';
import { formatCurrencyRounded } from '../utils/formatters';
import BackButton from '../components/BackButton';
import { useTheme } from '../contexts/ThemeContext';

export default function CalculatorScreen() {
  const navigation = useNavigation();
  const { contentHorizontalPadding, sectionVerticalSpacing, isSmallPhone } = useBreakpoint();
  const { theme } = useTheme();
  // Use the shared contentHorizontalPadding so page side gutters stay consistent
  const sidePadding = contentHorizontalPadding;

  return (
    <ScreenContainer contentStyle={{ paddingVertical: sectionVerticalSpacing, paddingHorizontal: sidePadding }}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingHorizontal: sidePadding, paddingTop: 0, paddingBottom: sectionVerticalSpacing }]}>
        <PageHeader subtitle="Try different contributions and rates">
          <BackButton onPress={() => navigation.goBack()} />
          <View style={{ marginTop: spacing.md }}>
            <Text style={[styles.titleLarge, { color: theme.text }]}>Compound Interest Calculator</Text>
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
  headerTitle: { ...typography.pageTitle },
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
  },
  subtitle: {
    ...typography.caption,
    opacity: 0.6,
  },
  titleLarge: {
    ...typography.pageTitle,
  },
  subtitleLarge: {
    marginTop: spacing.sm,
    ...typography.pageSubtitle,
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
    ...typography.captionStrong,
    marginBottom: spacing.xs,
  },
  formSection: {
    marginTop: spacing.lg,
  },
  rowButtons: { flexDirection: 'row' },
  smallButton: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.md, backgroundColor: 'transparent', marginRight: spacing.sm },
  smallButtonActive: { backgroundColor: palette.green },
  smallButtonText: { },
  smallButtonTextActive: { color: palette.white },
  yearButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: 'transparent', marginRight: spacing.xs, marginBottom: spacing.xs },
  yearButtonActive: { backgroundColor: palette.green },
  yearText: { ...typography.bodyStrong },
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
    opacity: 0.6,
  },
  rowButtonsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  presetButton: { padding: spacing.xs, marginRight: spacing.xs, borderRadius: radii.md, backgroundColor: alpha.faintBlack },
  presetButtonActive: { backgroundColor: palette.blue },
  presetText: { },
  presetTextActive: { color: palette.white },
  rateHint: { ...typography.caption },
  rateInputWrapper: {},
  timeInputRow: { flexDirection: 'row', gap: spacing.md },
  timeInputCol: { flex: 1 },
  timeLabel: { ...typography.caption, marginBottom: spacing.xs },
  resultsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, alignItems: 'center' },
  resultsRowStack: { flexDirection: 'column', alignItems: 'flex-start' },
  resultsCol: { flex: 1, alignItems: 'center', minWidth: 80 },
  resultsColStack: { alignItems: 'flex-start', marginBottom: spacing.md },
  resultLabel: { ...typography.caption },
  resultValue: { ...typography.sectionTitle, marginTop: spacing.xs },
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
  const { theme } = useTheme();
  
  // State for all inputs
  const [initialInvestmentStr, setInitialInvestmentStr] = useState<string>('0');
  const [interestRateStr, setInterestRateStr] = useState<string>('15');
  const [compoundFrequency, setCompoundFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'>('monthly');
  const [yearsStr, setYearsStr] = useState<string>(String(defaultYears));
  const [monthsStr, setMonthsStr] = useState<string>('0');
  const [contributionStr, setContributionStr] = useState<string>(String(defaultContribution));
  const [contributionFrequency, setContributionFrequency] = useState<'weekly' | 'biweekly' | 'monthly' | 'annually'>('monthly');

  const parseCurrency = (s: string) => {
    const cleaned = String(s).replace(/[^0-9.-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const parseNumber = (s: string) => {
    const cleaned = String(s).replace(/[^0-9.-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  // Parse all inputs
  const P = useMemo(() => parseCurrency(initialInvestmentStr), [initialInvestmentStr]);
  const annualRate = useMemo(() => parseNumber(interestRateStr) / 100, [interestRateStr]);
  const years = useMemo(() => parseNumber(yearsStr), [yearsStr]);
  const months = useMemo(() => parseNumber(monthsStr), [monthsStr]);
  const totalTime = years + months / 12;
  const PMT = useMemo(() => parseCurrency(contributionStr), [contributionStr]);

  // Compound frequency (n = times compounded per year)
  const n = compoundFrequency === 'daily' ? 365 : 
            compoundFrequency === 'weekly' ? 52 : 
            compoundFrequency === 'monthly' ? 12 : 
            compoundFrequency === 'quarterly' ? 4 : 1;

  // Contribution frequency (p = payments per year)
  const p = contributionFrequency === 'weekly' ? 52 : 
            contributionFrequency === 'biweekly' ? 26 : 
            contributionFrequency === 'monthly' ? 12 : 1;

  const { fvTotal, totalContrib, interestEarned } = useMemo(() => {
    if (totalTime <= 0) {
      return { fvTotal: P, totalContrib: P, interestEarned: 0 };
    }

    if (annualRate === 0) {
      const fvLump = P;
      const fvContrib = PMT * p * totalTime;
      const fv = fvLump + fvContrib;
      return { fvTotal: fv, totalContrib: P + fvContrib, interestEarned: 0 };
    }

    // Compound interest formula with regular contributions
    // FV = P(1 + r/n)^(nt) + PMT × [((1 + r/n)^(nt) - 1) / (r/n)] × (1 + r/n)^((n-p)/n)
    const periodicRate = annualRate / n;
    const nt = n * totalTime;
    
    // Future value of initial investment
    const fvLump = P * Math.pow(1 + periodicRate, nt);
    
    // Future value of contributions
    // Adjust for contribution frequency vs compound frequency
    let fvContrib = 0;
    if (p === n) {
      // Same frequency: standard formula
      fvContrib = PMT * ((Math.pow(1 + periodicRate, nt) - 1) / periodicRate);
    } else {
      // Different frequencies: adjust by converting contribution periods
      const contributionPeriodicRate = annualRate / p;
      const pt = p * totalTime;
      fvContrib = PMT * ((Math.pow(1 + contributionPeriodicRate, pt) - 1) / contributionPeriodicRate);
      // Adjust for compounding frequency difference
      const adjustmentFactor = Math.pow(1 + periodicRate, nt) / Math.pow(1 + contributionPeriodicRate, pt);
      fvContrib *= adjustmentFactor;
    }
    
    const fv = fvLump + fvContrib;
    const totalContrib = P + PMT * p * totalTime;
    const interest = fv - totalContrib;
    
    return { fvTotal: fv, totalContrib, interestEarned: interest };
  }, [P, PMT, annualRate, n, p, totalTime]);

  const cumulativePct = useMemo(() => {
    if (totalContrib <= 0) return 0;
    return (fvTotal / totalContrib - 1) * 100;
  }, [fvTotal, totalContrib]);

  const formatCurrency = (v: number) => formatCurrencyRounded(v);

  return (
    <View style={[styles.calcContainer]}>
      <View style={[styles.formRow, !isTablet && styles.formRowStack]}>
        <View style={[styles.formCol, !isTablet && styles.formColStack]}>
          <Text style={[styles.label, { color: theme.text }]}>Initial Investment (£)</Text>
          <FormInput
            keyboardType="decimal-pad"
            value={initialInvestmentStr}
            onChangeText={setInitialInvestmentStr}
            inputStyle={{ minHeight: 48 }}
            placeholder="0.00"
            selectionColor={palette.green}
          />

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.text }]}>Interest Rate (% per year)</Text>
            <FormInput
              keyboardType="decimal-pad"
              value={interestRateStr}
              onChangeText={setInterestRateStr}
              inputStyle={{ minHeight: 48 }}
              placeholder="15"
              selectionColor={palette.green}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.text }]}>Compound Frequency</Text>
            <View style={styles.rowButtons}>
              <TouchableOpacity onPress={() => setCompoundFrequency('daily')} style={[styles.smallButton, compoundFrequency === 'daily' && styles.smallButtonActive]}>
                <Text style={[styles.smallButtonText, { color: compoundFrequency === 'daily' ? palette.white : theme.text }, compoundFrequency === 'daily' && styles.smallButtonTextActive]}>Daily</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCompoundFrequency('weekly')} style={[styles.smallButton, compoundFrequency === 'weekly' && styles.smallButtonActive]}>
                <Text style={[styles.smallButtonText, { color: compoundFrequency === 'weekly' ? palette.white : theme.text }, compoundFrequency === 'weekly' && styles.smallButtonTextActive]}>Weekly</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCompoundFrequency('monthly')} style={[styles.smallButton, compoundFrequency === 'monthly' && styles.smallButtonActive]}>
                <Text style={[styles.smallButtonText, { color: compoundFrequency === 'monthly' ? palette.white : theme.text }, compoundFrequency === 'monthly' && styles.smallButtonTextActive]}>Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCompoundFrequency('quarterly')} style={[styles.smallButton, compoundFrequency === 'quarterly' && styles.smallButtonActive]}>
                <Text style={[styles.smallButtonText, { color: compoundFrequency === 'quarterly' ? palette.white : theme.text }, compoundFrequency === 'quarterly' && styles.smallButtonTextActive]}>Quarterly</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCompoundFrequency('annually')} style={[styles.smallButton, compoundFrequency === 'annually' && styles.smallButtonActive]}>
                <Text style={[styles.smallButtonText, { color: compoundFrequency === 'annually' ? palette.white : theme.text }, compoundFrequency === 'annually' && styles.smallButtonTextActive]}>Annually</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.formCol, !isTablet && styles.formColStack]}>
          <Text style={[styles.label, { color: theme.text }]}>Time Period</Text>
          <View style={styles.timeInputRow}>
            <View style={styles.timeInputCol}>
              <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Years</Text>
              <FormInput
                keyboardType="number-pad"
                value={yearsStr}
                onChangeText={setYearsStr}
                inputStyle={{ minHeight: 48 }}
                placeholder="0"
                selectionColor={palette.green}
              />
            </View>
            <View style={styles.timeInputCol}>
              <Text style={[styles.timeLabel, { color: theme.textSecondary }]}>Months</Text>
              <FormInput
                keyboardType="number-pad"
                value={monthsStr}
                onChangeText={setMonthsStr}
                inputStyle={{ minHeight: 48 }}
                placeholder="0"
                selectionColor={palette.green}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.text }]}>Regular Contribution (£)</Text>
            <FormInput
              keyboardType="decimal-pad"
              value={contributionStr}
              onChangeText={setContributionStr}
              inputStyle={{ minHeight: 48 }}
              placeholder="0.00"
              selectionColor={palette.green}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.text }]}>Contribution Frequency</Text>
            <View style={styles.rowButtons}>
              <TouchableOpacity onPress={() => setContributionFrequency('weekly')} style={[styles.smallButton, contributionFrequency === 'weekly' && styles.smallButtonActive]}>
                <Text style={[styles.smallButtonText, { color: contributionFrequency === 'weekly' ? palette.white : theme.text }, contributionFrequency === 'weekly' && styles.smallButtonTextActive]}>Weekly</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setContributionFrequency('biweekly')} style={[styles.smallButton, contributionFrequency === 'biweekly' && styles.smallButtonActive]}>
                <Text style={[styles.smallButtonText, { color: contributionFrequency === 'biweekly' ? palette.white : theme.text }, contributionFrequency === 'biweekly' && styles.smallButtonTextActive]}>Bi-weekly</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setContributionFrequency('monthly')} style={[styles.smallButton, contributionFrequency === 'monthly' && styles.smallButtonActive]}>
                <Text style={[styles.smallButtonText, { color: contributionFrequency === 'monthly' ? palette.white : theme.text }, contributionFrequency === 'monthly' && styles.smallButtonTextActive]}>Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setContributionFrequency('annually')} style={[styles.smallButton, contributionFrequency === 'annually' && styles.smallButtonActive]}>
                <Text style={[styles.smallButtonText, { color: contributionFrequency === 'annually' ? palette.white : theme.text }, contributionFrequency === 'annually' && styles.smallButtonTextActive]}>Annually</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {!isTablet && <View style={{ height: spacing.lg }} />}

      <View style={[styles.resultsRow, !isTablet && styles.resultsRowStack]}>
        <View style={[styles.resultsCol, !isTablet && styles.resultsColStack]}>
          <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Future value</Text>
          <Text style={[styles.resultValue, { color: theme.text }]}>{formatCurrency(fvTotal)}</Text>
        </View>

        <View style={[styles.resultsCol, !isTablet && styles.resultsColStack]}>
          <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Total contributed</Text>
          <Text style={[styles.resultValue, { color: theme.text }]}>{formatCurrency(totalContrib)}</Text>
        </View>

        <View style={[styles.resultsCol, !isTablet && styles.resultsColStack]}>
          <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Interest earned</Text>
          <Text style={[styles.resultValue, { color: interestEarned >= 0 ? palette.green : palette.red }]}>{formatCurrency(interestEarned)}</Text>
        </View>

        <View style={[styles.resultsCol, !isTablet && styles.resultsColStack]}>
          <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Cumulative return</Text>
          <Text style={[styles.resultValue, { color: cumulativePct >= 0 ? palette.green : palette.red }]}>{cumulativePct.toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  );
}
