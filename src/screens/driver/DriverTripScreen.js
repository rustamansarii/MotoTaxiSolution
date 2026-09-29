import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { RidesRouteMap } from '../../components/navigation';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';
import { ScrollView } from 'react-native';
import { formatCurrency } from '../../utils/formatters';
import {
  driverCompleteTrip,
  sendDriverLocationUpdate,
  clearActionNotices,
} from '../../redux/features/driver/driverSlice';
import { getCurrentLocation } from '../../utils/locationService';

export const DriverTripScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isSplitLayout, isFoldableOrTablet, insets, width } = useResponsive();
  const dispatch = useDispatch();

  const {
    rideStatus,
    actionError,
    actionLoading,
    activeRide,
    rideCancelledNotice,
  } = useSelector((state) => state.driver);

  const rideId =
    route.params?.ride_id ||
    route.params?.tripId ||
    activeRide?.ride_id ||
    1;
  const pickup =
    route.params?.pickup ||
    activeRide?.pickup_address ||
    activeRide?.pickup ||
    'Pickup Location';
  const destination =
    route.params?.destination ||
    activeRide?.drop_address ||
    activeRide?.destination_address ||
    activeRide?.destination ||
    'Destination';
  const passengerName =
    route.params?.passengerName ||
    activeRide?.rider_name ||
    activeRide?.passengerName ||
    'Rider';
  const estimatedFare =
    route.params?.estimatedFare ??
    activeRide?.driver_payout ??
    activeRide?.fare ??
    28.5;
  const currency =
    route.params?.currency ||
    activeRide?.currency ||
    'USD';
  const distance =
    route.params?.distance ||
    route.params?.tripDistance ||
    (activeRide?.distance_km !== undefined
      ? `${activeRide.distance_km} km`
      : '16.4 mi');

  const pickupCoords = useMemo(() => {
    if (route.params?.pickupCoordinates && route.params.pickupCoordinates.length === 2) {
      return [Number(route.params.pickupCoordinates[0]), Number(route.params.pickupCoordinates[1])];
    }
    const pLon = route.params?.pickup_lon ?? activeRide?.pickup_lon;
    const pLat = route.params?.pickup_lat ?? activeRide?.pickup_lat;
    if (pLon && pLat) {
      return [Number(pLon), Number(pLat)];
    }
    return [76.7835809, 30.6948328];
  }, [route.params, activeRide]);

  const dropCoords = useMemo(() => {
    if (route.params?.dropCoordinates && route.params.dropCoordinates.length === 2) {
      return [Number(route.params.dropCoordinates[0]), Number(route.params.dropCoordinates[1])];
    }
    const dLon = route.params?.drop_lon ?? activeRide?.drop_lon;
    const dLat = route.params?.drop_lat ?? activeRide?.drop_lat;
    if (dLon && dLat) {
      return [Number(dLon), Number(dLat)];
    }
    return [75.8573, 30.9005];
  }, [route.params, activeRide]);

  const numDistanceKm = useMemo(() => {
    const raw = route.params?.distance_km ?? activeRide?.distance_km;
    if (raw !== undefined && raw !== null) return Number(raw);
    const parsed = parseFloat(String(distance).replace(/[^\d.]/g, ''));
    return !isNaN(parsed) && parsed > 0 ? parsed : 91.56;
  }, [route.params, activeRide, distance]);

  const hasNavigatedRef = useRef(false);

  const navigateToCompleted = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigation.replace('DriverTripCompleted', {
      ride_id: rideId,
      destination,
      passengerName,
      fare: estimatedFare,
      currency,
      distance,
      duration: '32 mins',
    });
  }, [
    rideId,
    destination,
    passengerName,
    estimatedFare,
    currency,
    distance,
    navigation,
  ]);

  // Periodic location heartbeat every 10 seconds while on trip
  useEffect(() => {
    const pushInterval = setInterval(async () => {
      try {
        const loc = await getCurrentLocation();
        if (loc?.longitude && loc?.latitude) {
          dispatch(sendDriverLocationUpdate({ lat: loc.latitude, lng: loc.longitude }));
        }
      } catch (err) {
        console.warn('[DriverTrip] Location push error:', err);
      }
    }, 10000);

    return () => clearInterval(pushInterval);
  }, [dispatch]);

  // Listen for rider cancelling trip
  useEffect(() => {
    if (rideCancelledNotice) {
      Alert.alert('Ride Cancelled', 'The rider has cancelled this ride.');
      dispatch(clearActionNotices());
      navigation.navigate('DriverTabs', { screen: 'DriverHome' });
    }
  }, [rideCancelledNotice, dispatch, navigation]);

  // Listen for complete_trip_success from server
  useEffect(() => {
    if (rideStatus === 'completed') {
      navigateToCompleted();
    }
  }, [rideStatus, navigateToCompleted]);

  useEffect(() => {
    if (actionError) {
      Alert.alert('Trip Notice', actionError);
      dispatch(clearActionNotices());
    }
  }, [actionError, dispatch]);

  const handleEndTrip = () => {
    // Send {"type": "complete_trip", "ride_id": rideId}
    dispatch(driverCompleteTrip({ rideId }));
  };

  const mapPane = (
    <View style={styles.mapArea}>
      <RidesRouteMap
        pickupCoords={pickupCoords}
        dropCoords={dropCoords}
        pickupLabel={pickup}
        destinationLabel={destination}
        distanceKm={numDistanceKm}
        style={{ flex: 1, width: '100%', height: '100%' }}
      />
    </View>
  );

  const tripPane = (
    <View
      style={[
        styles.bottomCard,
        isSplitLayout && styles.sideCard,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.md, SPACING.xl),
        },
      ]}
    >
        <View style={styles.fareEtaRow}>
          <View>
            <Text style={styles.fareLabel}>{t('driver.tripEarnings')}</Text>
            <Text style={styles.fareAmount}>{formatCurrency(estimatedFare)}</Text>
          </View>

          <View style={styles.etaBadge}>
            <Text style={styles.etaVal}>18 {t('navigation.min')}</Text>
            <Text style={styles.etaDist}>8.4 mi</Text>
          </View>
        </View>

        {/* Dropoff Destination Row */}
        <View style={styles.destinationRow}>
          <View style={styles.destSquare} />
          <View style={styles.destCol}>
            <Text style={styles.destLabel}>{t('rider.dropoffLocation')}</Text>
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
            <Text style={styles.comfortText}>Moto Taxi Comfort</Text>
          </View>
        </View>

        {/* End Trip Button */}
        <CustomButton
          title={t('driver.completeTrip').toUpperCase()}
          onPress={handleEndTrip}
          loading={actionLoading}
          variant="primary"
          icon="check"
          iconPosition="right"
          style={styles.endTripBtn}
        />
      </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Navigation Header */}
      <View
        style={[
          styles.navHeader,
          {
            top: Math.max(insets.top + 10, 30),
            maxWidth: isFoldableOrTablet ? 540 : width - 32,
            alignSelf: 'center',
          },
        ]}
      >
        <View style={styles.turnIcon}>
          <Icon name="navigation" size={24} color={COLORS.white} />
        </View>
        <View style={styles.turnDetails}>
          <Text style={styles.turnDistance}>In 1.2 mi</Text>
          <Text numberOfLines={1} style={styles.turnInstruction}>
            {t('navigation.keepStraight')}
          </Text>
        </View>
      </View>

      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={
          isSplitLayout ? (
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {tripPane}
            </ScrollView>
          ) : (
            tripPane
          )
        }
        primaryRatio={0.6}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navHeader: {
    position: 'absolute',
    top: 50,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 10,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
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
    color: COLORS.primaryDark,
  },
  turnInstruction: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  speedGauge: {
    backgroundColor: COLORS.inputBg,
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
    color: COLORS.text,
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
  sideCard: {
    height: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
    justifyContent: 'center',
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
    color: COLORS.primaryDark,
  },
  etaDist: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
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
    backgroundColor: COLORS.secondPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  initials: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimaryDark,
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
    color: COLORS.primaryDark,
    fontSize: 11,
  },
  endTripBtn: {
    width: '100%',
  },
});

export default DriverTripScreen;
