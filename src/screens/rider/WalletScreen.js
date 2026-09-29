import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import CustomModal from '../../components/CustomModal';
import CustomInput from '../../components/CustomInput';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';
import {
  MOCK_WALLET,
  MOCK_PAYMENT_METHODS,
  MOCK_TRANSACTIONS,
} from '../../data/mockTransactions';

export const WalletScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, isSplitLayout, insets } = useResponsive();
  const [balance, setBalance] = useState(MOCK_WALLET.riderBalance);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('25');
  const [paymentMethods, setPaymentMethods] = useState(MOCK_PAYMENT_METHODS);

  const handleTopUp = () => {
    const amt = parseFloat(topUpAmount) || 0;
    if (amt > 0) {
      setBalance(balance + amt);
      setShowAddFunds(false);
    }
  };

  const setDefaultPayment = (id) => {
    setPaymentMethods(
      paymentMethods.map((pm) => ({
        ...pm,
        isDefault: pm.id === id,
      }))
    );
  };

  const balanceCard = (
    <View style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <View style={styles.walletIconCircle}>
          <Icon name="wallet" size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.balanceLabel}>{t('rider.currentBalance')}</Text>
      </View>

      <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
      <Text style={styles.balanceSub}>
        Auto-used first for ride bookings & cancellation fees
      </Text>

      <View style={styles.balanceActions}>
        <CustomButton
          title={`+ ${t('rider.addFunds')}`}
          onPress={() => setShowAddFunds(true)}
          variant="primary"
          size="small"
          style={styles.addFundsBtn}
        />
      </View>
    </View>
  );

  const paymentMethodsSection = (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t('rider.paymentMethodsTitle')}</Text>
        <TouchableOpacity style={styles.addMethodBtn}>
          <Text style={styles.addMethodText}>+ {t('rider.addPaymentMethod')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.methodsContainer}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            activeOpacity={0.8}
            onPress={() => setDefaultPayment(method.id)}
            style={[
              styles.methodRow,
              method.isDefault && styles.activeMethodRow,
            ]}
          >
            <View style={styles.methodIconBox}>
              <Icon
                name={
                  method.type === 'apple_pay'
                    ? 'apple'
                    : method.type === 'cash'
                    ? 'cash'
                    : 'card'
                }
                size={20}
                color={COLORS.text}
              />
            </View>

            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
            </View>

            {method.isDefault ? (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            ) : (
              <View style={styles.selectRadio} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const transactionsSection = (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('rider.transactionHistory')}</Text>

      <View style={styles.transactionsCard}>
        {MOCK_TRANSACTIONS.map((tx, index) => (
          <View
            key={tx.id}
            style={[
              styles.txRow,
              index === MOCK_TRANSACTIONS.length - 1 && styles.noBorder,
            ]}
          >
            <View
              style={[
                styles.txIconBox,
                tx.amount > 0 ? styles.positiveTxIcon : styles.negativeTxIcon,
              ]}
            >
              <Icon
                name={tx.amount > 0 ? 'arrow-down' : 'navigation'}
                size={16}
                color={tx.amount > 0 ? COLORS.primary : COLORS.secondPrimary}
              />
            </View>

            <View style={styles.txDetails}>
              <Text style={styles.txTitle}>{tx.title}</Text>
              <Text style={styles.txDate}>{tx.date}</Text>
            </View>

            <Text
              style={[
                styles.txAmount,
                tx.amount > 0 ? styles.positiveAmount : styles.negativeAmount,
              ]}
            >
              {tx.amount > 0 ? '+' : ''}
              {formatCurrency(tx.amount)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const isMultiColumn = isFoldableOrTablet || isSplitLayout;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={960} style={{ flex: 1 }}>
        <Header
          title={t('rider.wallet')}
          showBack={false}
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
                {balanceCard}
                {paymentMethodsSection}
              </View>
              <View style={styles.splitCol}>
                {transactionsSection}
              </View>
            </View>
          ) : (
            <>
              {balanceCard}
              {paymentMethodsSection}
              {transactionsSection}
            </>
          )}
        </ScrollView>
      </ResponsiveContainer>

      {/* Add Funds Modal */}
      <CustomModal
        visible={showAddFunds}
        onClose={() => setShowAddFunds(false)}
        title="Add Funds to Wallet"
        message="Enter amount to add instantly from your default payment method."
        confirmText="Add Funds"
        cancelText="Cancel"
        onConfirm={handleTopUp}
        icon="wallet"
      >
        <View style={styles.topUpInputWrap}>
          <CustomInput
            label="Amount (USD)"
            value={topUpAmount}
            onChangeText={setTopUpAmount}
            keyboardType="numeric"
            placeholder="25.00"
            leftIcon="dollar-sign"
          />

          <View style={styles.quickAmounts}>
            {['10', '25', '50', '100'].map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => setTopUpAmount(amt)}
                style={[
                  styles.quickAmtBtn,
                  topUpAmount === amt && styles.activeQuickAmtBtn,
                ]}
              >
                <Text
                  style={[
                    styles.quickAmtText,
                    topUpAmount === amt && styles.activeQuickAmtText,
                  ]}
                >
                  +${amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </CustomModal>
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
  balanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    padding: SPACING.xl,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  balanceLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    ...TYPOGRAPHY.h1,
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
    marginVertical: SPACING.sm,
  },
  balanceSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  balanceActions: {
    flexDirection: 'row',
  },
  addFundsBtn: {
    alignSelf: 'flex-start',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  addMethodBtn: {
    padding: SPACING.xs,
  },
  addMethodText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimary,
  },
  methodsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activeMethodRow: {
    backgroundColor: COLORS.primaryLight,
  },
  methodIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  methodSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
  },
  defaultBadgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectRadio: {
    width: 18,
    height: 18,
    borderRadius: RADIUS.round,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  transactionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  positiveTxIcon: {
    backgroundColor: COLORS.primaryLight,
  },
  negativeTxIcon: {
    backgroundColor: COLORS.inputBg,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  txDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  txAmount: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
  },
  positiveAmount: {
    color: COLORS.primary,
  },
  negativeAmount: {
    color: COLORS.text,
  },
  topUpInputWrap: {
    width: '100%',
    marginVertical: SPACING.sm,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  quickAmtBtn: {
    flex: 1,
    height: 38,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeQuickAmtBtn: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  quickAmtText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
  },
  activeQuickAmtText: {
    color: COLORS.primaryDark,
  },
});

export default WalletScreen;
