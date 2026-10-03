import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
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
import {
  fetchDriverWallet,
  fetchDriverWalletTransactions,
  fetchDriverWalletSummary,
} from '../../redux/features/driver/driverSlice';

export const DriverEarningsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, isSplitLayout, insets } = useResponsive();
  const dispatch = useDispatch();

  const {
    completedRide,
    activeRide,
    wallet,
    walletTransactions,
    walletSummary,
    isWalletLoading,
    isTransactionsLoading,
  } = useSelector((state) => state.driver);

  const [refreshing, setRefreshing] = useState(false);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutSuccess, setCashoutSuccess] = useState(false);

  // Load wallet, transactions, and summary from backend
  const loadWalletData = useCallback(async () => {
    try {
      await Promise.allSettled([
        dispatch(fetchDriverWallet()),
        dispatch(fetchDriverWalletTransactions()),
        dispatch(fetchDriverWalletSummary()),
      ]);
    } catch (e) {
      console.warn('[DriverEarnings] Error fetching wallet data:', e);
    }
  }, [dispatch]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  }, [loadWalletData]);

  const currency =
    wallet?.currency ||
    activeRide?.currency ||
    completedRide?.currency ||
    'USD';
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;

  const extraEarned = useMemo(() => {
    let extra = 0;
    if (completedRide?.driver_payout) extra += Number(completedRide.driver_payout);
    return extra;
  }, [completedRide]);

  // Balance from API with fallback
  const balance = useMemo(() => {
    const raw =
      wallet?.balance ??
      walletSummary?.current_balance ??
      wallet?.available_balance ??
      wallet?.total_balance ??
      wallet?.amount;
    if (raw !== undefined && raw !== null && !isNaN(Number(raw))) {
      return Number(raw);
    }
    return 0 + extraEarned;
  }, [wallet, walletSummary, extraEarned]);

  const todayEarnings = Number(walletSummary?.today_earnings ?? 0);
  const weekEarnings = Number(walletSummary?.week_earnings ?? 0);
  const monthEarnings = Number(walletSummary?.month_earnings ?? 0);

  const totalTrips =
    walletSummary?.trips_count ??
    walletSummary?.completed_trips ??
    walletSummary?.total_trips;
  const hoursOnline =
    walletSummary?.hours_online ??
    walletSummary?.online_hours ??
    walletSummary?.total_hours;
  const periodText =
    walletSummary?.period_label ||
    walletSummary?.period ||
    'Wallet & Earnings Summary';

  // Earnings Breakdown values
  const standardFares = useMemo(() => {
    const raw =
      walletSummary?.standard_fares ??
      walletSummary?.trip_fares ??
      walletSummary?.fares;
    if (raw !== undefined && raw !== null) return Number(raw);
    if (walletSummary) return weekEarnings;
    return extraEarned;
  }, [walletSummary, weekEarnings, extraEarned]);

  const bonuses = useMemo(() => {
    const raw =
      walletSummary?.bonuses ??
      walletSummary?.surge_bonuses ??
      walletSummary?.surge;
    return raw !== undefined && raw !== null ? Number(raw) : 0;
  }, [walletSummary]);

  const tips = useMemo(() => {
    const raw =
      walletSummary?.tips ??
      walletSummary?.passenger_tips;
    return raw !== undefined && raw !== null ? Number(raw) : 0;
  }, [walletSummary]);

  // Transactions list
  const transactions = useMemo(() => {
    if (Array.isArray(walletTransactions) && walletTransactions.length > 0) {
      return walletTransactions.map((tx, idx) => {
        const rawType = (tx.transaction_type || tx.type || '').toUpperCase();
        const isCredit =
          rawType === 'CREDIT' ||
          rawType === 'EARNING' ||
          rawType === 'TRIP' ||
          Number(tx.amount || 0) > 0;
        const amt = Math.abs(Number(tx.amount || 0));
        let title = tx.description || tx.title || tx.narration;
        if (!title) {
          title = isCredit ? 'Trip Earnings' : 'Payout Transfer';
        }
        let dateText = 'Recent';
        if (tx.created_at || tx.timestamp || tx.date) {
          try {
            dateText = new Date(tx.created_at || tx.timestamp || tx.date).toLocaleDateString(
              undefined,
              { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
            );
          } catch (_) {}
        }
        return {
          id: tx.id || `tx_${idx}`,
          title,
          amount: amt,
          isCredit,
          date: dateText,
          status: (tx.status || 'COMPLETED').toUpperCase(),
        };
      });
    }
    return [];
  }, [walletTransactions]);

  const isMultiColumn = isFoldableOrTablet || isSplitLayout;

  const maxDayAmount = Math.max(
    ...MOCK_DRIVER_EARNINGS_BREAKDOWN.map((d) => d.amount)
  );

  const handleCashout = () => {
    setShowCashoutModal(false);
    setCashoutSuccess(true);
  };

  const heroBanner = (
    <View style={styles.earningsHero}>
      <View style={styles.heroTopRow}>
        <Text style={styles.heroPeriod}>{periodText}</Text>
        {isWalletLoading && (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
        )}
      </View>
      <Text style={styles.heroAmount}>{formatCurrency(balance, currencySymbol)}</Text>
      <Text style={styles.heroSub}>
        {totalTrips !== undefined && hoursOnline !== undefined
          ? `${totalTrips} completed trips • ${hoursOnline} hrs online`
          : 'Available Payout Balance'}
      </Text>

      <CustomButton
        title={t('driver.cashOut', 'Cash Out')}
        onPress={() => setShowCashoutModal(true)}
        disabled={balance <= 0}
        variant="primary"
        icon="wallet"
        size="small"
        style={styles.cashoutBtn}
      />
    </View>
  );

  const periodSummaryCard = (
    <View style={styles.periodSummaryGrid}>
      <View style={styles.periodSummaryCard}>
        <View style={styles.periodIconCircle}>
          <Icon name="clock" size={13} color={COLORS.primary} />
        </View>
        <Text style={styles.periodSummaryLabel}>Today</Text>
        <Text style={styles.periodSummaryValue}>
          {formatCurrency(todayEarnings, currencySymbol)}
        </Text>
      </View>

      <View style={styles.periodSummaryCard}>
        <View style={styles.periodIconCircle}>
          <Icon name="trending-up" size={13} color={COLORS.primary} />
        </View>
        <Text style={styles.periodSummaryLabel}>This Week</Text>
        <Text style={styles.periodSummaryValue}>
          {formatCurrency(weekEarnings, currencySymbol)}
        </Text>
      </View>

      <View style={styles.periodSummaryCard}>
        <View style={styles.periodIconCircle}>
          <Icon name="calendar" size={13} color={COLORS.primary} />
        </View>
        <Text style={styles.periodSummaryLabel}>This Month</Text>
        <Text style={styles.periodSummaryValue}>
          {formatCurrency(monthEarnings, currencySymbol)}
        </Text>
      </View>
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
        <Text style={styles.rowVal}>{formatCurrency(standardFares, currencySymbol)}</Text>
      </View>

      <View style={styles.breakdownRow}>
        <View style={styles.rowLabelGroup}>
          <Icon name="trending-up" size={16} color={COLORS.primary} />
          <Text style={styles.rowLabel}>Surge & Zone Bonuses</Text>
        </View>
        <Text style={[styles.rowVal, styles.positiveVal]}>+{formatCurrency(bonuses, currencySymbol)}</Text>
      </View>

      <View style={styles.breakdownRow}>
        <View style={styles.rowLabelGroup}>
          <Icon name="star" size={16} color={COLORS.primary} />
          <Text style={styles.rowLabel}>Passenger Tips (100%)</Text>
        </View>
        <Text style={[styles.rowVal, styles.positiveVal]}>+{formatCurrency(tips, currencySymbol)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.breakdownRow}>
        <Text style={styles.totalLabel}>Total Payout Balance</Text>
        <Text style={styles.totalVal}>{formatCurrency(balance, currencySymbol)}</Text>
      </View>
    </View>
  );

  const transactionsCard = (
    <View style={styles.card}>
      <View style={styles.transactionsHeader}>
        <Text style={styles.cardTitle}>Recent Transactions</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={loadWalletData}>
          <Text style={styles.refreshLink}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {isTransactionsLoading && transactions.length === 0 ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
      ) : transactions.length === 0 ? (
        <View style={styles.emptyTxContainer}>
          <View style={styles.emptyTxIconBox}>
            <Icon name="file-text" size={22} color={COLORS.textLight} />
          </View>
          <Text style={styles.emptyTxTitle}>No Transactions Yet</Text>
          <Text style={styles.emptyTxSub}>
            Earnings from completed trips and payout transfers will appear here.
          </Text>
        </View>
      ) : (
        transactions.map((tx, idx) => (
          <View
            key={tx.id || idx}
            style={[
              styles.txRow,
              idx === transactions.length - 1 && styles.txRowLast,
            ]}
          >
            <View
              style={[
                styles.txIconBox,
                tx.isCredit ? styles.txIconBoxCredit : styles.txIconBoxDebit,
              ]}
            >
              <Icon
                name={tx.isCredit ? 'arrow-down' : 'arrow-up'}
                size={14}
                color={tx.isCredit ? COLORS.primary : COLORS.danger}
              />
            </View>

            <View style={styles.txTextCol}>
              <Text numberOfLines={1} style={styles.txTitle}>
                {tx.title}
              </Text>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>

            <View style={styles.txAmountCol}>
              <Text
                style={[
                  styles.txAmount,
                  tx.isCredit ? styles.positiveVal : styles.txAmountDebit,
                ]}
              >
                {tx.isCredit ? '+' : '-'}{currencySymbol}{tx.amount.toFixed(2)}
              </Text>
              <View
                style={[
                  styles.txStatusBadge,
                  tx.status === 'COMPLETED' ? styles.txStatusSuccess : styles.txStatusPending,
                ]}
              >
                <Text
                  style={[
                    styles.txStatusText,
                    tx.status === 'COMPLETED' ? styles.txStatusSuccessText : styles.txStatusPendingText,
                  ]}
                >
                  {tx.status}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const bankCard = (
    <View style={styles.bankCard}>
      <View style={styles.bankIcon}>
        <Icon name="wallet" size={20} color={COLORS.secondPrimary} />
      </View>
      <View style={styles.bankInfo}>
        <Text style={styles.bankName}>Direct Bank Account</Text>
        <Text style={styles.bankSub}>Automated weekly payouts on Tuesdays</Text>
      </View>
      <Icon name="chevron-right" size={16} color={COLORS.iconLight} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ResponsiveContainer maxWidth={960} style={{ flex: 1 }}>
        <Header
          title={t('driver.tripEarnings', 'Driver Wallet & Earnings')}
          showBack={false}
          variant="light"
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {isMultiColumn ? (
            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                {heroBanner}
                {periodSummaryCard}
                {chartCard}
                {bankCard}
              </View>
              <View style={styles.splitCol}>
                {breakdownCard}
                {transactionsCard}
              </View>
            </View>
          ) : (
            <>
              {heroBanner}
              {periodSummaryCard}
              {chartCard}
              {breakdownCard}
              {transactionsCard}
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
        message={`Transfer ${formatCurrency(balance, currencySymbol)} immediately to your linked bank account? Funds arrive within minutes.`}
        confirmText="Transfer Funds"
        cancelText="Cancel"
        onConfirm={handleCashout}
        icon="wallet"
      />

      <CustomModal
        visible={cashoutSuccess}
        onClose={() => setCashoutSuccess(false)}
        title="Transfer Initiated!"
        message="Your payout is on the way to your linked bank account."
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
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  refreshLink: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  txRowLast: {
    borderBottomWidth: 0,
  },
  txIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  txIconBoxCredit: {
    backgroundColor: '#ECFDF5',
  },
  txIconBoxDebit: {
    backgroundColor: '#FEF2F2',
  },
  txTextCol: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  txTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  txDate: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
  },
  txAmountDebit: {
    color: COLORS.text,
  },
  txStatusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  txStatusSuccess: {
    backgroundColor: '#ECFDF5',
  },
  txStatusPending: {
    backgroundColor: '#FEF3C7',
  },
  txStatusText: {
    fontSize: 8,
    fontWeight: '800',
  },
  txStatusSuccessText: {
    color: '#059669',
  },
  txStatusPendingText: {
    color: '#D97706',
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
  periodSummaryGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  periodSummaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  periodIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  periodSummaryLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  periodSummaryValue: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptyTxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  emptyTxIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTxTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyTxSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default DriverEarningsScreen;
