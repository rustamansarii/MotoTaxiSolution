import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Icon from '../Icon';
import { formatCurrency } from '../../utils/formatters';

export const PaymentStatus = ({
  visible = false,
  status = 'idle', // 'idle' | 'processing' | 'success' | 'failed' | 'pending'
  method = 'card',
  amount = 0,
  currency = 'USD',
  transactionId = '',
  errorMessage = '',
  onClose,
  onPrimaryAction,
  onRetry,
  isDriver = false,
}) => {
  if (!visible || status === 'idle') return null;

  const formattedAmount = formatCurrency(
    amount,
    currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency
  );

  const getMethodTitle = () => {
    switch (method) {
      case 'card':
        return 'Credit / Debit Card';
      case 'qr':
        return 'QR Code Payment';
      case 'mobile_money':
        return 'Mobile Money';
      case 'cash':
        return 'Cash Payment';
      default:
        return 'Payment';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        if (status !== 'processing') onClose?.();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* 1. PROCESSING STATE */}
          {status === 'processing' && (
            <View style={styles.statusContent}>
              <View style={styles.loaderCircle}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
              <Text style={styles.statusTitle}>Processing Payment</Text>
              <Text style={styles.statusSub}>
                Contacting payment gateway securely... Please do not close this screen or press back.
              </Text>
              <View style={styles.amountPill}>
                <Text style={styles.amountPillText}>{formattedAmount}</Text>
              </View>
            </View>
          )}

          {/* 2. SUCCESS STATE */}
          {status === 'success' && (
            <View style={styles.statusContent}>
              <View style={styles.successCircle}>
                <Icon name="check" size={36} color={COLORS.white} />
              </View>
              <Text style={styles.statusTitle}>Payment Successful!</Text>
              <Text style={styles.statusSub}>
                {isDriver
                  ? `Payment of ${formattedAmount} has been collected and confirmed.`
                  : `Your payment of ${formattedAmount} was processed successfully.`}
              </Text>

              {/* Receipt Box */}
              <View style={styles.receiptBox}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Amount Paid</Text>
                  <Text style={styles.receiptValueBold}>{formattedAmount}</Text>
                </View>
                <View style={styles.receiptDivider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Method</Text>
                  <Text style={styles.receiptValue}>{getMethodTitle()}</Text>
                </View>
                {transactionId ? (
                  <>
                    <View style={styles.receiptDivider} />
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Transaction Ref</Text>
                      <Text style={styles.receiptRefText} numberOfLines={1}>
                        {transactionId}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPrimaryAction}
                style={styles.successBtn}
              >
                <Text style={styles.successBtnText}>
                  {isDriver ? 'Complete Trip & View Receipt ›' : 'Done ›'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 3. FAILED STATE */}
          {status === 'failed' && (
            <View style={styles.statusContent}>
              <View style={styles.failedCircle}>
                <Icon name="close" size={32} color={COLORS.white} />
              </View>
              <Text style={styles.statusTitle}>Payment Failed</Text>
              <Text style={styles.statusSub}>
                {errorMessage ||
                  'The transaction could not be processed. Please check your payment details or try a different method.'}
              </Text>

              <View style={styles.failedActionsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onClose}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Change Method</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onRetry}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryBtnText}>Retry Payment</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 4. PENDING STATE */}
          {status === 'pending' && (
            <View style={styles.statusContent}>
              <View style={styles.pendingCircle}>
                <Icon name="time" size={36} color={COLORS.white} />
              </View>
              <Text style={styles.statusTitle}>Payment Pending</Text>
              <Text style={styles.statusSub}>
                {method === 'cash'
                  ? `Cash payment of ${formattedAmount} is pending direct handover.`
                  : 'Awaiting confirmation from your bank or provider.'}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPrimaryAction}
                style={styles.pendingBtn}
              >
                <Text style={styles.pendingBtnText}>
                  {isDriver ? 'Confirm Handover & Complete' : 'Understood'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                style={styles.dismissBtn}
              >
                <Text style={styles.dismissBtnText}>Back to Payment Screen</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  statusContent: {
    width: '100%',
    alignItems: 'center',
  },
  loaderCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  failedCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  pendingCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statusTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  statusSub: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  amountPill: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amountPillText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  receiptLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  receiptValue: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
  },
  receiptValueBold: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
  },
  receiptRefText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
    maxWidth: '60%',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  successBtn: {
    width: '100%',
    height: 52,
    borderRadius: RADIUS.large,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  successBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  failedActionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
  },
  retryBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.white,
  },
  pendingBtn: {
    width: '100%',
    height: 50,
    borderRadius: RADIUS.large,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  pendingBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.white,
  },
  dismissBtn: {
    paddingVertical: SPACING.xs,
  },
  dismissBtnText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: '600',
  },
});

export default PaymentStatus;
