import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { responsiveFont } from '../../utils/responsive';
import Icon from '../Icon';
import { formatCurrency } from '../../utils/formatters';
import { MOBILE_MONEY_PROVIDERS } from '../../services/paymentService';

export const MobileMoneyForm = ({
  amount = 24.5,
  currency = 'USD',
  driverPhone = '+254 712 345 678',
  driverName = 'Driver Partner',
  isDriver = false,
  status = 'idle', // 'idle' | 'pending' | 'success'
  selectedProvider = 'mpesa',
  onSelectProvider,
  disabled = false,
}) => {
  const [copied, setCopied] = useState(false);

  const formattedAmount = formatCurrency(
    amount,
    currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency
  );

  const handleCopyPhone = () => {
    try {
      Clipboard.setString(driverPhone);
    } catch (e) {
      console.log('Clipboard copy error:', e);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.momoCard}>
        {/* Mobile Money Graphic Icon */}
        <View style={styles.momoIconCircle}>
          <Icon name="phone-portrait" size={32} color="#059669" />
        </View>

        {/* Title & Instructions */}
        <Text style={styles.momoTitle}>
          {isDriver ? 'Collect via Mobile Money' : 'Pay via Mobile Money'}
        </Text>
        <Text style={styles.momoDesc}>
          {isDriver
            ? 'Passenger should transfer the exact fare directly to your mobile money number below.'
            : 'Please transfer the exact fare directly to the driver\'s mobile money number below.'}
        </Text>

        {/* Driver Phone Number Display Box */}
        <View style={styles.driverPhoneBox}>
          <View style={styles.phoneHeaderRow}>
            <Text style={styles.phoneLabel}>
              {isDriver ? 'YOUR REGISTERED NUMBER' : "DRIVER'S MOBILE NUMBER"}
            </Text>
            {driverName ? (
              <View style={styles.driverNameBadge}>
                <Icon name="checkmark" size={11} color="#059669" />
                <Text style={styles.driverNameText} numberOfLines={1}>
                  {driverName}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.phoneDisplayRow}>
            <View style={styles.phoneMainCol}>
              <Text style={styles.phoneNumberText}>{driverPhone}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCopyPhone}
              style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
            >
              <Icon
                name={copied ? 'checkmark' : 'copy'}
                size={13}
                color={copied ? '#059669' : COLORS.primary}
              />
              <Text style={[styles.copyBtnText, copied && styles.copyBtnTextSuccess]}>
                {copied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount Box */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>TOTAL MOBILE MONEY DUE</Text>
          <Text style={styles.amountValue}>{formattedAmount}</Text>
          <View style={styles.momoPill}>
            <Icon name="shield" size={12} color="#059669" />
            <Text style={styles.momoPillText}>Direct Mobile Transfer</Text>
          </View>
        </View>

       

        {/* Status indicator when pending */}
        {status === 'pending' && (
          <View style={styles.pendingStatusBanner}>
            <Icon name="time" size={18} color="#D97706" />
            <View style={styles.pendingTextCol}>
              <Text style={styles.pendingStatusTitle}>Mobile Money Pending</Text>
              <Text style={styles.pendingStatusSub}>
                {isDriver
                  ? 'Awaiting passenger mobile transfer confirmation.'
                  : 'Payment marked as pending verification.'}
              </Text>
            </View>
          </View>
        )}

        {/* Status indicator when confirmed */}
        {status === 'success' && (
          <View style={styles.successStatusBanner}>
            <Icon name="check-circle" size={18} color="#059669" />
            <View style={styles.pendingTextCol}>
              <Text style={styles.successStatusTitle}>Mobile Money Received</Text>
              <Text style={styles.successStatusSub}>
                Fare of {formattedAmount} verified and logged via Mobile Money.
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
  momoCard: {
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
  momoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  momoTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  momoDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  driverPhoneBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginBottom: SPACING.md,
  },
  phoneHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  phoneLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.8,
  },
  driverNameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    gap: 4,
    maxWidth: '55%',
  },
  driverNameText: {
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: '#166534',
  },
  phoneDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneMainCol: {
    flex: 1,
  },
  phoneNumberText: {
    ...TYPOGRAPHY.h2,
    fontSize: responsiveFont(22),
    fontWeight: '900',
    color: '#14532D',
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  copyBtnSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  copyBtnText: {
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: COLORS.primary,
  },
  copyBtnTextSuccess: {
    color: '#15803D',
  },
  amountBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.medium,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  amountLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 0.8,
  },
  amountValue: {
    ...TYPOGRAPHY.h1,
    fontSize: responsiveFont(32),
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginVertical: 4,
  },
  momoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    gap: 4,
    marginTop: 2,
  },
  momoPillText: {
    fontSize: responsiveFont(10),
    fontWeight: '800',
    color: '#065F46',
  },
  networksSection: {
    width: '100%',
    marginBottom: SPACING.xs,
  },
  networksLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  networksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    justifyContent: 'center',
  },
  networkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.round,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  networkChipSelected: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  networkName: {
    fontSize: responsiveFont(11),
    fontWeight: '600',
    color: COLORS.textLight,
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
    marginTop: SPACING.sm,
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
    marginTop: SPACING.sm,
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

export default MobileMoneyForm;
