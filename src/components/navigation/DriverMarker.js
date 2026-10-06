import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { responsiveFont } from '../../utils/responsive';
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
      {eta ? (
        <View style={styles.etaPillContainer}>
          <View style={styles.etaPill}>
            <Text style={styles.etaText}>{eta}</Text>
          </View>
          <View style={styles.etaArrow} />
        </View>
      ) : null}

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
        <Icon name="bike" size={18} color={COLORS.white} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaPillContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  etaPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  etaArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.white,
    marginTop: -1,
  },
  etaText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    fontWeight: '800',
    color: '#0F172A',
  },
  haloRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.35)',
  },
  markerDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1D4ED8',
    borderWidth: 2.5,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
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
