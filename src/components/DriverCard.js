import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import { responsiveFont } from '../utils/responsive';
import Icon from './Icon';

export const DriverCard = ({
  driver,
  onCall,
  onChat,
  showContactActions = true,
  showPin = true,
  style,
}) => {
  const { t } = useTranslation();
  if (!driver) return null;

  return (
    <View style={[styles.card, style]}>
      {/* Driver Header Row */}
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarInitials}>
            {driver.name ? driver.name.charAt(0) : 'D'}
          </Text>
        </View>

        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <View style={styles.ratingRow}>
            <Icon name="star" size={14} color={COLORS.primary} />
            <Text style={styles.ratingText}>{driver.rating}</Text>
            <Text style={styles.tripsText}>• {driver.totalTrips} {t('driver.trips').toLowerCase()}</Text>
          </View>
        </View>

        {showPin && (driver.otp || driver.pinCode) ? (
          <View style={styles.pinBadge}>
            <Text style={styles.pinLabel}>{driver.otp ? 'OTP' : 'PIN'}</Text>
            <Text style={styles.pinValue}>{driver.otp || driver.pinCode}</Text>
          </View>
        ) : null}
      </View>

      {/* Vehicle Details */}
      <View style={styles.vehicleRow}>
        <View style={styles.vehicleDetails}>
          <Text style={styles.carModel}>
            {driver.car?.model || 'Honda CB500X'}
          </Text>
          <Text style={styles.carColor}>
            {driver.car?.color || 'Midnight Black'}
          </Text>
        </View>

        <View style={styles.plateBadge}>
          <Text style={styles.plateText}>
            {driver.car?.plateNumber || '7XYZ892'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      {showContactActions ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onCall}
            style={styles.actionButton}
          >
            <Icon name="phone" size={16} color={COLORS.secondPrimary} />
            <Text style={styles.actionText}>{t('rider.call')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onChat}
            style={styles.actionButton}
          >
            <Icon name="chat" size={16} color={COLORS.secondPrimary} />
            <Text style={styles.actionText}>{t('rider.message')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarInitials: {
    ...TYPOGRAPHY.title,
    color: COLORS.secondPrimaryDark,
    fontWeight: '700',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  tripsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginLeft: SPACING.xs,
  },
  pinBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  pinLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  pinValue: {
    ...TYPOGRAPHY.title,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 2,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  vehicleDetails: {
    flex: 1,
  },
  carModel: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  carColor: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  plateBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  plateText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBg,
    height: 42,
    borderRadius: RADIUS.medium,
  },
  actionText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.secondPrimary,
    marginLeft: SPACING.xs,
  },
});

export default DriverCard;
