import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { responsiveFont } from '../../utils/responsive';
import Icon from '../Icon';

/**
 * DestinationMarker renders the destination finish/flag pin with callout.
 * Visually distinct from the driver vehicle marker.
 */
export const DestinationMarker = ({
  title = 'Destination',
  address = '123 Main Street',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Callout Pill */}
      <View style={styles.calloutPill}>
        <Text style={styles.calloutTitle}>{title}</Text>
        {address && (
          <Text numberOfLines={1} style={styles.calloutAddress}>
            {address}
          </Text>
        )}
      </View>

      {/* Destination Pin */}
      <View style={styles.pinCircle}>
        <Icon name="flag" size={16} color={COLORS.white} />
      </View>

      {/* Pin pointer tip & shadow */}
      <View style={styles.pinTip} />
      <View style={styles.shadowOval} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutPill: {
    backgroundColor: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.medium,
    marginBottom: 4,
    maxWidth: 160,
    alignItems: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  calloutTitle: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  calloutAddress: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 1,
  },
  pinCircle: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimary,
    borderWidth: 2.5,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.secondPrimary,
    marginTop: -1,
  },
  shadowOval: {
    width: 14,
    height: 4,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.text,
    opacity: 0.2,
    marginTop: 2,
  },
});

export default DestinationMarker;
