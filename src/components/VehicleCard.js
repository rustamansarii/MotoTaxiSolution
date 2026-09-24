import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import Icon from './Icon';

export const VehicleCard = ({
  vehicle,
  isSelected = false,
  onSelect,
  style,
}) => {
  if (!vehicle) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onSelect && onSelect(vehicle)}
      style={[
        styles.card,
        isSelected ? styles.selectedCard : styles.unselectedCard,
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Icon name="bike" size={22} color={COLORS.secondPrimary} />
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.nameText}>{vehicle.name}</Text>
          <Text style={styles.modelText}>{vehicle.model}</Text>
        </View>
        <View style={styles.capacityBadge}>
          <Icon name="users" size={12} color={COLORS.textLight} />
          <Text style={styles.capacityText}>{vehicle.capacity}</Text>
        </View>
      </View>

      {/* Features pills */}
      {vehicle.features && vehicle.features.length > 0 && (
        <View style={styles.featuresRow}>
          {vehicle.features.map((feature, index) => (
            <View key={index} style={styles.featurePill}>
              <Icon name="check" size={11} color={COLORS.primary} style={{ marginRight: 3 }} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
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
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoCol: {
    flex: 1,
  },
  nameText: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
  },
  modelText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.small,
  },
  capacityText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginLeft: 4,
    fontWeight: '600',
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.text,
  },
});

export default VehicleCard;
