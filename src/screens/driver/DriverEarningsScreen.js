import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import CustomModal from '../../components/CustomModal';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';
import {
  MOCK_WALLET,
  MOCK_DRIVER_EARNINGS_BREAKDOWN,
} from '../../data/mockTransactions';

export const DriverEarningsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, isSplitLayout, insets } = useResponsive();
  const { completedRide, activeRide } = useSelector((state) => state.driver);

  const currency = activeRide?.currency || completedRide?.currency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : currency;

  const extraEarned = useMemo(() => {
    let extra = 0;
    if (completedRide?.driver_payout) extra += Number(completedRide.driver_payout);
    return extra;
  }, [completedRide]);

  const [balance, setBalance] = useState(MOCK_WALLET.driverBalance + extraEarned);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutSuccess, setCashoutSuccess] = useState(false);

  const isMultiColumn = isFoldableOrTablet || isSplitLayout;

  const maxDayAmount = Math.max(
    ...MOCK_DRIVER_EARNINGS_BREAKDOWN.map((d) => d.amount)
  );

  const handleCashout = () => {
    setBalance(0);
    setShowCashoutModal(false);
    setCashoutSuccess(true);
  };

  const heroBanner = (
    <View style={styles.earningsHero}>
      <Text style={styles.heroPeriod}>This Week • Sep 14 - Sep 20</Text>
      <Text style={styles.heroAmount}>{formatCurrency(balance, currencySymbol)}</Text>
      <Text style={styles.heroSub}>42 completed trips • 28.5 hrs online</Text>

      <CustomButton
        title={t('driver.cashOut')}
        onPress={() => setShowCashoutModal(true)}
        disabled={balance <= 0}
        variant="primary"
        icon="wallet"
        size="small"
        style={styles.cashoutBtn}
      />
    </View>
  );

  const chartCard = (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Daily Activity</Text>
        <Text style={styles.chartSubtitle}>Mon - Sun</Text>
      </View>

      <View style={styles.barContainer}>
        {MOCK_DRIVER_EARNINGS_BREAKDOWN.map((item, index) => {
          const heightPercent =
            maxDayAmount > 0 ? (item.amount / maxDayAmount) * 100 : 0;
          const isToday = item.day === 'Fri';

          return (
            <View key={index} style={styles.barCol}>
              <Text style={styles.barValText}>
                {item.amount > 0 ? `${currencySymbol}${Math.round(item.amount)}` : ''}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${Math.max(8, heightPercent)}%` },
                    isToday && styles.activeBarFill,
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.barDayText,
                  isToday && styles.activeBarDayText,
                ]}
              >
                {item.day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const breakdownCard = (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Earnings Breakdown</Text>

      <View style={styles.breakdownRow}>
        <View style={styles.rowLabelGroup}>
          <Icon name="car" size={16} color={COLORS.primary} />
          <Text style={styles.rowLabel}>Standard Trip Fares</Text>
        </View>
        <Text style={styles.rowVal}>{formatCurrency(620 + extraEarned, currencySymbol)}</Text>
      </View>

      <View style={styles.breakdownRow}>
        <View style={styles.rowLabelGroup}>
          <Icon name="trending-up" size={16} color={COLORS.primary} />
          <Text style={styles.rowLabel}>Surge & Zone Bonuses</Text>
        </View>
        <Text style={[styles.rowVal, styles.positiveVal]}>+{formatCurrency(134.5, currencySymbol)}</Text>
      </View>

      <View style={styles.breakdownRow}>
        <View style={styles.rowLabelGroup}>
          <Icon name="star" size={16} color={COLORS.primary} />
          <Text style={styles.rowLabel}>Passenger Tips (100%)</Text>
        </View>
        <Text style={[styles.rowVal, styles.positiveVal]}>+{formatCurrency(88.0, currencySymbol)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.breakdownRow}>
        <Text style={styles.totalLabel}>Total Payout Balance</Text>
        <Text style={styles.totalVal}>{formatCurrency(balance, currencySymbol)}</Text>
      </View>
    </View>
  );

  const bankCard = (
    <View style={styles.bankCard}>
      <View style={styles.bankIcon}>
        <Icon name="wallet" size={20} color={COLORS.secondPrimary} />
      </View>
      <View style={styles.bankInfo}>
        <Text style={styles.bankName}>Chase Bank •••• 5612</Text>
        <Text style={styles.bankSub}>Standard weekly payout on Tuesday</Text>
      </View>
      <Icon name="chevron-right" size={16} color={COLORS.iconLight} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ResponsiveContainer maxWidth={960} style={{ flex: 1 }}>
        <Header
          title={t('driver.tripEarnings')}
          showBack={false}
          variant="light"
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isMultiColumn ? (
            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                {heroBanner}
                {chartCard}
              </View>
              <View style={styles.splitCol}>
                {breakdownCard}
                {bankCard}
              </View>
            </View>
          ) : (
            <>
              {heroBanner}
              {chartCard}
              {breakdownCard}
              {bankCard}
            </>
          )}
        </ScrollView>
      </ResponsiveContainer>

      {/* Cashout Confirmation Modal */}
      <CustomModal
        visible={showCashoutModal}
        onClose={() => setShowCashoutModal(false)}
        title="Instant Cash Out"
        message={`Transfer ${formatCurrency(balance)} immediately to Chase Bank (•••• 5612)? Funds arrive in 1-2 minutes.`}
        confirmText="Transfer Funds"
        cancelText="Cancel"
        onConfirm={handleCashout}
        icon="wallet"
      />

      <CustomModal
        visible={cashoutSuccess}
        onClose={() => setCashoutSuccess(false)}
        title="Transfer Initiated!"
        message="Your payout is on the way to your linked bank account. Reference ID: TXN-893247."
        confirmText="Done"
        showCancel={false}
        onConfirm={() => setCashoutSuccess(false)}
        icon="check-circle"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  splitRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    alignItems: 'flex-start',
  },
  splitCol: {
    flex: 1,
  },
  earningsHero: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroPeriod: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
  },
  heroAmount: {
    ...TYPOGRAPHY.h1,
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.text,
    marginVertical: SPACING.xs,
  },
  heroSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
  },
  cashoutBtn: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.xl,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  chartTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  chartSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  barContainer: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValText: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 90,
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.round,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: COLORS.secondPrimary,
    borderRadius: RADIUS.round,
  },
  activeBarFill: {
    backgroundColor: COLORS.primary,
  },
  barDayText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 6,
  },
  activeBarDayText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  cardTitle: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  rowVal: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  positiveVal: {
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  totalLabel: {
    ...TYPOGRAPHY.title,
    fontWeight: '800',
    color: COLORS.text,
  },
  totalVal: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  bankSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
});

export default DriverEarningsScreen;
