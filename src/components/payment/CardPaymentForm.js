import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Icon from '../Icon';
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiryDate,
  formatCVV,
} from '../../services/paymentService';

export const CardPaymentForm = ({
  cardData,
  onChangeCardData,
  errors = {},
  disabled = false,
}) => {
  const [showCVV, setShowCVV] = useState(false);

  const brand = detectCardBrand(cardData.cardNumber);

  const handleCardNumberChange = (text) => {
    const formatted = formatCardNumber(text);
    onChangeCardData({ ...cardData, cardNumber: formatted });
  };

  const handleExpiryChange = (text) => {
    const formatted = formatExpiryDate(text);
    onChangeCardData({ ...cardData, expiry: formatted });
  };

  const handleCVVChange = (text) => {
    const formatted = formatCVV(text, brand);
    onChangeCardData({ ...cardData, cvv: formatted });
  };

  const handleHolderChange = (text) => {
    onChangeCardData({ ...cardData, cardHolder: text.toUpperCase() });
  };

  const brandLabel = {
    visa: 'VISA',
    mastercard: 'Mastercard',
    amex: 'AMEX',
    discover: 'Discover',
    rupay: 'RuPay',
    generic: 'CARD',
  }[brand];

  return (
    <View style={styles.container}>
      {/* Visual Realistic Credit Card Preview */}
      <View style={styles.cardPreview}>
        <View style={styles.previewTopRow}>
          {/* Chip Icon */}
          <View style={styles.chipGraphic}>
            <View style={styles.chipLineHorizontal} />
            <View style={styles.chipLineVertical} />
          </View>
          <Text style={styles.previewBrandText}>{brandLabel}</Text>
        </View>

        {/* Card Number on Preview */}
        <Text style={styles.previewCardNumber}>
          {cardData.cardNumber || '•••• •••• •••• ••••'}
        </Text>

        <View style={styles.previewBottomRow}>
          <View style={styles.previewCol}>
            <Text style={styles.previewLabel}>CARDHOLDER</Text>
            <Text style={styles.previewValue} numberOfLines={1}>
              {cardData.cardHolder || 'YOUR NAME'}
            </Text>
          </View>

          <View style={styles.previewColRight}>
            <Text style={styles.previewLabel}>EXPIRES</Text>
            <Text style={styles.previewValue}>
              {cardData.expiry || 'MM/YY'}
            </Text>
          </View>
        </View>
      </View>

      {/* Input Fields */}
      <View style={styles.fieldsContainer}>
        {/* 1. Card Number */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Card Number</Text>
          <View
            style={[
              styles.inputWrapper,
              errors.cardNumber && styles.inputWrapperError,
            ]}
          >
            <Icon name="card" size={20} color={COLORS.icon} style={styles.inputLeftIcon} />
            <TextInput
              style={styles.textInput}
              value={cardData.cardNumber}
              onChangeText={handleCardNumberChange}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
              maxLength={23}
              editable={!disabled}
              autoCorrect={false}
            />
            {brand !== 'generic' && (
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>{brandLabel}</Text>
              </View>
            )}
          </View>
          {errors.cardNumber && (
            <Text style={styles.errorText}>{errors.cardNumber}</Text>
          )}
        </View>

        {/* 2. Card Holder Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Cardholder Name</Text>
          <View
            style={[
              styles.inputWrapper,
              errors.cardHolder && styles.inputWrapperError,
            ]}
          >
            <Icon name="user" size={18} color={COLORS.icon} style={styles.inputLeftIcon} />
            <TextInput
              style={styles.textInput}
              value={cardData.cardHolder}
              onChangeText={handleHolderChange}
              placeholder="e.g. JOHN DOE"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="characters"
              editable={!disabled}
              autoCorrect={false}
            />
          </View>
          {errors.cardHolder && (
            <Text style={styles.errorText}>{errors.cardHolder}</Text>
          )}
        </View>

        {/* 3. Expiry and CVV (Side by side) */}
        <View style={styles.row}>
          {/* Expiry Date */}
          <View style={[styles.fieldGroup, { flex: 1, marginRight: SPACING.sm }]}>
            <Text style={styles.fieldLabel}>Expiry Date</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.expiry && styles.inputWrapperError,
              ]}
            >
              <TextInput
                style={styles.textInput}
                value={cardData.expiry}
                onChangeText={handleExpiryChange}
                placeholder="MM/YY"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
                maxLength={5}
                editable={!disabled}
                autoCorrect={false}
              />
            </View>
            {errors.expiry && (
              <Text style={styles.errorText}>{errors.expiry}</Text>
            )}
          </View>

          {/* CVV */}
          <View style={[styles.fieldGroup, { flex: 1, marginLeft: SPACING.sm }]}>
            <View style={styles.cvvLabelRow}>
              <Text style={styles.fieldLabel}>CVV / CVC</Text>
              <TouchableOpacity
                onPress={() => setShowCVV(!showCVV)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon
                  name={showCVV ? 'eye-off' : 'eye'}
                  size={14}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.inputWrapper,
                errors.cvv && styles.inputWrapperError,
              ]}
            >
              <TextInput
                style={styles.textInput}
                value={cardData.cvv}
                onChangeText={handleCVVChange}
                placeholder="•••"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
                secureTextEntry={!showCVV}
                maxLength={brand === 'amex' ? 4 : 3}
                editable={!disabled}
                autoCorrect={false}
              />
              <Icon name="lock" size={15} color={COLORS.iconLight} />
            </View>
            {errors.cvv && (
              <Text style={styles.errorText}>{errors.cvv}</Text>
            )}
          </View>
        </View>

        {/* Security badge notice */}
        <View style={styles.securityRow}>
          <Icon name="shield" size={14} color="#10B981" />
          <Text style={styles.securityText}>
            256-bit SSL encrypted. Sensitive card details are never stored locally.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  cardPreview: {
    backgroundColor: '#1E293B',
    borderRadius: RADIUS.extraLarge,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  previewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  chipGraphic: {
    width: 36,
    height: 26,
    borderRadius: 5,
    backgroundColor: '#FCD34D',
    borderWidth: 1,
    borderColor: '#F59E0B',
    position: 'relative',
    overflow: 'hidden',
  },
  chipLineHorizontal: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#D97706',
  },
  chipLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 17,
    width: 1,
    backgroundColor: '#D97706',
  },
  previewBrandText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  previewCardNumber: {
    fontFamily: 'monospace',
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 2,
    marginBottom: SPACING.lg,
  },
  previewBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  previewCol: {
    flex: 1,
  },
  previewColRight: {
    alignItems: 'flex-end',
  },
  previewLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  fieldsContainer: {
    gap: SPACING.sm,
  },
  fieldGroup: {
    marginBottom: SPACING.xs,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  cvvLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  inputWrapperError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  inputLeftIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    height: '100%',
    paddingVertical: 0,
  },
  brandBadge: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  row: {
    flexDirection: 'row',
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginTop: 4,
    fontSize: 11,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: SPACING.sm,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginTop: SPACING.xs,
    gap: 6,
  },
  securityText: {
    ...TYPOGRAPHY.caption,
    color: '#166534',
    flex: 1,
    fontSize: 11,
  },
});

export default CardPaymentForm;
