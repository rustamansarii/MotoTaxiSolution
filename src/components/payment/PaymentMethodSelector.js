import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Icon from '../Icon';

export const PAYMENT_METHODS = [
  {
    id: 'card',
    title: 'Credit / Debit Card',
    subtitle: 'Visa, Mastercard, Amex',
    icon: 'card',
    accentColor: COLORS.primary,
    badge: 'Popular',
  },
  {
    id: 'qr',
    title: 'QR Code',
    subtitle: 'Scan & Pay with UPI or App',
    icon: 'qr-code',
    accentColor: COLORS.secondPrimary,
    badge: 'Instant',
  },
  {
    id: 'mobile_money',
    title: 'Mobile Money',
    subtitle: 'M-Pesa, MTN, Airtel Money',
    icon: 'phone-portrait',
    accentColor: '#10B981',
    badge: 'Direct',
  },
  {
    id: 'cash',
    title: 'Cash',
    subtitle: 'Pay directly to driver',
    icon: 'cash',
    accentColor: '#F59E0B',
    badge: null,
  },
];

export const PaymentMethodSelector = ({
  selectedMethod = 'card',
  onSelectMethod,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>SELECT PAYMENT METHOD</Text>
      
      <View style={styles.grid}>
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethod === method.id;

          return (
            <TouchableOpacity
              key={method.id}
              activeOpacity={0.75}
              disabled={disabled}
              onPress={() => onSelectMethod?.(method.id)}
              style={[
                styles.methodCard,
                isSelected && styles.methodCardSelected,
                isSelected && { borderColor: method.accentColor },
              ]}
            >
              {/* Radio Indicator */}
              <View
                style={[
                  styles.radioOuter,
                  isSelected && { borderColor: method.accentColor },
                ]}
              >
                {isSelected && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: method.accentColor },
                    ]}
                  />
                )}
              </View>

              {/* Method Icon Box */}
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isSelected
                      ? `${method.accentColor}18`
                      : COLORS.inputBg,
                  },
                ]}
              >
                <Icon
                  name={method.icon}
                  size={22}
                  color={isSelected ? method.accentColor : COLORS.icon}
                />
              </View>

              {/* Method Info */}
              <View style={styles.infoCol}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.title,
                      isSelected && styles.titleSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {method.title}
                  </Text>
                  {method.badge && (
                    <View
                      style={[
                        styles.badge,
                        isSelected
                          ? { backgroundColor: `${method.accentColor}20` }
                          : { backgroundColor: COLORS.borderLight },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isSelected && { color: method.accentColor },
                        ]}
                      >
                        {method.badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {method.subtitle}
                </Text>
              </View>

              {/* Active Checkmark Pill */}
              {isSelected && (
                <View
                  style={[
                    styles.checkPill,
                    { backgroundColor: `${method.accentColor}15` },
                  ]}
                >
                  <Icon name="check" size={14} color={method.accentColor} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  grid: {
    gap: SPACING.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  methodCardSelected: {
    backgroundColor: '#FAFCFC',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.disabled,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 2,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  titleSelected: {
    fontWeight: '800',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.round,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 0.3,
  },
  checkPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
});

export default PaymentMethodSelector;
