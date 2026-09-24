import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADIUS, SPACING } from '../theme/spacing';
import { TYPOGRAPHY } from '../theme/typography';
import Icon from './Icon';

export const MapPlaceholder = ({
  showRoute = true,
  showPickupMarker = true,
  showDestinationMarker = true,
  showDriverMarker = true,
  pickupLabel = '5th Ave & 58th St',
  destinationLabel = 'JFK Terminal 4',
  driverEta = '3 min',
  height = '100%',
  onRecenter,
  showControls = true,
  isDriverMode = false,
  style,
}) => {
  return (
    <View style={[styles.mapCanvas, { height }, style]}>
      {/* City blocks & road grid */}
      <View style={styles.gridOverlay}>
        <View style={styles.horizontalRoad1} />
        <View style={styles.horizontalRoad2} />
        <View style={styles.horizontalRoad3} />
        <View style={styles.verticalRoad1} />
        <View style={styles.verticalRoad2} />
        <View style={styles.verticalRoad3} />

        {/* River/Waterfront Feature */}
        <View style={styles.waterFeature} />

        {/* Park/Green Space */}
        <View style={styles.parkFeature}>
          <Text style={styles.featureLabel}>City Park</Text>
        </View>

        {/* Commercial Zone */}
        <View style={styles.commercialFeature}>
          <Text style={styles.featureLabel}>Midtown Center</Text>
        </View>
      </View>

      {/* Driver Surge / Hotspot Area (if in Driver mode) */}
      {isDriverMode && (
        <View style={styles.surgeZone}>
          <Icon name="flash" size={12} color={COLORS.primary} />
          <Text style={styles.surgeZoneText}>+$3.50 Surge</Text>
        </View>
      )}

      {/* Thematic Route using COLORS.secondPrimary */}
      {showRoute && (
        <View style={styles.routeContainer}>
          <View style={styles.routeSegment1} />
          <View style={styles.routeCorner} />
          <View style={styles.routeSegment2} />
          <View style={styles.routeSegment3} />
        </View>
      )}

      {/* Driver Marker using COLORS.secondPrimary */}
      {showDriverMarker && (
        <View style={styles.driverMarkerContainer}>
          <View style={styles.driverMarkerPill}>
            <Text style={styles.driverEtaText}>{driverEta}</Text>
          </View>
          <View style={styles.driverMarker}>
            <Icon name="bike" size={16} color={COLORS.white} />
          </View>
        </View>
      )}

      {/* Pickup Marker using COLORS.primary */}
      {showPickupMarker && (
        <View style={styles.pickupMarkerContainer}>
          <View style={styles.pickupCallout}>
            <Text numberOfLines={1} style={styles.pickupCalloutText}>
              {pickupLabel}
            </Text>
          </View>
          <View style={styles.pickupPin}>
            <View style={styles.pickupPinCore} />
          </View>
          <View style={styles.pinShadow} />
        </View>
      )}

      {/* Destination Marker using COLORS.secondPrimary */}
      {showDestinationMarker && (
        <View style={styles.destinationMarkerContainer}>
          <View style={styles.destinationCallout}>
            <Text numberOfLines={1} style={styles.destinationCalloutText}>
              {destinationLabel}
            </Text>
          </View>
          <View style={styles.destinationPin}>
            <Icon name="navigation" size={14} color={COLORS.white} />
          </View>
          <View style={styles.pinShadow} />
        </View>
      )}

      {/* Map Interactive Controls */}
      {showControls && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRecenter}
            style={styles.controlButton}
          >
            <Icon name="crosshair" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.controlButton}>
            <Icon name="plus" size={16} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.controlButton}>
            <Icon name="minus" size={16} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapCanvas: {
    width: '100%',
    backgroundColor: COLORS.background,
    overflow: 'hidden',
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  horizontalRoad1: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  horizontalRoad2: {
    position: 'absolute',
    top: '55%',
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  horizontalRoad3: {
    position: 'absolute',
    top: '78%',
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  verticalRoad1: {
    position: 'absolute',
    left: '22%',
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  verticalRoad2: {
    position: 'absolute',
    left: '60%',
    top: 0,
    bottom: 0,
    width: 26,
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  verticalRoad3: {
    position: 'absolute',
    right: '10%',
    top: 0,
    bottom: 0,
    width: 16,
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  waterFeature: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.6,
  },
  parkFeature: {
    position: 'absolute',
    top: '8%',
    right: '15%',
    width: 90,
    height: 70,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  commercialFeature: {
    position: 'absolute',
    bottom: '28%',
    left: '8%',
    width: 80,
    height: 60,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  surgeZone: {
    position: 'absolute',
    top: '32%',
    right: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  surgeZoneText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 11,
  },
  routeContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  routeSegment1: {
    position: 'absolute',
    top: '42%',
    left: '28%',
    width: '34%',
    height: 6,
    backgroundColor: COLORS.secondPrimary,
    borderRadius: 3,
  },
  routeCorner: {
    position: 'absolute',
    top: '42%',
    left: '61%',
    width: 6,
    height: '24%',
    backgroundColor: COLORS.secondPrimary,
    borderRadius: 3,
  },
  routeSegment2: {
    position: 'absolute',
    top: '65%',
    left: '61%',
    width: '24%',
    height: 6,
    backgroundColor: COLORS.secondPrimary,
    borderRadius: 3,
  },
  routeSegment3: {
    position: 'absolute',
    top: '65%',
    left: '84%',
    width: 6,
    height: '14%',
    backgroundColor: COLORS.secondPrimary,
    borderRadius: 3,
  },
  driverMarkerContainer: {
    position: 'absolute',
    top: '40%',
    left: '42%',
    alignItems: 'center',
  },
  driverMarkerPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.small,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  driverEtaText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
  },
  driverMarker: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimary,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pickupMarkerContainer: {
    position: 'absolute',
    top: '38%',
    left: '20%',
    alignItems: 'center',
  },
  pickupCallout: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
    marginBottom: 4,
    maxWidth: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  pickupCalloutText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 10,
  },
  pickupPin: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  pickupPinCore: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.white,
  },
  destinationMarkerContainer: {
    position: 'absolute',
    top: '76%',
    right: '10%',
    alignItems: 'center',
  },
  destinationCallout: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
    marginBottom: 4,
    maxWidth: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  destinationCalloutText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 10,
  },
  destinationPin: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimary,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  pinShadow: {
    width: 14,
    height: 4,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.text,
    opacity: 0.15,
    marginTop: 2,
  },
  controlsContainer: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.xl,
    gap: SPACING.xs,
  },
  controlButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default MapPlaceholder;
