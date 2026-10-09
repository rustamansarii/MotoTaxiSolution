import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import { responsiveFont } from '../utils/responsive';
import Icon from './Icon';
import {
  getVehicleImageSource,
  getVehicleDisplayName,
  getVehiclePlateNumber,
} from '../utils/vehicleAssets';

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

  const vehicleImage = getVehicleImageSource(driver);
  const vehicleModel = getVehicleDisplayName(driver, 'Vehicle');
  const plateNumber = getVehiclePlateNumber(driver, '');
  const vehicleColor =
    driver.vehicle_color ||
    driver.color ||
    driver.car?.color ||
    (driver.vehicle_type ? String(driver.vehicle_type).toUpperCase() : '');

  const driverPhoto = driver.photo || driver.avatar || driver.avatarUrl;

  return (
    <View style={[styles.card, style]}>
      {/* Driver Header Row */}
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          {driverPhoto ? (
            <Image
              source={{ uri: driverPhoto }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarInitials}>
              {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
            </Text>
          )}
        </View>

        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <View style={styles.ratingRow}>
            <Icon name="star" size={14} color={COLORS.primary} />
            <Text style={styles.ratingText}>{driver.rating || '5.0'}</Text>
            {driver.totalTrips ? (
              <Text style={styles.tripsText}>
                • {driver.totalTrips} {t('driver.trips', 'trips').toLowerCase()}
              </Text>
            ) : null}
          </View>
        </View>

        {showPin && (driver.otp || driver.pinCode) ? (
          <View style={styles.pinBadge}>
            <Text style={styles.pinLabel}>{driver.otp ? 'OTP' : 'PIN'}</Text>
            <Text style={styles.pinValue}>{driver.otp || driver.pinCode}</Text>
          </View>
        ) : null}
      </View>

      {/* Vehicle Details & According Image */}
      <View style={styles.vehicleRow}>
        {/* Vehicle Image Thumbnail */}
        <View style={styles.vehicleImageContainer}>
          <Image
            source={vehicleImage}
            style={styles.vehicleImage}
            resizeMode="contain"
          />
        </View>

        {/* Model & Color */}
        <View style={styles.vehicleDetails}>
          <Text numberOfLines={1} style={styles.carModel}>
            {vehicleModel}
          </Text>
          <Text numberOfLines={1} style={styles.carColor}>
            {vehicleColor || (driver.vehicle_type || 'Ride')}
          </Text>
        </View>

        {/* Vehicle License Plate Number Badge */}
        {plateNumber ? (
          <View style={styles.plateBadge}>
            <Text numberOfLines={1} style={styles.plateText}>
              {plateNumber}
            </Text>
          </View>
        ) : null}
      </View>

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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.round,
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
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.md,
  },
  vehicleImageContainer: {
    width: 60,
    height: 44,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 2,
    overflow: 'hidden',
    padding: 2,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  vehicleDetails: {
    flex: 1,
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  carModel: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    fontSize: responsiveFont(13),
  },
  carColor: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
    fontSize: responsiveFont(11),
  },
  plateBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.small,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  plateText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.8,
    fontSize: responsiveFont(12),
    textTransform: 'uppercase',
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
