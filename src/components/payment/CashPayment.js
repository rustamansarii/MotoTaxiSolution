import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { responsiveFont } from '../../utils/responsive';
import Icon from '../Icon';
import { formatCurrency } from '../../utils/formatters';

export const CashPayment = ({
  amount = 24.5,
  currency = 'USD',
  note = '',
  onChangeNote,
  isDriver = false,
  status = 'idle', // 'idle' | 'pending' | 'success'
  disabled = false,
}) => {
  const formattedAmount = formatCurrency(
    amount,
    currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency
  );

  return (
    <View style={styles.container}>
      <View style={styles.cashCard}>
        {/* Cash Graphic Icon */}
        <View style={styles.cashIconCircle}>
          <Icon name="cash" size={32} color="#D97706" />
        </View>

        {/* Title & Instructions */}
        <Text style={styles.cashTitle}>
          {isDriver ? 'Collect Cash from Passenger' : 'Pay with Cash'}
        </Text>
        <Text style={styles.cashDesc}>
          {isDriver
            ? 'Please ensure you collect the exact fare directly from the passenger before completing the trip.'
            : 'Please keep the exact fare ready in cash and hand it over to your driver upon arrival.'}
        </Text>

        {/* Amount Box */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>TOTAL CASH DUE</Text>
          <Text style={styles.amountValue}>{formattedAmount}</Text>
          <View style={styles.exactChangePill}>
            <Icon name="shield" size={12} color="#059669" />
            <Text style={styles.exactChangeText}>Exact Change Preferred</Text>
          </View>
        </View>

        {/* Status indicator when confirmed */}
        {status === 'pending' && (
          <View style={styles.pendingStatusBanner}>
            <Icon name="time" size={18} color="#D97706" />
            <View style={styles.pendingTextCol}>
              <Text style={styles.pendingStatusTitle}>Cash Payment Pending</Text>
              <Text style={styles.pendingStatusSub}>
                {isDriver
                  ? 'Awaiting cash collection verification.'
                  : 'Cash payment marked as pending handover.'}
              </Text>
            </View>
          </View>
        )}

        {status === 'success' && (
          <View style={styles.successStatusBanner}>
            <Icon name="check-circle" size={18} color="#059669" />
            <View style={styles.pendingTextCol}>
              <Text style={styles.successStatusTitle}>Cash Payment Received</Text>
              <Text style={styles.successStatusSub}>
                Fare of {formattedAmount} verified and logged.
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  cashCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cashIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  cashTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  cashDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  amountBox: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderRadius: RADIUS.medium,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: SPACING.lg,
  },
  amountLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.8,
  },
  amountValue: {
    ...TYPOGRAPHY.h1,
    fontSize: responsiveFont(32),
    fontWeight: '900',
    color: '#78350F',
    marginVertical: 4,
  },
  exactChangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    gap: 4,
    marginTop: 2,
  },
  exactChangeText: {
    fontSize: responsiveFont(10),
    fontWeight: '800',
    color: '#065F46',
  },
  noteField: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  noteLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  noteInputWrapper: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 60,
  },
  noteInput: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    textAlignVertical: 'top',
    padding: 0,
  },
  pendingStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFBEB',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  pendingTextCol: {
    flex: 1,
  },
  pendingStatusTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: '#92400E',
  },
  pendingStatusSub: {
    ...TYPOGRAPHY.caption,
    color: '#B45309',
    marginTop: 2,
    fontSize: responsiveFont(11),
  },
  successStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#ECFDF5',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    borderWidth: 1.5,
    borderColor: '#10B981',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  successStatusTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: '#065F46',
  },
  successStatusSub: {
    ...TYPOGRAPHY.caption,
    color: '#047857',
    marginTop: 2,
    fontSize: responsiveFont(11),
  },
});

export default CashPayment;
