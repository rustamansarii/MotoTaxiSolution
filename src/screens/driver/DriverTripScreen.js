import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import MapPlaceholder from '../../components/MapPlaceholder';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import { formatCurrency } from '../../utils/formatters';

export const DriverTripScreen = ({ navigation, route }) => {
  const destination = route.params?.destination || 'JFK Terminal 4';
  const passengerName = route.params?.passengerName || 'Elena Rostova';
  const estimatedFare = route.params?.estimatedFare || 28.5;

  const handleEndTrip = () => {
    navigation.replace('DriverTripCompleted', {
      destination,
      passengerName,
      fare: estimatedFare,
      distance: '16.4 mi',
      duration: '32 mins',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundglass} />

      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <View style={styles.turnIcon}>
          <Icon name="navigation" size={24} color={COLORS.white} />
        </View>
        <View style={styles.turnDetails}>
          <Text style={styles.turnDistance}>In 1.2 mi</Text>
          <Text numberOfLines={1} style={styles.turnInstruction}>
            Keep Left on Grand Central Pkwy East
          </Text>
        </View>
        <View style={styles.speedGauge}>
          <Text style={styles.speedNum}>52</Text>
          <Text style={styles.speedLimit}>LIMIT 55</Text>
        </View>
      </View>

      {/* Map In-Transit */}
      <View style={styles.mapArea}>
        <MapPlaceholder
          showRoute={true}
          showPickupMarker={false}
          showDestinationMarker={true}
          showDriverMarker={true}
          destinationLabel="JFK Terminal 4"
          height="100%"
        />
      </View>

      {/* Bottom In-Transit Trip Panel */}
      <View style={styles.bottomCard}>
        <View style={styles.fareEtaRow}>
          <View>
            <Text style={styles.fareLabel}>Trip Earnings</Text>
            <Text style={styles.fareAmount}>{formatCurrency(estimatedFare)}</Text>
          </View>

          <View style={styles.etaBadge}>
            <Text style={styles.etaVal}>18 min</Text>
            <Text style={styles.etaDist}>8.4 mi left</Text>
          </View>
        </View>

        {/* Dropoff Destination Row */}
        <View style={styles.destinationRow}>
          <View style={styles.destSquare} />
          <View style={styles.destCol}>
            <Text style={styles.destLabel}>Drop-off Location</Text>
            <Text numberOfLines={1} style={styles.destAddress}>
              {destination}
            </Text>
          </View>
        </View>

        {/* Passenger Mini row */}
        <View style={styles.passengerBar}>
          <View style={styles.passengerAvatar}>
            <Text style={styles.initials}>{passengerName.charAt(0)}</Text>
          </View>
          <Text style={styles.passengerName}>{passengerName}</Text>
          <View style={styles.comfortBadge}>
            <Text style={styles.comfortText}>RideGo Comfort</Text>
          </View>
        </View>

        {/* End Trip Button */}
        <CustomButton
          title="COMPLETE & END TRIP"
          onPress={handleEndTrip}
          variant="primary"
          icon="check"
          iconPosition="right"
          style={styles.endTripBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundglass,
  },
  navHeader: {
    position: 'absolute',
    top: 50,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 10,
    backgroundColor: COLORS.backgroundglass,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.secondBackgroundglass,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  turnIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  turnDetails: {
    flex: 1,
  },
  turnDistance: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.primary,
  },
  turnInstruction: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 2,
  },
  speedGauge: {
    backgroundColor: COLORS.secondBackgroundglass,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  speedNum: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.white,
  },
  speedLimit: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.warning,
  },
  mapArea: {
    flex: 1,
  },
  bottomCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  fareEtaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  fareLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  fareAmount: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  etaBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    alignItems: 'flex-end',
  },
  etaVal: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.backgroundglass,
  },
  etaDist: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondBackgroundglass,
    fontSize: 10,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.md,
  },
  destSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
    marginRight: SPACING.md,
  },
  destCol: {
    flex: 1,
  },
  destLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  destAddress: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  passengerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  passengerAvatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.backgroundglass,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  initials: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.white,
  },
  passengerName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  comfortBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.small,
  },
  comfortText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.secondBackgroundglass,
    fontSize: 11,
  },
  endTripBtn: {
    width: '100%',
  },
});

export default DriverTripScreen;
