import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  View,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Icon from '../Icon';

export const PaymentButton = ({
  title,
  amount,
  onPress,
  loading = false,
  disabled = false,
  icon = 'card',
  variant = 'primary', // 'primary' | 'success' | 'secondary'
  style,
}) => {
  const getBackgroundColor = () => {
    if (disabled && !loading) return COLORS.disabled;
    if (variant === 'success') return '#10B981';
    if (variant === 'secondary') return COLORS.secondPrimary;
    return COLORS.primary;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.white} />
          <Text style={styles.loadingText}>Processing Securely...</Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          {icon && (
            <Icon name={icon} size={18} color={COLORS.white} style={styles.icon} />
          )}
          <Text style={styles.buttonText} numberOfLines={1}>
            {title}
          </Text>
          {amount && (
            <View style={styles.amountPill}>
              <Text style={styles.amountText}>{amount}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: RADIUS.large,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
    fontSize: 15,
  },
  amountPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    marginLeft: 8,
  },
  amountText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default PaymentButton;
