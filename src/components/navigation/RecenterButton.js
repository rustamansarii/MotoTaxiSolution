import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS } from '../../theme/spacing';
import Icon from '../Icon';

/**
 * RecenterButton (◎)
 * Floating control to snap and center the MapLibre camera back to the driver position.
 */
export const RecenterButton = ({ onPress, style }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel="Re-center map to driver position"
    >
      <View style={styles.innerIcon}>
        <Icon name="crosshair" size={22} color={COLORS.secondPrimary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  innerIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RecenterButton;
