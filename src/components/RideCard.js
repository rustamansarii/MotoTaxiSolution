import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import { formatCurrency } from '../utils/formatters';
import Icon from './Icon';

export const RideCard = ({
  ride,
  isSelected = false,
  onSelect,
  style,
}) => {
  if (!ride) return null;

  const vehicleType = (ride.vehicle_type || ride.iconType || '').toUpperCase();
  const isAuto = vehicleType.includes('AUTO') || vehicleType.includes('RICK');
  const isCar = vehicleType.includes('CAR') || vehicleType.includes('CAB');
  const isBike = !isAuto && !isCar;

  // Distinct visual styling per vehicle category
  const vehicleConfig = isCar
    ? { icon: 'car', bg: '#EEF2FF', iconColor: '#4F46E5', tagBg: '#EDE9FE', tagColor: '#6D28D9' }
    : isAuto
    ? { icon: 'auto', bg: '#FEF3C7', iconColor: '#D97706', tagBg: '#FEF3C7', tagColor: '#B45309' }
    : { icon: 'bike', bg: '#E6F9F5', iconColor: '#0D9488', tagBg: '#CCFBF1', tagColor: '#0F766E' };

  const currencySymbol =
    ride.currency === 'INR' ? '₹' : ride.currency === 'USD' ? '$' : ride.currency || '$';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onSelect && onSelect(ride)}
      style={[
        styles.card,
        isSelected ? styles.selectedCard : styles.unselectedCard,
        style,
      ]}
    >
      {/* Left Vehicle Avatar */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isSelected ? vehicleConfig.bg : '#F8FAFC' },
        ]}
      >
        <Icon
          name={vehicleConfig.icon}
          size={22}
          color={vehicleConfig.iconColor}
        />
      </View>

      {/* Ride Info (Name, Seats, ETA, Tag) */}
      <View style={styles.detailsContainer}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.rideName}>
            {ride.name}
          </Text>
          <View style={styles.seatsRow}>
            <Icon name="user" size={10} color="#64748B" />
            <Text style={styles.seatsText}>{ride.seats || 1}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.etaText}>{ride.eta || '3 mins away'}</Text>
          {ride.tag ? (
            <View
              style={[
                styles.tagBadge,
                { backgroundColor: isSelected ? vehicleConfig.tagBg : '#F1F5F9' },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: isSelected ? vehicleConfig.tagColor : '#475569' },
                ]}
              >
                {ride.tag}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Price Details */}
      <View style={styles.priceContainer}>
        <Text style={[styles.priceText, isSelected && styles.selectedPriceText]}>
          {formatCurrency(ride.price, currencySymbol)}
        </Text>
        {ride.originalPrice ? (
          <Text style={styles.originalPriceText}>
            {formatCurrency(ride.originalPrice, currencySymbol)}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    marginVertical: 4,
  },
  selectedCard: {
    backgroundColor: '#F0FDF9',
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  unselectedCard: {
    backgroundColor: COLORS.white,
    borderColor: '#E2E8F0',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rideName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
    letterSpacing: -0.2,
  },
  seatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: RADIUS.small,
  },
  seatsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  etaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginRight: 8,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.small,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  priceText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  selectedPriceText: {
    color: COLORS.primaryDark || '#0F766E',
  },
  originalPriceText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginTop: 1,
    fontWeight: '500',
  },
});

export default RideCard;
