import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import CustomModal from '../../components/CustomModal';
import Icon from '../../components/Icon';
import { formatCurrency } from '../../utils/formatters';
import {
  MOCK_WALLET,
  MOCK_DRIVER_EARNINGS_BREAKDOWN,
} from '../../data/mockTransactions';

export const DriverEarningsScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(MOCK_WALLET.driverBalance);
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutSuccess, setCashoutSuccess] = useState(false);

  const maxDayAmount = Math.max(
    ...MOCK_DRIVER_EARNINGS_BREAKDOWN.map((d) => d.amount)
  );

  const handleCashout = () => {
    setBalance(0);
    setShowCashoutModal(false);
    setCashoutSuccess(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundglass} />
      <Header title="Driver Earnings" showBack={false} variant="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly Total Banner */}
        <View style={styles.earningsHero}>
          <Text style={styles.heroPeriod}>This Week • Sep 14 - Sep 20</Text>
          <Text style={styles.heroAmount}>{formatCurrency(balance)}</Text>
          <Text style={styles.heroSub}>42 completed trips • 28.5 hrs online</Text>

          <CustomButton
            title="Cash Out Instantly"
            onPress={() => setShowCashoutModal(true)}
            disabled={balance <= 0}
            variant="primary"
            icon="wallet"
            size="small"
            style={styles.cashoutBtn}
          />
        </View>

        {/* Weekly Bar Visualizer */}
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
                    {item.amount > 0 ? `$${Math.round(item.amount)}` : ''}
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

        {/* Breakdown Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Earnings Breakdown</Text>

          <View style={styles.breakdownRow}>
            <View style={styles.rowLabelGroup}>
              <Icon name="car" size={16} color={COLORS.primary} />
              <Text style={styles.rowLabel}>Standard Trip Fares</Text>
            </View>
            <Text style={styles.rowVal}>$620.00</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.rowLabelGroup}>
              <Icon name="trending-up" size={16} color={COLORS.primary} />
              <Text style={styles.rowLabel}>Surge & Zone Bonuses</Text>
            </View>
            <Text style={[styles.rowVal, styles.positiveVal]}>+$134.50</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.rowLabelGroup}>
              <Icon name="star" size={16} color={COLORS.primary} />
              <Text style={styles.rowLabel}>Passenger Tips (100%)</Text>
            </View>
            <Text style={[styles.rowVal, styles.positiveVal]}>+$88.00</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.totalLabel}>Total Payout Balance</Text>
            <Text style={styles.totalVal}>{formatCurrency(balance)}</Text>
          </View>
        </View>

        {/* Banking / Payout Account */}
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
      </ScrollView>

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
    backgroundColor: COLORS.backgroundglass,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  earningsHero: {
    backgroundColor: COLORS.secondBackgroundglass,
    borderRadius: RADIUS.extraLarge,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  heroPeriod: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  heroAmount: {
    ...TYPOGRAPHY.h1,
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.white,
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
    backgroundColor: COLORS.secondBackgroundglass,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
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
    color: COLORS.white,
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
    color: COLORS.white,
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 90,
    backgroundColor: COLORS.backgroundglass,
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
    color: COLORS.primary,
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
