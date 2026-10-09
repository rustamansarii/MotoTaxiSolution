import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { responsiveFont } from '../../utils/responsive';
import Icon from '../Icon';
import { KeyboardTextInput } from '../keyboard/KeyboardTextInput';
import {
  MOBILE_MONEY_PROVIDERS,
  MOBILE_MONEY_COUNTRIES,
} from '../../services/paymentService';

export const MobileMoneyForm = ({
  mobileData,
  onChangeMobileData,
  errors = {},
  disabled = false,
}) => {
  const [showCountryModal, setShowCountryModal] = useState(false);

  const selectedCountry =
    MOBILE_MONEY_COUNTRIES.find((c) => c.code === mobileData.countryCode) ||
    MOBILE_MONEY_COUNTRIES[0];

  const handlePhoneChange = (text) => {
    const clean = text.replace(/\D/g, '');
    onChangeMobileData({ ...mobileData, phone: clean });
  };

  const handleSelectCountry = (country) => {
    onChangeMobileData({ ...mobileData, countryCode: country.code });
    setShowCountryModal(false);
  };

  const handleSelectProvider = (providerId) => {
    onChangeMobileData({ ...mobileData, provider: providerId });
  };

  return (
    <View style={styles.container}>
      {/* 1. Mobile Money Provider Selector */}
      <View style={styles.sectionBlock}>
        <Text style={styles.fieldLabel}>Select Network / Provider</Text>
        <View style={styles.providersGrid}>
          {MOBILE_MONEY_PROVIDERS.map((prov) => {
            const isSelected = mobileData.provider === prov.id;
            return (
              <TouchableOpacity
                key={prov.id}
                activeOpacity={0.75}
                disabled={disabled}
                onPress={() => handleSelectProvider(prov.id)}
                style={[
                  styles.providerCard,
                  isSelected && styles.providerCardSelected,
                  isSelected && { borderColor: prov.color },
                ]}
              >
                <View
                  style={[
                    styles.providerIconCircle,
                    { backgroundColor: `${prov.color}15` },
                  ]}
                >
                  <Icon name={prov.logoIcon} size={18} color={prov.color} />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.providerName,
                    isSelected && { color: COLORS.text, fontWeight: '800' },
                  ]}
                >
                  {prov.name}
                </Text>
                {isSelected && (
                  <View style={[styles.providerDot, { backgroundColor: prov.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.provider && (
          <Text style={styles.errorText}>{errors.provider}</Text>
        )}
      </View>

      {/* 2. Phone Number with Country Code Selector */}
      <View style={styles.sectionBlock}>
        <Text style={styles.fieldLabel}>Mobile Phone Number</Text>
        <View
          style={[
            styles.phoneInputRow,
            errors.phone && styles.phoneInputRowError,
          ]}
        >
          {/* Country Code Trigger */}
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={disabled}
            onPress={() => setShowCountryModal(true)}
            style={styles.countryBtn}
          >
            <Text style={styles.flagText}>{selectedCountry.flag}</Text>
            <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
            <Icon name="chevron-down" size={12} color={COLORS.iconLight} />
          </TouchableOpacity>

          <View style={styles.verticalDivider} />

          {/* Number Input */}
          <KeyboardTextInput
            id="payment_mobile_phone"
            style={styles.phoneInput}
            value={mobileData.phone}
            onChangeText={handlePhoneChange}
            placeholder={`e.g. ${'712345678'.slice(0, selectedCountry.length)}`}
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
            editable={!disabled}
            maxLength={14}
          />
        </View>
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      {/* STK Push Info Notice Box */}
      <View style={styles.infoCallout}>
        <Icon name="info" size={18} color={COLORS.secondPrimary} />
        <View style={styles.infoCol}>
          <Text style={styles.infoTitle}>Instant USSD / STK Push</Text>
          <Text style={styles.infoDesc}>
            After tapping Pay Now, a secure push prompt will be sent to your phone. Enter your mobile money PIN to authorize the payment.
          </Text>
        </View>
      </View>

      {/* Country Code Selector Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setShowCountryModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={MOBILE_MONEY_COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isItemChosen = item.code === selectedCountry.code;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleSelectCountry(item)}
                    style={[
                      styles.countryItem,
                      isItemChosen && styles.countryItemSelected,
                    ]}
                  >
                    <Text style={styles.itemFlag}>{item.flag}</Text>
                    <Text style={styles.itemCountryName}>{item.country}</Text>
                    <Text style={styles.itemCode}>{item.code}</Text>
                    {isItemChosen && (
                      <Icon name="check" size={16} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  sectionBlock: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  providersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  providerCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.medium,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  providerCardSelected: {
    backgroundColor: '#FAFCFD',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  providerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  providerName: {
    flex: 1,
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    fontSize: responsiveFont(12),
  },
  providerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    height: 50,
  },
  phoneInputRowError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: 6,
    height: '100%',
  },
  flagText: {
    fontSize: responsiveFont(18),
  },
  countryCodeText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  phoneInput: {
    flex: 1,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    height: '100%',
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginTop: 4,
    fontSize: responsiveFont(11),
  },
  infoCallout: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondPrimaryLight,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#D4DBFE',
    marginTop: SPACING.xs,
  },
  infoCol: {
    flex: 1,
  },
  infoTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.secondPrimaryDark,
    marginBottom: 2,
  },
  infoDesc: {
    ...TYPOGRAPHY.caption,
    color: '#374151',
    lineHeight: 16,
    fontSize: responsiveFont(11),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    padding: SPACING.lg,
    maxHeight: '60%',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.medium,
  },
  countryItemSelected: {
    backgroundColor: COLORS.inputBg,
  },
  itemFlag: {
    fontSize: responsiveFont(22),
    marginRight: SPACING.sm,
  },
  itemCountryName: {
    flex: 1,
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    fontWeight: '600',
  },
  itemCode: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.textLight,
    marginRight: SPACING.sm,
  },
});

export default MobileMoneyForm;
