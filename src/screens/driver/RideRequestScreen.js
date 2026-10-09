import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
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
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { ScrollView } from 'react-native';
import { formatCurrency } from '../../utils/formatters';
import {
  driverAcceptRide,
  driverRejectRide,
  clearIncomingRideRequest,
  clearActionNotices,
} from '../../redux/features/driver/driverSlice';
import {
  resolveDropCoordinates,
  resolvePickupCoordinates,
  geocodeAddress,
} from '../../utils/coordinateResolver';

export const RideRequestScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isSplitLayout, insets } = useResponsive();
  const dispatch = useDispatch();

  const {
    rideStatus,
    rideTakenNotice,
    actionError,
    actionLoading,
    incomingRideRequest,
    activeRide,
  } = useSelector((state) => state.driver);

  const incomingReq = incomingRideRequest;

  const rideId =
    route.params?.ride_id ||
    route.params?.tripId ||
    incomingReq?.ride_id ||
    incomingReq?.trip_id ||
    activeRide?.ride_id ||
    1;
  const extractString = (val, fallback = '') => {
    if (typeof val === 'string' && val.trim()) return val;
    if (val && typeof val === 'object') {
      return val.address || val.display_name || val.name || val.shortAddress || fallback;
    }
    return fallback;
  };

  const pickup = useMemo(() => {
    return extractString(
      route.params?.pickup ||
        incomingReq?.pickup_address ||
        incomingReq?.pickup ||
        activeRide?.pickup_address,
      'Pickup Location'
    );
  }, [route.params?.pickup, incomingReq?.pickup_address, incomingReq?.pickup, activeRide?.pickup_address]);

  const destination = useMemo(() => {
    return extractString(
      route.params?.destination ||
        incomingReq?.drop_address ||
        incomingReq?.destination_address ||
        incomingReq?.destination ||
        activeRide?.drop_address,
      'Destination'
    );
  }, [
    route.params?.destination,
    incomingReq?.drop_address,
    incomingReq?.destination_address,
    incomingReq?.destination,
    activeRide?.drop_address,
  ]);

  const passengerName = useMemo(() => {
    const raw =
      route.params?.passengerName ||
      incomingReq?.rider_name ||
      incomingReq?.passengerName ||
      activeRide?.rider_name;
    if (typeof raw === 'string' && raw.trim()) return raw;
    if (raw && typeof raw === 'object') {
      return raw.name || raw.full_name || 'Rider';
    }
    return 'Rider';
  }, [route.params?.passengerName, incomingReq?.rider_name, incomingReq?.passengerName, activeRide?.rider_name]);
  const passengerRating =
    route.params?.passengerRating ||
    (incomingReq?.rider_rating ? String(incomingReq.rider_rating) : '4.95');
  const estimatedFare =
    route.params?.estimatedFare ??
    incomingReq?.driver_payout ??
    incomingReq?.fare ??
    activeRide?.driver_payout ??
    28.5;
  const currency =
    route.params?.currency ||
    incomingReq?.currency ||
    activeRide?.currency ||
    'USD';
  const distanceToPickup =
    route.params?.distanceToPickup || incomingReq?.distance_to_pickup || 'Nearby';
  const timeToPickup =
    route.params?.timeToPickup || incomingReq?.time_to_pickup || '3 mins';
  const tripDistance =
    route.params?.tripDistance ||
    (incomingReq?.distance_km !== undefined
      ? `${incomingReq.distance_km} km`
      : incomingReq?.trip_distance || '16.4 mi');
  const vehicleType =
    route.params?.vehicleType ||
    route.params?.vehicle_type ||
    incomingReq?.vehicle_type ||
    activeRide?.vehicle_type ||
    'CAR';

  const pickupCoords = useMemo(() => {
    return resolvePickupCoordinates(route.params, incomingReq, pickup);
  }, [route.params, incomingReq, pickup]);

  const [dropCoords, setDropCoords] = useState(() => {
    return resolveDropCoordinates(route.params, incomingReq, destination);
  });

  // Sync drop coordinates when params/incomingReq update
  useEffect(() => {
    setDropCoords(resolveDropCoordinates(route.params, incomingReq, destination));
  }, [route.params, incomingReq, destination]);

  // Geocode dynamically if explicit coordinates were missing from server
  useEffect(() => {
    const hasExplicitCoords =
      (route.params?.dropCoordinates && route.params.dropCoordinates.length === 2) ||
      ((route.params?.drop_lon || incomingReq?.drop_lon) &&
        (route.params?.drop_lat || incomingReq?.drop_lat));

    if (!hasExplicitCoords && destination) {
      geocodeAddress(destination).then((resolved) => {
        if (resolved && Array.isArray(resolved) && resolved.length === 2) {
          setDropCoords(resolved);
        }
      });
    }
  }, [destination, route.params, incomingReq]);

  const numDistanceKm = useMemo(() => {
    const raw = route.params?.distance_km ?? incomingReq?.distance_km;
    if (raw !== undefined && raw !== null) return Number(raw);
    const parsed = parseFloat(String(tripDistance).replace(/[^\d.]/g, ''));
    return !isNaN(parsed) && parsed > 0 ? parsed : 91.56;
  }, [route.params, incomingReq, tripDistance]);

  const [countdown, setCountdown] = useState(30);
  const hasNavigatedRef = useRef(false);

  const navigateToAccepted = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigation.replace('DriverAcceptedRide', {
      ride_id: rideId,
      pickup,
      destination,
      passengerName,
      passengerRating,
      estimatedFare,
      currency,
      tripDistance,
      vehicleType,
      vehicle_type: vehicleType,
      distanceToPickup,
      timeToPickup,
      pickupCoordinates: pickupCoords,
      dropCoordinates: dropCoords,
      pickup_lat: pickupCoords?.[1],
      pickup_lon: pickupCoords?.[0],
      drop_lat: dropCoords?.[1],
      drop_lon: dropCoords?.[0],
      distance_km: numDistanceKm,
    });
  }, [
    rideId,
    pickup,
    destination,
    passengerName,
    passengerRating,
    estimatedFare,
    currency,
    tripDistance,
    vehicleType,
    distanceToPickup,
    timeToPickup,
    pickupCoords,
    dropCoords,
    navigation,
  ]);

  const dismissToHome = useCallback((alertMsg = null) => {
    // If the driver is already on an active or accepted ride, NEVER dismiss or exit!
    if (rideStatus === 'accepted' || rideStatus === 'arrived' || rideStatus === 'in_progress') {
      return;
    }
    dispatch(clearActionNotices());
    dispatch(clearIncomingRideRequest());
    if (alertMsg) {
      Alert.alert('Ride Notice', alertMsg);
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      const parent = navigation.getParent();
      if (parent && parent.canGoBack()) {
        parent.goBack();
      } else {
        navigation.navigate('DriverTabs', { screen: 'DriverHome' });
      }
    }
  }, [dispatch, navigation, rideStatus]);

  useEffect(() => {
    // Stop countdown immediately if ride is accepted, in progress, or no longer requested
    if (rideStatus !== 'requested') {
      return;
    }
    if (countdown <= 0) {
      console.log('[RideRequest] Request countdown expired for ride:', rideId);
      dismissToHome();
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown, rideId, rideStatus, dismissToHome]);

  // Listen for ride taken by another driver or offer expired
  useEffect(() => {
    if (rideTakenNotice) {
      const takenId = rideTakenNotice.ride_id || rideTakenNotice.id;
      if (!takenId || String(takenId) === String(rideId)) {
        const isExpired =
          rideTakenNotice.type === 'ride_expired' ||
          rideTakenNotice.type === 'offer_expired';
        dismissToHome(
          isExpired
            ? 'This ride request has expired.'
            : 'This ride has already been accepted by another driver.'
        );
      }
    }
  }, [rideTakenNotice, rideId, dismissToHome]);

  // If the incoming ride was cleared and driver is back to idle, dismiss screen
  useEffect(() => {
    if (!incomingRideRequest && rideStatus === 'idle' && !activeRide) {
      dismissToHome();
    }
  }, [incomingRideRequest, rideStatus, activeRide, dismissToHome]);

  // Listen for accept success from WebSocket or already active ride
  useEffect(() => {
    if (
      rideStatus === 'accepted' ||
      rideStatus === 'arrived' ||
      rideStatus === 'in_progress'
    ) {
      navigateToAccepted();
    }
  }, [rideStatus, navigateToAccepted]);

  useEffect(() => {
    if (actionError) {
      const errLower = String(actionError).toLowerCase();
      if (
        errLower.includes('already') ||
        errLower.includes('expired') ||
        errLower.includes('not found') ||
        errLower.includes('taken')
      ) {
        dismissToHome('This ride is no longer available.');
      } else {
        Alert.alert('Request Notice', actionError);
        dispatch(clearActionNotices());
      }
    }
  }, [actionError, dispatch, dismissToHome]);

  const handleAccept = () => {
    // Send {"type": "accept_ride", "ride_id": rideId}
    dispatch(driverAcceptRide({ rideId }));
  };

  const handleDecline = () => {
    // Send {"type": "reject_ride", "ride_id": rideId} only if still active
    if (incomingRideRequest && String(incomingRideRequest.ride_id) === String(rideId)) {
      dispatch(driverRejectRide({ rideId }));
    }
    dismissToHome();
  };

  const mapPane = (
    <View style={isSplitLayout ? styles.mapAreaSplit : styles.mapArea}>
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
          <Text style={styles.fareLabel}>{t('driver.tripEarnings')}</Text>
          <Text style={styles.fareAmount}>
            {formatCurrency(estimatedFare, currency === 'USD' ? '$' : currency)}
          </Text>
          <View style={styles.surgeTag}>
            <Text style={styles.surgeText}>
              {vehicleType ? `${vehicleType} • Guaranteed Payout` : 'Guaranteed Payout'}
            </Text>
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
              <Text style={styles.categoryText}>• Moto Taxi {vehicleType || 'Comfort'}</Text>
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
            onPress={handleDecline}
            style={styles.declineBtn}
          >
            <Text style={styles.declineText}>{t('driver.declineRide')}</Text>
          </TouchableOpacity>

          <View style={styles.acceptBtnWrapper}>
            <CustomButton
              title={t('driver.acceptRide').toUpperCase()}
              onPress={handleAccept}
              loading={actionLoading}
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
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
        primaryRatio={0.46}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mapArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapAreaSplit: {
    flex: 1,
    height: '100%',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  sideSheetContainer: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
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
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  timerNumber: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.white,
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
    fontSize: responsiveFont(38),
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  surgeTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
    marginTop: 4,
  },
  surgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
    fontSize: responsiveFont(11),
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passengerAvatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  passengerInitials: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.secondPrimaryDark,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
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
    color: COLORS.text,
  },
  pickupTimeVal: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  routeBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  routePointText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
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
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  declineText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.danger,
  },
  acceptBtnWrapper: {
    flex: 1,
  },
  acceptBtn: {
    width: '100%',
  },
  langFloating: {
    position: 'absolute',
    right: SPACING.md,
    zIndex: 99,
  },
});

export default RideRequestScreen;
