import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Icon from '../Icon';

/**
 * DriverMarker renders a ride-booking navigation vehicle marker.
 * Supports heading rotation and optional ETA pill badge.
 */
export const DriverMarker = ({
  heading = 0,
  eta,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {eta && (
        <View style={styles.etaPill}>
          <Text style={styles.etaText}>{eta}</Text>
        </View>
      )}

      {/* Outer pulse halo */}
      <View style={styles.haloRing} />

      {/* Main vehicle disc */}
      <View
        style={[
          styles.markerDisc,
          {
            transform: [{ rotate: `${heading}deg` }],
          },
        ]}
      >
        {/* Navigation direction indicator notch */}
        <View style={styles.headingNotch} />
        <Icon name="car" size={18} color={COLORS.white} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  etaText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  haloRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: RADIUS.round,
    backgroundColor: 'rgba(65, 84, 254, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(65, 84, 254, 0.35)',
  },
  markerDisc: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimary,
    borderWidth: 2.5,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  headingNotch: {
    position: 'absolute',
    top: -4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.primary,
  },
});

export default DriverMarker;
