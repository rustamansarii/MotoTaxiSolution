import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import Icon from './Icon';

export const LocationInput = ({
  pickupValue,
  destinationValue,
  onPickupChange,
  onDestinationChange,
  onPickupPress,
  onDestinationPress,
  onSwap,
  editable = true,
  showSwap = true,
  pickupPlaceholder = 'Current location',
  destinationPlaceholder = 'Where to?',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Visual route indicator dots and line */}
      <View style={styles.indicatorCol}>
        <View style={styles.pickupDot} />
        <View style={styles.dashedLine} />
        <View style={styles.destinationSquare} />
      </View>

      {/* Input Fields */}
      <View style={styles.inputsCol}>
        {/* Pickup Row */}
        <TouchableOpacity
          activeOpacity={editable ? 1 : 0.7}
          onPress={!editable && onPickupPress ? onPickupPress : undefined}
          style={styles.inputWrapper}
        >
          {editable ? (
            <TextInput
              value={pickupValue}
              onChangeText={onPickupChange}
              placeholder={pickupPlaceholder}
              placeholderTextColor={COLORS.textLight}
              style={styles.textInput}
              onFocus={onPickupPress}
            />
          ) : (
            <Text
              numberOfLines={1}
              style={[
                styles.readOnlyText,
                !pickupValue && styles.placeholderText,
              ]}
            >
              {pickupValue || pickupPlaceholder}
            </Text>
          )}
          {editable && pickupValue ? (
            <TouchableOpacity
              onPress={() => onPickupChange && onPickupChange('')}
              style={styles.clearBtn}
            >
              <Icon name="x" size={14} color={COLORS.iconLight} />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Destination Row */}
        <TouchableOpacity
          activeOpacity={editable ? 1 : 0.7}
          onPress={!editable && onDestinationPress ? onDestinationPress : undefined}
          style={styles.inputWrapper}
        >
          {editable ? (
            <TextInput
              value={destinationValue}
              onChangeText={onDestinationChange}
              placeholder={destinationPlaceholder}
              placeholderTextColor={COLORS.textLight}
              style={styles.textInput}
              onFocus={onDestinationPress}
            />
          ) : (
            <Text
              numberOfLines={1}
              style={[
                styles.readOnlyText,
                !destinationValue && styles.placeholderText,
              ]}
            >
              {destinationValue || destinationPlaceholder}
            </Text>
          )}
          {editable && destinationValue ? (
            <TouchableOpacity
              onPress={() => onDestinationChange && onDestinationChange('')}
              style={styles.clearBtn}
            >
              <Icon name="x" size={14} color={COLORS.iconLight} />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Optional Swap Button */}
      {showSwap && onSwap && (
        <TouchableOpacity
          onPress={onSwap}
          activeOpacity={0.7}
          style={styles.swapButton}
        >
          <Icon name="refresh" size={16} color={COLORS.secondPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  indicatorCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    marginRight: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
  },
  dashedLine: {
    width: 2,
    height: 32,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  destinationSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
  },
  inputsCol: {
    flex: 1,
  },
  inputWrapper: {
    height: 38,
    justifyContent: 'center',
  },
  textInput: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '500',
    color: COLORS.text,
    paddingVertical: 0,
  },
  readOnlyText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '500',
    color: COLORS.text,
  },
  placeholderText: {
    color: COLORS.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  clearBtn: {
    position: 'absolute',
    right: 0,
    padding: SPACING.xs,
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
});

export default LocationInput;
