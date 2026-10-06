import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { KeyboardTextInput } from '../../components/keyboard/KeyboardTextInput';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { RidesRouteMap } from '../../components/navigation';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useTranslation } from 'react-i18next';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import {
  driverStartTrip,
  sendDriverLocationUpdate,
  clearActionNotices,
} from '../../redux/features/driver/driverSlice';
import {
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
} from '../../utils/locationService';

export const DriverArrivedScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isSplitLayout, insets } = useResponsive();
  const dispatch = useDispatch();

  const {
    rideStatus,
    rideCancelledNotice,
    actionError,
    actionLoading,
    activeRide,
    currentLocation,
    lastLocationAck,
    distanceRemainingKm,
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
  const passengerPhone =
    route.params?.passengerPhone ||
    activeRide?.rider_phone ||
    activeRide?.phone ||
    null;
  const demoOtp = route.params?.otp || activeRide?.otp;
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

  // Trip drop-off destination coordinates for starting the trip
  const tripDestinationCoords = useMemo(() => {
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

  // Live driver position: starts from route params, Redux ack/location, or pickupCoords
  const [driverCoords, setDriverCoords] = useState(() => {
    if (route.params?.driverCoordinates && route.params.driverCoordinates.length === 2) {
      return [Number(route.params.driverCoordinates[0]), Number(route.params.driverCoordinates[1])];
    }
    const lat = lastLocationAck?.lat ?? currentLocation?.lat;
    const lng = lastLocationAck?.lng ?? currentLocation?.lng;
    if (lat && lng) {
      return [Number(lng), Number(lat)];
    }
    return pickupCoords;
  });

  // Keep driver position synced when Redux location updates
  useEffect(() => {
    const lat = lastLocationAck?.lat ?? currentLocation?.lat;
    const lng = lastLocationAck?.lng ?? currentLocation?.lng;
    if (lat && lng) {
      setDriverCoords([Number(lng), Number(lat)]);
    }
  }, [lastLocationAck, currentLocation]);

  // Live GPS tracking
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
      .catch((err) => console.warn('[DriverArrived] Initial GPS failed:', err));

    watchLocation(
      (loc) => {
        if (isMounted && loc?.longitude && loc?.latitude) {
          setDriverCoords([loc.longitude, loc.latitude]);
        }
      },
      (err) => console.warn('[DriverArrived] Location watch error:', err)
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

  // Periodic heartbeat: send driver position every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const lat = driverCoords[1] || pickupCoords[1];
      const lng = driverCoords[0] || pickupCoords[0];
      dispatch(sendDriverLocationUpdate({ lat, lng }));
    }, 10000);
    return () => clearInterval(interval);
  }, [dispatch, driverCoords, pickupCoords]);

  // Elapsed wait time: begins counting UP from 00:00 upon driver arrival
  const [elapsedWaitSeconds, setElapsedWaitSeconds] = useState(0);
  const [enteredPin, setEnteredPin] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedWaitSeconds((sec) => sec + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for rider cancellation
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

  const driverCoordsRef = useRef(driverCoords);
  useEffect(() => {
    driverCoordsRef.current = driverCoords;
  }, [driverCoords]);

  const hasNavigatedRef = useRef(false);

  const navigateToTrip = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigation.replace('DriverTrip', {
      ride_id: rideId,
      pickup,
      destination,
      passengerName,
      estimatedFare,
      currency,
      tripDistance,
      vehicleType,
      driverCoordinates: driverCoordsRef.current || driverCoords,
      pickupCoordinates: pickupCoords,
      dropCoordinates: tripDestinationCoords,
      pickup_lat: pickupCoords?.[1],
      pickup_lon: pickupCoords?.[0],
      drop_lat: tripDestinationCoords?.[1],
      drop_lon: tripDestinationCoords?.[0],
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
    tripDestinationCoords,
    numDistanceKm,
    navigation,
  ]);

  // Listen for start_trip_success from server
  useEffect(() => {
    if (rideStatus === 'in_progress') {
      navigateToTrip();
    }
  }, [rideStatus, navigateToTrip]);

  useEffect(() => {
    if (actionError) {
      Alert.alert('OTP Verification Failed', actionError);
      setEnteredPin('');
      dispatch(clearActionNotices());
    }
  }, [actionError, dispatch]);

  const formatTime = (sec) => {
    const s = Math.max(0, Math.floor(sec || 0));
    const mins = Math.floor(s / 60);
    const remainder = s % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const handleStartTrip = () => {
    if (enteredPin.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit OTP provided by the rider.');
      return;
    }
    dispatch(driverStartTrip({ rideId, otp: enteredPin }));
  };

  const mapPane = (
    <View style={isSplitLayout ? styles.mapAreaSplit : styles.mapArea}>
      <RidesRouteMap
        pickupCoords={pickupCoords}
        dropCoords={pickupCoords}
        driverCoords={driverCoords}
        pickupLabel="Pick-up"
        destinationLabel={passengerName ? `${passengerName} (Pickup)` : (pickup || 'Pickup Location')}
        distanceKm={0.05}
        isDriverEnRoute={true}
        vehicleType={vehicleType || 'CAR'}
        style={{ flex: 1, width: '100%', height: '100%' }}
      />

      {/* Floating Back Button */}
      <TouchableOpacity
        style={[styles.floatingBackBtn, { top: Math.max(insets.top + 10, 30) }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Icon name="arrow-back" size={20} color={COLORS.text} />
      </TouchableOpacity>

      {/* Floating Wait Timer Badge */}
      <View
        style={[
          styles.waitBadge,
          { top: Math.max(insets.top + 10, 30) },
        ]}
      >
        <Icon name="clock" size={15} color={COLORS.primary} />
        <Text style={styles.waitText}>
          Arrived • Waiting: {formatTime(elapsedWaitSeconds)}
        </Text>
      </View>
    </View>
  );

  const pinSheetPane = (
    <ScrollView
      style={[
        styles.sheet,
        isSplitLayout && styles.sideSheet,
      ]}
      contentContainerStyle={[
        styles.sheetContent,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xl),
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Rider Notified of Arrival</Text>
        <Text style={styles.subtitle}>
          Ask {passengerName} for their 4-digit ride OTP (visible on their phone screen) before departing.
        </Text>

        {/* Wait time & Free wait status strip */}
        <View style={styles.statusBanner}>
          <View style={styles.statusPill}>
            <Icon name="clock" size={13} color={COLORS.primaryDark} />
            <Text style={styles.statusPillText}>
              Wait: {formatTime(elapsedWaitSeconds)}
            </Text>
          </View>
          <View style={styles.freeWaitPill}>
            <View style={styles.livePulseDot} />
            <Text style={styles.freeWaitText}>
              {elapsedWaitSeconds < 300
                ? `Free wait: ${formatTime(300 - elapsedWaitSeconds)}`
                : 'Wait fee active'}
            </Text>
          </View>
        </View>
      </View>

      {/* Passenger mini card with call and chat */}
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
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() =>
              Alert.alert(
                'Calling Rider',
                passengerPhone ? `Calling ${passengerPhone}...` : `Dialing ${passengerName}...`
              )
            }
          >
            <Icon name="phone" size={18} color={COLORS.secondPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Alert.alert('Chat', `Open chat with ${passengerName}`)}
          >
            <Icon name="chat" size={18} color={COLORS.secondPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* OTP Inputs with Touch to Focus */}
      <View style={styles.pinSection}>
        <Text style={styles.pinLabel}>ENTER RIDER OTP</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => inputRef.current?.focus()}
          style={styles.pinRow}
        >
          {[0, 1, 2, 3].map((idx) => {
            const digit = enteredPin[idx] || '';
            return (
              <View
                key={idx}
                style={[
                  styles.pinBox,
                  digit ? styles.pinBoxFilled : null,
                  enteredPin.length === idx ? styles.pinBoxActive : null,
                ]}
              >
                <Text style={styles.pinDigit}>{digit || '•'}</Text>
              </View>
            );
          })}
        </TouchableOpacity>

        {demoOtp ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setEnteredPin(String(demoOtp))}
            style={styles.demoOtpBadge}
          >
            <Icon name="key" size={12} color={COLORS.primary} />
            <Text style={styles.demoOtpText}>Demo Rider OTP: {demoOtp} (Tap to fill)</Text>
          </TouchableOpacity>
        ) : null}

        {/* Transparent keyboard input over the area */}
        <KeyboardTextInput
          ref={inputRef}
          id="driver-pin-input"
          value={enteredPin}
          onChangeText={(val) => {
            const num = val.replace(/[^0-9]/g, '');
            if (num.length <= 4) setEnteredPin(num);
          }}
          keyboardType="number-pad"
          maxLength={4}
          autoFocus={true}
          style={styles.hiddenInput}
        />
      </View>

      {/* Start Trip CTA */}
      <CustomButton
        title={t('driver.startTrip', 'START TRIP').toUpperCase()}
        onPress={handleStartTrip}
        loading={actionLoading}
        disabled={enteredPin.length < 4 || actionLoading}
        variant="primary"
        icon="navigation"
        iconPosition="right"
        style={styles.startBtn}
      />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={pinSheetPane}
        primaryRatio={0.48}
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
    position: 'relative',
  },
  mapAreaSplit: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  floatingBackBtn: {
    position: 'absolute',
    left: SPACING.md,
    top: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  waitBadge: {
    position: 'absolute',
    top: 50,
    right: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  waitText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  sheet: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sheetContent: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  sideSheet: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 18,
    paddingHorizontal: SPACING.sm,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusPillText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginLeft: 5,
  },
  freeWaitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
    marginRight: 5,
  },
  freeWaitText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: '#2E7D32',
  },
  pinSection: {
    alignItems: 'center',
    marginVertical: SPACING.xs,
    position: 'relative',
  },
  pinLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  pinRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  pinBox: {
    width: 52,
    height: 56,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBoxActive: {
    borderColor: COLORS.primaryDark,
  },
  pinBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  pinDigit: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  startBtn: {
    width: '100%',
    maxWidth: 320,
    marginTop: SPACING.md,
  },
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.large,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passengerAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
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
    ...TYPOGRAPHY.bodyMedium,
    fontWeight: '700',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    fontSize: responsiveFont(11),
  },
  paymentTag: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontSize: responsiveFont(11),
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  contactBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoOtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    marginTop: SPACING.xs,
    gap: 6,
  },
  demoOtpText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
    fontSize: responsiveFont(11),
  },
});

export default DriverArrivedScreen;
