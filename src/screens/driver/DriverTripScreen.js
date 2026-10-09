import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { ScrollView } from 'react-native';
import { formatCurrency } from '../../utils/formatters';
import {
  driverCompleteTrip,
  sendDriverLocationUpdate,
  clearActionNotices,
} from '../../redux/features/driver/driverSlice';
import {
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
} from '../../utils/locationService';
import {
  resolveDropCoordinates,
  resolvePickupCoordinates,
} from '../../utils/coordinateResolver';
import { getVehicleIconName } from '../../utils/vehicleAssets';

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
    distanceRemainingKm,
    etaMin,
    lastLocationAck,
    currentLocation,
  } = useSelector((state) => state.driver);

  const rideId =
    route.params?.ride_id ||
    route.params?.tripId ||
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
      route.params?.pickup || activeRide?.pickup_address || activeRide?.pickup,
      'Pickup Location'
    );
  }, [route.params?.pickup, activeRide?.pickup_address, activeRide?.pickup]);

  const destination = useMemo(() => {
    return extractString(
      route.params?.destination ||
        activeRide?.drop_address ||
        activeRide?.destination_address ||
        activeRide?.drop ||
        activeRide?.destination,
      'Destination'
    );
  }, [
    route.params?.destination,
    activeRide?.drop_address,
    activeRide?.destination_address,
    activeRide?.drop,
    activeRide?.destination,
  ]);

  const passengerName = useMemo(() => {
    const raw =
      route.params?.passengerName ||
      activeRide?.rider_name ||
      activeRide?.passengerName ||
      activeRide?.rider;
    if (typeof raw === 'string' && raw.trim()) return raw;
    if (raw && typeof raw === 'object') {
      return raw.name || raw.full_name || 'Rider';
    }
    return 'Rider';
  }, [route.params?.passengerName, activeRide?.rider_name, activeRide?.passengerName, activeRide?.rider]);
  const estimatedFare =
    route.params?.estimatedFare ??
    activeRide?.driver_payout ??
    activeRide?.fare ??
    28.5;
  const currency =
    route.params?.currency ||
    activeRide?.currency ||
    'USD';
  const tripDistance =
    route.params?.tripDistance ||
    route.params?.distance ||
    (activeRide?.distance_km !== undefined
      ? `${activeRide.distance_km} km`
      : '16.4 mi');
  const distance = tripDistance;
  const rawVehicleType =
    route.params?.vehicle_type ||
    route.params?.vehicleType ||
    route.params?.ride?.vehicle_type ||
    activeRide?.vehicle_type ||
    activeRide?.vehicleType ||
    'CAR';
  const vehicleType = String(rawVehicleType).trim().toUpperCase();
  const vehicleIcon = getVehicleIconName(vehicleType);

  const pickupCoords = useMemo(() => {
    if (route.params?.pickupCoordinates && route.params.pickupCoordinates.length === 2) {
      return [Number(route.params.pickupCoordinates[0]), Number(route.params.pickupCoordinates[1])];
    }
    const pLon =
      route.params?.pickup_lon ??
      activeRide?.pickup_lon ??
      activeRide?.pickup_longitude;
    const pLat =
      route.params?.pickup_lat ??
      activeRide?.pickup_lat ??
      activeRide?.pickup_latitude;
    if (pLon && pLat) {
      return [Number(pLon), Number(pLat)];
    }
    return [76.7835809, 30.6948328];
  }, [
    route.params?.pickupCoordinates,
    route.params?.pickup_lon,
    route.params?.pickup_lat,
    activeRide?.pickup_lon,
    activeRide?.pickup_lat,
  ]);

  const dropCoords = useMemo(() => {
    return resolveDropCoordinates(route.params, activeRide, destination);
  }, [
    route.params,
    activeRide,
    destination,
  ]);

  const numDistanceKm = useMemo(() => {
    const raw = route.params?.distance_km ?? activeRide?.distance_km;
    if (raw !== undefined && raw !== null) return Number(raw);
    const parsed = parseFloat(String(distance).replace(/[^\d.]/g, ''));
    return !isNaN(parsed) && parsed > 0 ? parsed : 2.5;
  }, [route.params, activeRide, distance]);

  // Live driver position: tracks GPS and Redux location updates while ON_TRIP
  const [driverCoords, setDriverCoords] = useState(() => {
    if (route.params?.driverCoordinates && route.params.driverCoordinates.length === 2) {
      return [Number(route.params.driverCoordinates[0]), Number(route.params.driverCoordinates[1])];
    }
    const ackLat = lastLocationAck?.lat ?? currentLocation?.lat;
    const ackLng = lastLocationAck?.lng ?? currentLocation?.lng;
    if (ackLat && ackLng) {
      return [Number(ackLng), Number(ackLat)];
    }
    return pickupCoords;
  });

  // Keep driver position synced when Redux location updates
  useEffect(() => {
    const lat = lastLocationAck?.lat ?? currentLocation?.lat;
    const lng = lastLocationAck?.lng ?? currentLocation?.lng;
    if (lat && lng) {
      const numLng = Number(lng);
      const numLat = Number(lat);
      setDriverCoords((prev) => {
        if (
          prev &&
          Math.abs(prev[0] - numLng) < 0.00002 &&
          Math.abs(prev[1] - numLat) < 0.00002
        ) {
          return prev;
        }
        return [numLng, numLat];
      });
    }
  }, [lastLocationAck, currentLocation]);

  // Continuous GPS tracking
  useEffect(() => {
    let watchId = null;
    let isMounted = true;

    getCurrentLocation()
      .then((loc) => {
        if (isMounted && loc?.longitude && loc?.latitude) {
          setDriverCoords([loc.longitude, loc.latitude]);
          dispatch(sendDriverLocationUpdate({ lat: loc.latitude, lng: loc.longitude }));
        }
      })
      .catch((err) => console.warn('[DriverTrip] Initial GPS failed:', err));

    watchLocation(
      (loc) => {
        if (isMounted && loc?.longitude && loc?.latitude) {
          setDriverCoords((prev) => {
            if (prev) {
              const distMoved = Math.hypot(prev[0] - loc.longitude, prev[1] - loc.latitude);
              if (distMoved < 0.00004) return prev; // Filter GPS micro-jitter (< ~4m)
            }
            return [loc.longitude, loc.latitude];
          });
        }
      },
      (err) => console.warn('[DriverTrip] Location watch error:', err)
    ).then((id) => {
      watchId = id;
    });

    return () => {
      isMounted = false;
      if (watchId !== null) {
        clearLocationWatch(watchId);
      }
    };
  }, [dispatch]);

  // Periodic location heartbeat every 10 seconds while on trip
  useEffect(() => {
    const pushInterval = setInterval(() => {
      const lat = driverCoords[1] || pickupCoords[1];
      const lng = driverCoords[0] || pickupCoords[0];
      dispatch(sendDriverLocationUpdate({ lat, lng }));
    }, 10000);

    return () => clearInterval(pushInterval);
  }, [dispatch, driverCoords, pickupCoords]);

  const hasNavigatedRef = useRef(false);

  // Listen for rider cancelling trip
  useEffect(() => {
    if (rideCancelledNotice) {
      const noticeRideId = rideCancelledNotice.ride_id || rideCancelledNotice.id;
      if (!noticeRideId || String(noticeRideId) === String(rideId)) {
        Alert.alert('Ride Cancelled', 'The rider has cancelled this ride.');
        dispatch(clearActionNotices());
        navigation.navigate('DriverTabs', { screen: 'DriverHome' });
      } else {
        dispatch(clearActionNotices());
      }
    }
  }, [rideCancelledNotice, rideId, dispatch, navigation]);

  const navigateToCompleted = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigation.replace('DriverTripCompleted', {
      ride_id: rideId,
      pickup,
      destination,
      passengerName,
      fare: estimatedFare,
      currency,
      distance: displayDistance || distance,
      duration: etaMin ? `${etaMin} mins` : '12 mins',
      vehicleType,
      vehicle_type: vehicleType,
    });
  }, [
    rideId,
    pickup,
    destination,
    passengerName,
    estimatedFare,
    currency,
    displayDistance,
    distance,
    etaMin,
    vehicleType,
    navigation,
  ]);

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
    // Navigate to Payment Method screen for passenger fare collection
    navigation.navigate('PaymentMethod', {
      ride_id: rideId,
      rideId,
      tripId: rideId,
      pickup,
      destination,
      passengerName,
      fare: estimatedFare,
      totalFare: estimatedFare,
      amount: estimatedFare,
      currency,
      distance: displayDistance || distance,
      duration: etaMin ? `${etaMin} mins` : '12 mins',
      vehicleType,
      vehicle_type: vehicleType,
      isDriver: true,
    });
  };

  const displayEta = useMemo(() => {
    const min = etaMin ?? lastLocationAck?.eta_min;
    if (min !== undefined && min !== null) {
      return `${min} ${t('navigation.min')}`;
    }
    return `12 ${t('navigation.min')}`;
  }, [etaMin, lastLocationAck, t]);

  const displayDistance = useMemo(() => {
    const dist = distanceRemainingKm ?? lastLocationAck?.distance_remaining_km;
    if (dist !== undefined && dist !== null) {
      if (dist < 1) {
        const meters = Math.round(dist * 1000);
        return `${Math.max(10, meters)} m`;
      }
      return `${dist.toFixed(1)} km`;
    }
    if (route.params?.distance_km) {
      return `${Number(route.params.distance_km).toFixed(1)} km`;
    }
    return tripDistance;
  }, [distanceRemainingKm, lastLocationAck, route.params, tripDistance]);

  const initialTripDistanceRef = useRef(
    distanceRemainingKm !== null && distanceRemainingKm !== undefined
      ? Number(distanceRemainingKm)
      : (numDistanceKm > 0 && numDistanceKm < 50 ? numDistanceKm : 2.5)
  );

  const mapPane = useMemo(() => (
    <View style={styles.mapArea}>
      <RidesRouteMap
        pickupCoords={pickupCoords}
        dropCoords={dropCoords}
        driverCoords={driverCoords}
        pickupLabel={pickup || 'Pick-up'}
        destinationLabel={destination || 'Drop-off'}
        distanceKm={initialTripDistanceRef.current || 2.5}
        isDriverEnRoute={true}
        isOnTrip={true}
        vehicleType={vehicleType || 'CAR'}
        focusOnStart={true}
        style={{ flex: 1, width: '100%', height: '100%' }}
      />
    </View>
  ), [pickupCoords, dropCoords, driverCoords, pickup, destination, vehicleType]);

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
            <Text style={styles.fareAmount}>{formatCurrency(estimatedFare, currency === 'USD' ? '$' : currency)}</Text>
          </View>

          <View style={styles.etaBadge}>
            <Text style={styles.etaVal}>{displayEta}</Text>
            <Text style={styles.etaDist}>{displayDistance}</Text>
          </View>
        </View>

        {/* Route Pick & Drop Card */}
        <View style={styles.routeCard}>
          <View style={styles.routeTimeline}>
            <View style={styles.pickupDot} />
            <View style={styles.routeLine} />
            <View style={styles.dropSquare} />
          </View>
          <View style={styles.routeAddresses}>
            <View style={styles.addressBlock}>
              <Text style={styles.addressLabel}>{t('rider.pickupLocation', 'PICKUP')}</Text>
              <Text numberOfLines={1} style={styles.addressText}>
                {pickup}
              </Text>
            </View>
            <View style={[styles.addressBlock, { marginTop: SPACING.sm }]}>
              <Text style={styles.addressLabel}>{t('rider.dropoffLocation', 'DROPOFF')}</Text>
              <Text numberOfLines={1} style={styles.addressText}>
                {destination}
              </Text>
            </View>
          </View>
        </View>

        {/* Passenger Mini row */}
        <View style={styles.passengerBar}>
          <View style={styles.passengerAvatar}>
            <Text style={styles.initials}>{passengerName.charAt(0)}</Text>
          </View>
          <Text style={styles.passengerName}>{passengerName}</Text>
          <View style={styles.comfortBadge}>
            <Icon
              name={vehicleIcon}
              size={13}
              color={COLORS.primaryDark}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.comfortText}>{vehicleType || 'Moto Taxi'}</Text>
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
          <Icon name={vehicleIcon} size={22} color={COLORS.white} />
        </View>
        <View style={styles.turnDetails}>
          <Text style={styles.turnDistance}>
            {displayDistance} • {displayEta}
          </Text>
          <Text numberOfLines={1} style={styles.turnInstruction}>
            {t('navigation.navigatingTo', 'Navigating to')} {destination}
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
    fontSize: responsiveFont(9),
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
    fontSize: responsiveFont(10),
  },
  routeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    padding: SPACING.md,
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  routeTimeline: {
    alignItems: 'center',
    width: 20,
    marginRight: SPACING.sm,
    paddingVertical: 4,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primaryDark,
  },
  routeLine: {
    width: 2,
    flex: 1,
    minHeight: 22,
    backgroundColor: COLORS.border,
    marginVertical: 3,
  },
  dropSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
  },
  routeAddresses: {
    flex: 1,
  },
  addressBlock: {
    justifyContent: 'center',
  },
  addressLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.textLight,
    fontSize: responsiveFont(10),
    letterSpacing: 0.5,
  },
  addressText: {
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
    paddingVertical: 3,
    borderRadius: RADIUS.small,
    flexDirection: 'row',
    alignItems: 'center',
  },
  comfortText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.primaryDark,
    fontSize: responsiveFont(11),
  },
  endTripBtn: {
    width: '100%',
  },
});

export default DriverTripScreen;
