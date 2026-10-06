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
  Modal,
  Pressable,
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
  fetchDriverWallet,
  fetchDriverWalletTransactions,
  fetchDriverWalletSummary,
} from '../../redux/features/driver/driverSlice';

/**
 * Format ISO datetime string to user-friendly label
 */
const formatWalletDate = (dateString, t, language = 'en') => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const localeMap = {
      en: 'en-US',
      fr: 'fr-FR',
      hi: 'hi-IN',
    };
    const currentLocale = localeMap[language] || 'en-US';
    const timeStr = date.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `${t ? t('common.today', 'Today') : 'Today'}, ${timeStr}`;
    if (isYesterday) return `${t ? t('common.yesterday', 'Yesterday') : 'Yesterday'}, ${timeStr}`;

    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString(currentLocale, { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}, ${timeStr}`;
  } catch {
    return dateString;
  }
};

/**
 * Format transaction title based on ride_id and reason
 */
const getTransactionTitle = (tx, t) => {
  if (tx.ride_id) {
    return t
      ? t('driver.rideEarningWithId', 'Ride #{{id}} Earning', { id: tx.ride_id })
      : `Ride #${tx.ride_id} Earning`;
  }
  if (tx.reason === 'RIDE_EARNING') {
    return t ? t('driver.rideEarning', 'Ride Earning') : 'Ride Earning';
  }
  if (tx.reason === 'WALLET_CASHOUT' || tx.reason === 'CASHOUT') {
    return t ? t('driver.walletCashout', 'Wallet Cashout') : 'Wallet Cashout';
  }
  if (tx.reason === 'BONUS') {
    return t ? t('driver.bonus', 'Bonus') : 'Bonus';
  }
  if (tx.reason === 'REFERRAL') {
    return t ? t('driver.referralReward', 'Referral Reward') : 'Referral Reward';
  }
  if (tx.reason) {
    return tx.reason
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  if (tx.transaction_type === 'CREDIT') {
    return t ? t('driver.walletCredit', 'Wallet Credit') : 'Wallet Credit';
  }
  return t ? t('driver.walletDebit', 'Wallet Debit') : 'Wallet Debit';
};

/**
 * Map transaction type to localized string
 */
const getTransactionTypeLabel = (type, t) => {
  const upper = (type || 'CREDIT').toUpperCase();
  if (upper === 'CREDIT') return t ? t('driver.credit', 'CREDIT') : 'CREDIT';
  if (upper === 'DEBIT') return t ? t('driver.debit', 'DEBIT') : 'DEBIT';
  return type || 'CREDIT';
};

export const DriverEarningsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n?.language || 'en';
  const { isFoldableOrTablet, isSplitLayout, insets } = useResponsive();
  const dispatch = useDispatch();

  const {
    wallet,
    walletTransactions = [],
    walletSummary,
    isWalletLoading = false,
    isTransactionsLoading = false,
    isSummaryLoading = false,
  } = useSelector((state) => state.driver);

  const [refreshing, setRefreshing] = useState(false);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutSuccess, setCashoutSuccess] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  // Fetch real wallet, transactions, and summary from backend
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

  // Real balance from API
  const balance = useMemo(() => {
    const raw = wallet?.balance ?? walletSummary?.current_balance;
    if (raw !== undefined && raw !== null && !isNaN(Number(raw))) {
      return Number(raw);
    }
    return 0;
  }, [wallet, walletSummary]);

  // Real summary earnings from API
  const todayEarnings = Number(walletSummary?.today_earnings ?? 0);
  const weekEarnings = Number(walletSummary?.week_earnings ?? 0);
  const monthEarnings = Number(walletSummary?.month_earnings ?? 0);

  // Real transactions list from API
  const transactions = useMemo(() => {
    if (Array.isArray(walletTransactions)) {
      return walletTransactions;
    }
    return [];
  }, [walletTransactions]);

  const isMultiColumn = isFoldableOrTablet || isSplitLayout;
  const isInitialLoading =
    (isWalletLoading || isSummaryLoading || isTransactionsLoading) &&
    !wallet &&
    !walletSummary;

  const handleCashout = () => {
    setShowCashoutModal(false);
    setCashoutSuccess(true);
  };

  // 1. Balance Hero Card
  const heroBanner = (
    <View style={styles.earningsHero}>
      <View style={styles.heroTopRow}>
        <View style={styles.walletIconCircle}>
          <Icon name="wallet" size={16} color={COLORS.primary} />
        </View>
        <Text style={styles.heroPeriod}>
          {t('driver.currentWalletBalance', 'Current Wallet Balance')}
        </Text>
        {(isWalletLoading || isSummaryLoading) && (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />
        )}
      </View>

      <Text style={styles.heroAmount}>{formatCurrency(balance)}</Text>

      {wallet?.updated_at ? (
        <Text style={styles.heroSub}>
          {t('driver.lastUpdated', {
            date: formatWalletDate(wallet.updated_at, t, currentLanguage),
            defaultValue: `Last updated: ${formatWalletDate(wallet.updated_at, t, currentLanguage)}`,
          })}
        </Text>
      ) : (
        <Text style={styles.heroSub}>
          {t('driver.availableForCashout', 'Available for instant cash out')}
        </Text>
      )}

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

  // 2. Earnings Summary Grid (Today, This Week, This Month)
  const periodSummaryCard = (
    <View style={styles.periodSummaryGrid}>
      {/* Today */}
      <View style={styles.periodSummaryCard}>
        <View style={styles.periodIconCircle}>
          <Icon name="clock" size={13} color={COLORS.primary} />
        </View>
        <Text style={styles.periodSummaryLabel}>{t('driver.today', 'Today')}</Text>
        <Text style={styles.periodSummaryValue}>{formatCurrency(todayEarnings)}</Text>
      </View>

      {/* This Week */}
      <View style={styles.periodSummaryCard}>
        <View style={styles.periodIconCircle}>
          <Icon name="trending-up" size={13} color={COLORS.secondPrimary} />
        </View>
        <Text style={styles.periodSummaryLabel}>{t('driver.thisWeek', 'This Week')}</Text>
        <Text style={styles.periodSummaryValue}>{formatCurrency(weekEarnings)}</Text>
      </View>

      {/* This Month */}
      <View style={styles.periodSummaryCard}>
        <View style={styles.periodIconCircle}>
          <Icon name="star" size={13} color={COLORS.primary} />
        </View>
        <Text style={styles.periodSummaryLabel}>{t('driver.thisMonth', 'This Month')}</Text>
        <Text style={styles.periodSummaryValue}>{formatCurrency(monthEarnings)}</Text>
      </View>
    </View>
  );

  // 3. Transactions List Card
  const transactionsCard = (
    <View style={styles.card}>
      <View style={styles.transactionsHeader}>
        <View style={styles.txTitleRow}>
          <Text style={styles.cardTitle}>
            {t('driver.recentTransactions',)}
          </Text>
          {transactions.length > 0 && (
            <View style={styles.txCountBadge}>
              <Text style={styles.txCountBadgeText}>{transactions.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={loadWalletData}
          style={styles.refreshBtn}
        >
          <Icon name="refresh" size={13} color={COLORS.primary} />
          <Text style={styles.refreshLink}>{t('common.refresh', 'Refresh')}</Text>
        </TouchableOpacity>
      </View>

      {isTransactionsLoading && transactions.length === 0 ? (
        <View style={styles.txLoadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.txLoadingText}>
            {t('driver.loadingTransactions', 'Loading transactions...')}
          </Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyTxContainer}>
          <View style={styles.emptyTxIconBox}>
            <Icon name="wallet" size={24} color={COLORS.textLight} />
          </View>
          <Text style={styles.emptyTxTitle}>
            {t('driver.noTransactionsYet', 'No Transactions Yet')}
          </Text>
          <Text style={styles.emptyTxSub}>
            {t(
              'driver.emptyTransactionsSub',
              'Earnings from your completed rides will appear here automatically.'
            )}
          </Text>
        </View>
      ) : (
        transactions.map((tx, idx) => {
          const isCredit = (tx.transaction_type || '').toUpperCase() === 'CREDIT';
          const amt = Number(tx.amount || 0);
          const balanceAfter = tx.balance_after ? Number(tx.balance_after) : null;
          const isLast = idx === transactions.length - 1;

          return (
            <TouchableOpacity
              key={tx.id || idx}
              activeOpacity={0.75}
              onPress={() => setSelectedTx(tx)}
              style={[styles.txRow, isLast && styles.txRowLast]}
            >
              {/* Type Icon Badge */}
              <View
                style={[
                  styles.txIconBox,
                  isCredit ? styles.txIconBoxCredit : styles.txIconBoxDebit,
                ]}
              >
                <Icon
                  name={isCredit ? 'arrow-down' : 'arrow-up'}
                  size={14}
                  color={isCredit ? COLORS.primaryDark : COLORS.danger}
                />
              </View>

              {/* Title, Date & Balance */}
              <View style={styles.txTextCol}>
                <View style={styles.txTitleTopRow}>
                  <Text numberOfLines={1} style={styles.txTitle}>
                    {getTransactionTitle(tx, t)}
                  </Text>
                  {tx.ride_id ? (
                    <View style={styles.rideIdTag}>
                      <Text style={styles.rideIdTagText}>
                        {t('rider.rideNumber', {
                          id: tx.ride_id,
                          defaultValue: `Ride #${tx.ride_id}`,
                        })}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.txDate}>
                  {formatWalletDate(tx.created_at, t, currentLanguage)}
                </Text>
                {balanceAfter !== null ? (
                  <Text style={styles.balanceAfterText}>
                    {t('driver.balanceAfterLabel', {
                      balance: formatCurrency(balanceAfter),
                      defaultValue: `Balance: ${formatCurrency(balanceAfter)}`,
                    })}
                  </Text>
                ) : null}
              </View>

              {/* Amount & Type Badge */}
              <View style={styles.txAmountCol}>
                <Text
                  style={[
                    styles.txAmount,
                    isCredit ? styles.positiveVal : styles.negativeVal,
                  ]}
                >
                  {isCredit ? '+' : '-'}{formatCurrency(amt)}
                </Text>
                <View
                  style={[
                    styles.txTypeBadge,
                    isCredit ? styles.txBadgeCredit : styles.txBadgeDebit,
                  ]}
                >
                  <Text
                    style={[
                      styles.txTypeText,
                      isCredit ? styles.txTextCredit : styles.txTextDebit,
                    ]}
                  >
                    {getTransactionTypeLabel(tx.transaction_type, t)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ResponsiveContainer maxWidth={960} style={{ flex: 1 }}>
        <Header
          title={t('driver.walletAndEarnings', 'Driver Wallet & Earnings')}
          showBack={false}
          variant="light"
        />

        {isInitialLoading ? (
          <View style={styles.initialLoadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.initialLoadingText}>
              {t('driver.loadingWalletAndEarnings', 'Loading wallet & earnings...')}
            </Text>
          </View>
        ) : (
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
                </View>
                <View style={styles.splitCol}>
                  {transactionsCard}
                </View>
              </View>
            ) : (
              <>
                {heroBanner}
                {periodSummaryCard}
                {transactionsCard}
              </>
            )}
          </ScrollView>
        )}
      </ResponsiveContainer>

      {/* Transaction Details Modal */}
      <Modal
        visible={Boolean(selectedTx)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTx(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedTx(null)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {t('driver.txDetailsTitle', 'Transaction Details')}
                </Text>
                <Text style={styles.modalSubId}>
                  {t('driver.txNumber', {
                    id: selectedTx?.id,
                    defaultValue: `Transaction #${selectedTx?.id}`,
                  })}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedTx(null)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            {/* Amount Box */}
            <View style={styles.modalAmountBox}>
              <Text style={styles.modalAmountLabel}>
                {t('driver.txAmountLabel', 'Transaction Amount')}
              </Text>
              <Text
                style={[
                  styles.modalAmountVal,
                  selectedTx?.transaction_type === 'CREDIT'
                    ? styles.positiveVal
                    : styles.negativeVal,
                ]}
              >
                {selectedTx?.transaction_type === 'CREDIT' ? '+' : '-'}
                {formatCurrency(Number(selectedTx?.amount || 0))}
              </Text>
              <View
                style={[
                  styles.txTypeBadge,
                  selectedTx?.transaction_type === 'CREDIT'
                    ? styles.txBadgeCredit
                    : styles.txBadgeDebit,
                  { alignSelf: 'center', marginTop: 6 },
                ]}
              >
                <Text
                  style={[
                    styles.txTypeText,
                    selectedTx?.transaction_type === 'CREDIT'
                      ? styles.txTextCredit
                      : styles.txTextDebit,
                  ]}
                >
                  {getTransactionTypeLabel(selectedTx?.transaction_type, t)}
                </Text>
              </View>
            </View>

            {/* Details Grid */}
            <View style={styles.modalInfoGrid}>
              <View style={styles.modalGridCol}>
                <Text style={styles.modalGridLabel}>
                  {t('driver.reason', 'Reason')}
                </Text>
                <Text style={styles.modalGridVal}>
                  {selectedTx ? getTransactionTitle(selectedTx, t) : 'N/A'}
                </Text>
              </View>

              <View style={styles.modalGridCol}>
                <Text style={styles.modalGridLabel}>
                  {t('driver.rideId', 'Ride ID')}
                </Text>
                <Text style={styles.modalGridVal}>
                  {selectedTx?.ride_id ? `#${selectedTx.ride_id}` : 'N/A'}
                </Text>
              </View>

              <View style={styles.modalGridCol}>
                <Text style={styles.modalGridLabel}>
                  {t('driver.balanceAfter', 'Balance After')}
                </Text>
                <Text style={[styles.modalGridVal, { fontWeight: '700' }]}>
                  {formatCurrency(Number(selectedTx?.balance_after || 0))}
                </Text>
              </View>

              <View style={styles.modalGridCol}>
                <Text style={styles.modalGridLabel}>
                  {t('driver.dateTime', 'Date & Time')}
                </Text>
                <Text style={styles.modalGridVal}>
                  {formatWalletDate(selectedTx?.created_at, t, currentLanguage)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedTx(null)}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseBtnText}>
                {t('common.close', 'Close')}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Cashout Confirmation Modal */}
      <CustomModal
        visible={showCashoutModal}
        onClose={() => setShowCashoutModal(false)}
        title={t('driver.instantCashoutTitle', 'Instant Cash Out')}
        message={t('driver.instantCashoutMsg', {
          amount: formatCurrency(balance),
          defaultValue: `Transfer ${formatCurrency(balance)} immediately to your linked payout account?`,
        })}
        confirmText={t('driver.confirmTransfer', 'Confirm Transfer')}
        cancelText={t('common.cancel', 'Cancel')}
        onConfirm={handleCashout}
        icon="wallet"
      />

      <CustomModal
        visible={cashoutSuccess}
        onClose={() => setCashoutSuccess(false)}
        title={t('driver.transferInitiatedTitle', 'Transfer Initiated!')}
        message={t(
          'driver.transferInitiatedMsg',
          'Your payout has been initiated and will reflect shortly.'
        )}
        confirmText={t('common.done', 'Done')}
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
  initialLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  initialLoadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
  earningsHero: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPeriod: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  periodSummaryGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  periodSummaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
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
    fontWeight: '600',
  },
  periodSummaryValue: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  txTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  txCountBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
  },
  txCountBadgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  refreshLink: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
  },
  txLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  txLoadingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  txRowLast: {
    borderBottomWidth: 0,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  txIconBoxCredit: {
    backgroundColor: COLORS.primaryLight,
  },
  txIconBoxDebit: {
    backgroundColor: '#FEE2E2',
  },
  txTextCol: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  txTitleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  txTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  rideIdTag: {
    backgroundColor: COLORS.secondPrimaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rideIdTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondPrimaryDark,
  },
  txDate: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  balanceAfterText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
  },
  positiveVal: {
    color: COLORS.primaryDark,
  },
  negativeVal: {
    color: COLORS.danger,
  },
  txTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  txBadgeCredit: {
    backgroundColor: COLORS.primaryLight,
  },
  txBadgeDebit: {
    backgroundColor: '#FEE2E2',
  },
  txTypeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  txTextCredit: {
    color: COLORS.primaryDark,
  },
  txTextDebit: {
    color: COLORS.danger,
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

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    padding: SPACING.lg,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.md,
  },
  modalTitle: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.text,
  },
  modalSubId: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAmountBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalAmountLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  modalAmountVal: {
    ...TYPOGRAPHY.heading2,
    fontWeight: '800',
    marginTop: 2,
  },
  modalInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  modalGridCol: {
    width: '48%',
    backgroundColor: COLORS.inputBg,
    padding: SPACING.sm,
    borderRadius: RADIUS.small,
  },
  modalGridLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontSize: 11,
  },
  modalGridVal: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.round,
  },
  modalCloseBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text,
  },
});

export default DriverEarningsScreen;
