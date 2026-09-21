import React, { useState, useEffect } from 'react';
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
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useResponsive } from '../../utils/responsive';
import { ScrollView } from 'react-native';
import { formatCurrency } from '../../utils/formatters';

export const RideRequestScreen = ({ navigation, route }) => {
  const { isSplitLayout, insets } = useResponsive();
  const pickup = route.params?.pickup || 'Corner of 5th Ave & 59th St';
  const destination = route.params?.destination || 'JFK Terminal 4';
  const passengerName = route.params?.passengerName || 'Elena Rostova';
  const passengerRating = route.params?.passengerRating || '4.95';
  const estimatedFare = route.params?.estimatedFare || 28.5;
  const distanceToPickup = route.params?.distanceToPickup || '0.6 mi';
  const timeToPickup = route.params?.timeToPickup || '3 mins';
  const tripDistance = route.params?.tripDistance || '16.4 mi';

  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (countdown <= 0) {
      navigation.goBack();
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown, navigation]);

  const handleAccept = () => {
    navigation.replace('DriverAcceptedRide', {
      pickup,
      destination,
      passengerName,
      passengerRating,
      estimatedFare,
      distanceToPickup,
      timeToPickup,
    });
  };

  const mapPane = (
    <View style={isSplitLayout ? styles.mapAreaSplit : styles.mapArea}>
      <MapPlaceholder
        showRoute={true}
        showPickupMarker={true}
        showDestinationMarker={true}
        showDriverMarker={true}
        pickupLabel={pickup}
        destinationLabel={destination}
        height="100%"
      />
    </View>
  );

  const requestSheetPane = (
    <View
      style={[
        styles.sheetContainer,
        isSplitLayout && styles.sideSheetContainer,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.md, SPACING.xl),
        },
      ]}
    >
        {/* Countdown Pill */}
        <View style={styles.countdownRow}>
          <View style={styles.timerCircle}>
            <Text style={styles.timerNumber}>{countdown}</Text>
          </View>
          <Text style={styles.timerLabel}>Seconds to respond</Text>
        </View>

        {/* Fare Highlight */}
        <View style={styles.fareSection}>
          <Text style={styles.fareLabel}>Trip Earnings</Text>
          <Text style={styles.fareAmount}>{formatCurrency(estimatedFare)}</Text>
          <View style={styles.surgeTag}>
            <Text style={styles.surgeText}>Includes +$3.50 Surge Bonus</Text>
          </View>
        </View>

        {/* Passenger Info */}
        <View style={styles.passengerRow}>
          <View style={styles.passengerAvatar}>
            <Text style={styles.passengerInitials}>
              {passengerName.charAt(0)}
            </Text>
          </View>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>{passengerName}</Text>
            <View style={styles.ratingRow}>
              <Icon name="star" size={12} color={COLORS.primary} />
              <Text style={styles.ratingText}>{passengerRating}</Text>
              <Text style={styles.categoryText}>• RideGo Comfort</Text>
            </View>
          </View>
          <View style={styles.pickupDistBadge}>
            <Text style={styles.pickupDistVal}>{distanceToPickup}</Text>
            <Text style={styles.pickupTimeVal}>{timeToPickup} away</Text>
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.routeBox}>
          <View style={styles.routePoint}>
            <View style={styles.dotPickup} />
            <Text numberOfLines={1} style={styles.routePointText}>
              {pickup}
            </Text>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routePoint}>
            <View style={styles.squareDest} />
            <Text numberOfLines={1} style={styles.routePointText}>
              {destination} ({tripDistance})
            </Text>
          </View>
        </View>

        {/* Actions Accept / Decline */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.declineBtn}
          >
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>

          <View style={styles.acceptBtnWrapper}>
            <CustomButton
              title="ACCEPT TRIP"
              onPress={handleAccept}
              variant="primary"
              icon="check"
              iconPosition="right"
              style={styles.acceptBtn}
            />
          </View>
        </View>
      </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundglass} />
      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={
          isSplitLayout ? (
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {requestSheetPane}
            </ScrollView>
          ) : (
            requestSheetPane
          )
        }
        primaryRatio={0.52}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundglass,
  },
  mapArea: {
    height: '38%',
  },
  mapAreaSplit: {
    flex: 1,
    height: '100%',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundglass,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'space-between',
  },
  sideSheetContainer: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 2,
    borderTopWidth: 0,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  timerCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  timerNumber: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.backgroundglass,
  },
  timerLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  fareSection: {
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  fareLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  fareAmount: {
    ...TYPOGRAPHY.h1,
    fontSize: 38,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  surgeTag: {
    backgroundColor: COLORS.secondBackgroundglass,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    marginTop: 4,
  },
  surgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: 11,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondBackgroundglass,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
  },
  passengerAvatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.backgroundglass,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  passengerInitials: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.white,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.white,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 3,
  },
  categoryText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  pickupDistBadge: {
    alignItems: 'flex-end',
  },
  pickupDistVal: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.white,
  },
  pickupTimeVal: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
  },
  routeBox: {
    backgroundColor: COLORS.secondBackgroundglass,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotPickup: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },
  squareDest: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
    marginRight: SPACING.md,
  },
  routeConnector: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.backgroundglass,
    marginLeft: 3,
    marginVertical: 2,
  },
  routePointText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  declineBtn: {
    height: 52,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.large,
    backgroundColor: COLORS.secondBackgroundglass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  declineText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.white,
  },
  acceptBtnWrapper: {
    flex: 1,
  },
  acceptBtn: {
    width: '100%',
  },
});

export default RideRequestScreen;
