import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { RidesRouteMap } from '../../components/navigation';
import CustomButton from '../../components/CustomButton';
import CustomModal from '../../components/CustomModal';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useTranslation } from 'react-i18next';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import {
  driverMarkArrived,
  driverStartTrip,
  sendDriverLocationUpdate,
  clearActionNotices,
} from '../../redux/features/driver/driverSlice';
import {
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
} from '../../utils/locationService';

export const DriverAcceptedRideScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isSplitLayout, isFoldableOrTablet, insets, width } = useResponsive();
  const dispatch = useDispatch();

  const {
    rideStatus,
    rideCancelledNotice,
    actionLoading,
    actionError,
    activeRide,
    currentLocation,
    lastLocationAck,
    distanceRemainingKm,
    etaMin,
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
  const passengerRating =
    route.params?.passengerRating ||
    (activeRide?.rider_rating ? String(activeRide.rider_rating) : '4.95');
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
    (activeRide?.distance_km !== undefined
      ? `${activeRide.distance_km} km`
      : '16.4 mi');
  const vehicleType =
    route.params?.vehicleType ||
    activeRide?.vehicle_type ||
    'CAR';

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
    const parsed = parseFloat(String(tripDistance).replace(/[^\d.]/g, ''));
    return !isNaN(parsed) && parsed > 0 ? parsed : 91.56;
  }, [route.params, activeRide, tripDistance]);

  // 1. Live Driver Coordinates
  const [driverPos, setDriverPos] = useState(() => {
    const lat = currentLocation?.lat || lastLocationAck?.lat;
    const lng = currentLocation?.lng || lastLocationAck?.lng;
    if (lat && lng) return [Number(lng), Number(lat)];
    return [pickupCoords[0] + 0.0052, pickupCoords[1] + 0.0038];
  });

  const driverPosRef = useRef(driverPos);
  driverPosRef.current = driverPos;

  // Sync when Redux updates location
  useEffect(() => {
    const lat = lastLocationAck?.lat || currentLocation?.lat;
    const lng = lastLocationAck?.lng || currentLocation?.lng;
    if (lat && lng) {
      setDriverPos([Number(lng), Number(lat)]);
    }
  }, [lastLocationAck, currentLocation]);

  // Continuous GPS watch
  useEffect(() => {
    let watchId = null;
    let isMounted = true;

    getCurrentLocation()
      .then((loc) => {
        if (isMounted && loc?.longitude && loc?.latitude) {
          setDriverPos([loc.longitude, loc.latitude]);
          dispatch(sendDriverLocationUpdate({ lat: loc.latitude, lng: loc.longitude }));
        }
      })
      .catch((err) => console.warn('[DriverAccepted] Initial GPS failed:', err));

    watchLocation(
      (loc) => {
        if (isMounted && loc?.longitude && loc?.latitude) {
          setDriverPos((prev) => {
            if (prev) {
              const distMoved = Math.hypot(prev[0] - loc.longitude, prev[1] - loc.latitude);
              if (distMoved < 0.00004) return prev; // Filter micro-jitter (< ~4m)
            }
            return [loc.longitude, loc.latitude];
          });
        }
      },
      (err) => console.warn('[DriverAccepted] Location watch error:', err)
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

  // Periodic heartbeat: send location update every 10 seconds
  useEffect(() => {
    const pushInterval = setInterval(() => {
      const pos = driverPosRef.current;
      if (pos && pos[0] && pos[1]) {
        dispatch(sendDriverLocationUpdate({ lat: pos[1], lng: pos[0] }));
      }
    }, 10000);

    return () => clearInterval(pushInterval);
  }, [dispatch]);

  // 2. Real-time Distance between Driver and Rider
  const distanceToRiderKm = useMemo(() => {
    // 1. Prioritize server-calculated distance from location_ack
    const serverDist = distanceRemainingKm ?? lastLocationAck?.distance_remaining_km;
    if (serverDist !== undefined && serverDist !== null) {
      return Number(serverDist);
    }

    // 2. Fallback to Haversine formula
    if (!driverPos || !pickupCoords) return 0;
    const [lon1, lat1] = driverPos;
    const [lon2, lat2] = pickupCoords;
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return Number(dist.toFixed(2));
  }, [distanceRemainingKm, lastLocationAck, driverPos, pickupCoords]);

  const formattedDistanceToRider = useMemo(() => {
    if (distanceToRiderKm < 1) {
      const meters = Math.round(distanceToRiderKm * 1000);
      return `${Math.max(10, meters)} m`;
    }
    return `${distanceToRiderKm.toFixed(1)} km`;
  }, [distanceToRiderKm]);

  const etaMinutesToRider = useMemo(() => {
    const serverEta = etaMin ?? lastLocationAck?.eta_min;
    if (serverEta !== undefined && serverEta !== null) {
      return Math.max(1, Number(serverEta));
    }
    return Math.max(1, Math.round(distanceToRiderKm * 2.5));
  }, [etaMin, lastLocationAck, distanceToRiderKm]);

  const isNearRider = useMemo(() => {
    return distanceToRiderKm <= 0.2; // within 200m
  }, [distanceToRiderKm]);

  // 3. OTP Entry Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');

  // Listen for rider cancelling ride
  useEffect(() => {
    if (rideCancelledNotice) {
      Alert.alert('Ride Cancelled', 'The rider has cancelled this ride.');
      dispatch(clearActionNotices());
      if (navigation.canGoBack()) {
        navigation.popToTop();
      } else {
        navigation.navigate('DriverTabs', { screen: 'DriverHome' });
      }
    }
  }, [rideCancelledNotice, dispatch, navigation]);

  const initialDriverPosRef = useRef(driverPos);
  const hasNavigatedToArrivedRef = useRef(false);
  const hasNavigatedToTripRef = useRef(false);

  const navigateToArrived = useCallback(() => {
    if (hasNavigatedToArrivedRef.current) return;
    hasNavigatedToArrivedRef.current = true;
    setShowOtpModal(false);
    navigation.replace('DriverArrived', {
      ride_id: rideId,
      pickup,
      destination,
      passengerName,
      passengerRating,
      estimatedFare,
      currency,
      tripDistance,
      vehicleType,
      driverCoordinates: driverPosRef.current || driverPos,
      pickupCoordinates: pickupCoords,
      dropCoordinates: dropCoords,
      pickup_lat: pickupCoords?.[1],
      pickup_lon: pickupCoords?.[0],
      drop_lat: dropCoords?.[1],
      drop_lon: dropCoords?.[0],
      distance_km: numDistanceKm,
      otp: route.params?.otp || activeRide?.otp,
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
    pickupCoords,
    dropCoords,
    numDistanceKm,
    route.params?.otp,
    activeRide?.otp,
    navigation,
  ]);

  // When driver arrives at pickup: mark arrived and navigate to OTP screen
  const handleArrived = () => {
    dispatch(driverMarkArrived({ rideId }));
    navigateToArrived();
  };

  // If server marks status arrived, navigate to DriverArrived screen
  useEffect(() => {
    if (rideStatus === 'arrived') {
      navigateToArrived();
    }
  }, [rideStatus, navigateToArrived]);

  const handleStartTripWithOtp = () => {
    if (enteredOtp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit OTP provided by the rider.');
      return;
    }
    dispatch(driverStartTrip({ rideId, otp: enteredOtp }));
  };

  const navigateToTrip = useCallback(() => {
    if (hasNavigatedToTripRef.current) return;
    hasNavigatedToTripRef.current = true;
    setShowOtpModal(false);
    navigation.replace('DriverTrip', {
      ride_id: rideId,
      pickup,
      destination,
      passengerName,
      estimatedFare,
      currency,
      tripDistance,
      vehicleType,
      driverCoordinates: driverPosRef.current || driverPos,
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
    estimatedFare,
    currency,
    tripDistance,
    vehicleType,
    pickupCoords,
    dropCoords,
    numDistanceKm,
    navigation,
  ]);

  // Listen for start_trip_success from server (navigates exactly once)
  useEffect(() => {
    if (rideStatus === 'in_progress') {
      navigateToTrip();
    }
  }, [rideStatus, navigateToTrip]);

  useEffect(() => {
    if (actionError) {
      Alert.alert('OTP Verification Failed', actionError);
      dispatch(clearActionNotices());
    }
  }, [actionError, dispatch]);

  const initialDistanceRef = useRef(distanceToRiderKm || 0.5);

  // Map Pane shows route from Driver's live location to Rider's pickup location
  const mapPane = useMemo(() => (
    <View style={styles.mapArea}>
      <RidesRouteMap
        pickupCoords={initialDriverPosRef.current || driverPos}
        dropCoords={pickupCoords}
        driverCoords={driverPos}
        pickupLabel="My Location"
        destinationLabel={passengerName ? `${passengerName} (Pickup)` : 'Rider Pickup'}
        distanceKm={initialDistanceRef.current || 0.5}
        isDriverEnRoute={true}
        vehicleType={vehicleType || 'CAR'}
        style={{ flex: 1, width: '100%', height: '100%' }}
      />
    </View>
  ), [pickupCoords, driverPos, passengerName, vehicleType]);

  const passengerPane = (
    <View
      style={[
        styles.bottomCard,
        isSplitLayout && styles.sideCard,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.md, SPACING.xl),
        },
      ]}
    >
      <View style={styles.pickupAddressRow}>
        <View style={styles.pickupPinCircle}>
          <Icon name="map-pin" size={16} color={COLORS.primary} />
        </View>
        <View style={styles.pickupAddressCol}>
          <View style={styles.pickupHeaderLine}>
            <Text style={styles.pickupLabel}>{t('driver.pickUpPassenger')}</Text>
            <View style={styles.distancePill}>
              <Icon name="navigation" size={11} color={COLORS.primary} />
              <Text style={styles.distancePillText}>
                {formattedDistanceToRider}
              </Text>
            </View>
          </View>
          <Text numberOfLines={1} style={styles.pickupAddress}>
            {pickup}
          </Text>
        </View>
      </View>

      {/* Passenger mini card */}
      <View style={styles.passengerCard}>
        <View style={styles.passengerAvatar}>
          <Text style={styles.avatarInitials}>
            {passengerName.charAt(0)}
          </Text>
        </View>

        <View style={styles.passengerDetails}>
          <Text style={styles.passengerName}>{passengerName}</Text>
          <View style={styles.ratingRow}>
            <Icon name="star" size={12} color={COLORS.primary} />
            <Text style={styles.ratingText}>{passengerRating}</Text>
            <Text style={styles.paymentTag}>• In-App Paid</Text>
          </View>
        </View>

        <View style={styles.contactActions}>
          <TouchableOpacity style={styles.contactBtn}>
            <Icon name="phone" size={18} color={COLORS.secondPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactBtn}>
            <Icon name="chat" size={18} color={COLORS.secondPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CTA: Arrived at Pickup / Enter OTP */}
      <CustomButton
        title={
          isNearRider
            ? 'ARRIVED • ENTER RIDER OTP'
            : t('driver.driverArrivedBtn', "I've Arrived at Pickup")
        }
        onPress={handleArrived}
        loading={actionLoading}
        variant="primary"
        icon={isNearRider ? 'key' : 'check-circle'}
        iconPosition="right"
        style={[styles.arrivedBtn, isNearRider && styles.arrivedBtnNear]}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Top Turn / Distance to Rider Header */}
      <View
        style={[
          styles.topTurnHeader,
          {
            top: Math.max(insets.top + 10, 30),
            maxWidth: isFoldableOrTablet ? 540 : width - 32,
            alignSelf: 'center',
          },
        ]}
      >
        <View style={[styles.turnIconBox, isNearRider && styles.turnIconBoxNear]}>
          <Icon
            name={isNearRider ? 'check-circle' : 'navigation'}
            size={20}
            color={COLORS.white}
          />
        </View>
        <View style={styles.turnInfo}>
          <View style={styles.distanceBadgeRow}>
            <Text style={styles.turnDist}>
              {formattedDistanceToRider} • {etaMinutesToRider} {t('navigation.min', 'min')} to rider
            </Text>
            {isNearRider ? (
              <View style={styles.nearPill}>
                <Text style={styles.nearPillText}>ARRIVED AT PICKUP</Text>
              </View>
            ) : null}
          </View>
          <Text numberOfLines={1} style={styles.turnStreet}>
            {pickup}
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
              {passengerPane}
            </ScrollView>
          ) : (
            passengerPane
          )
        }
        primaryRatio={0.6}
      />

      {/* Enter Rider OTP Modal */}
      <CustomModal
        visible={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Enter Rider OTP"
        message={`Ask ${passengerName} for their 4-digit ride OTP (shown on their screen) to start the trip.`}
        icon="shield"
        confirmText={t('driver.startTrip', 'Start Trip')}
        cancelText="Cancel"
        onConfirm={handleStartTripWithOtp}
        showCancel={true}
      >
        <View style={styles.modalOtpContainer}>
          <Text style={styles.modalOtpLabel}>RIDER 4-DIGIT OTP</Text>
          <View style={styles.otpBoxesRow}>
            {[0, 1, 2, 3].map((idx) => {
              const digit = enteredOtp[idx] || '';
              return (
                <View
                  key={idx}
                  style={[
                    styles.otpDigitBox,
                    digit ? styles.otpDigitBoxFilled : null,
                  ]}
                >
                  <Text style={styles.otpDigitText}>{digit || '•'}</Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={navigateToArrived}
            style={styles.fullScreenArrivalLink}
          >
            <Text style={styles.fullScreenArrivalText}>
              Open Full Arrival Screen →
            </Text>
          </TouchableOpacity>
        </View>
      </CustomModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topTurnHeader: {
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
  turnIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  turnIconBoxNear: {
    backgroundColor: '#10B981',
  },
  turnInfo: {
    flex: 1,
  },
  distanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  turnDist: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.primaryDark,
    fontSize: responsiveFont(13),
  },
  nearPill: {
    backgroundColor: '#10B98120',
    borderColor: '#10B981',
    borderWidth: 1,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
  },
  nearPillText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  turnStreet: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
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
  pickupAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    padding: SPACING.md,
    borderRadius: RADIUS.large,
    marginBottom: SPACING.md,
  },
  pickupPinCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  pickupAddressCol: {
    flex: 1,
  },
  pickupHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  pickupLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '18',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    gap: 4,
  },
  distancePillText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.primary,
    fontSize: responsiveFont(11),
  },
  pickupAddress: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
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
  avatarInitials: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.secondPrimaryDark,
  },
  passengerDetails: {
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
  paymentTag: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  contactActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  contactBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedBtn: {
    width: '100%',
  },
  arrivedBtnNear: {
    backgroundColor: '#059669',
  },

  // Modal OTP Styles
  modalOtpContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  modalOtpLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  otpDigitBox: {
    width: 48,
    height: 52,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigitBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  otpDigitText: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  fullScreenArrivalLink: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  fullScreenArrivalText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondPrimary,
    fontWeight: '700',
  },
});

export default DriverAcceptedRideScreen;
