import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
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
      {/* Left Icon / Avatar */}
      <View
        style={[
          styles.iconContainer,
          isSelected ? styles.selectedIconBg : styles.unselectedIconBg,
        ]}
      >
        <Icon
          name={ride.iconType === 'van' ? 'users' : 'car'}
          size={24}
          color={isSelected ? COLORS.secondBackgroundglass : COLORS.text}
        />
      </View>

      {/* Ride Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.rideName}>{ride.name}</Text>
          <View style={styles.seatsRow}>
            <Icon name="user" size={12} color={COLORS.textLight} />
            <Text style={styles.seatsText}>{ride.seats}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.etaText}>{ride.eta} away</Text>
          {ride.tag ? (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{ride.tag}</Text>
            </View>
          ) : null}
        </View>

        {ride.description ? (
          <Text numberOfLines={1} style={styles.descriptionText}>
            {ride.description}
          </Text>
        ) : null}
      </View>

      {/* Price Section */}
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>{formatCurrency(ride.price)}</Text>
        {ride.originalPrice ? (
          <Text style={styles.originalPriceText}>
            {formatCurrency(ride.originalPrice)}
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
    padding: SPACING.md,
    borderRadius: RADIUS.large,
    borderWidth: 2,
    marginVertical: SPACING.xs,
  },
  selectedCard: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  unselectedCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  selectedIconBg: {
    backgroundColor: COLORS.white,
  },
  unselectedIconBg: {
    backgroundColor: COLORS.inputBg,
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
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: SPACING.xs,
  },
  seatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.small,
  },
  seatsText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textLight,
    marginLeft: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  etaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginRight: SPACING.sm,
  },
  tagBadge: {
    backgroundColor: COLORS.secondPrimary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.small,
  },
  tagText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '600',
  },
  descriptionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  priceText: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  originalPriceText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
});

export default RideCard;
