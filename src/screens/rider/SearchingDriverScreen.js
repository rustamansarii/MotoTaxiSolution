import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { RiderLiveMap } from '../../components/navigation';
import CustomButton from '../../components/CustomButton';
import CustomModal from '../../components/CustomModal';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';
import { formatCurrency } from '../../utils/formatters';
import { getCurrentLocation } from '../../utils/locationService';
import {
  connectRiderWebSocket,
  riderCancelRide,
  clearRiderTripState,
  setTripStatus,
  setActiveRideId,
  setRideOtp,
} from '../../redux/features/rider/riderSlice';
import { riderWebSocket } from '../../utils/riderWebSocket';

export const SearchingDriverScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isSplitLayout, insets } = useResponsive();
  const dispatch = useDispatch();

  const selectedRide = route.params?.selectedRide;
  const pickup = route.params?.pickup;
  const destination = route.params?.destination;
  const totalFare =
    route.params?.totalFare ??
    route.params?.booking?.fare ??
    route.params?.booking?.total_fare ??
    selectedRide?.price ??
    0;

  const rideId =
    route.params?.rideId ||
    route.params?.booking?.ride_id ||
    route.params?.booking?.id ||
    route.params?.booking?.data?.id ||
    route.params?.booking?.data?.ride_id;

  const {
    driverDetails,
    tripStatus,
    socketConnected,
    socketConnecting,
    activeRideId,
    rideOtp,
  } = useSelector((state) => state.rider);

  const reduxBookingOtp = useSelector((state) => state.rides?.currentBooking?.otp);

  const otp =
    route.params?.otp ||
    route.params?.booking?.otp ||
    route.params?.booking?.data?.otp ||
    rideOtp ||
    reduxBookingOtp;

  const pickupLon =
    route.params?.pickup_lon ??
    route.params?.bookingPayload?.pickup_lon ??
    route.params?.pickupData?.longitude ??
    route.params?.pickupData?.lon ??
    null;

  const pickupLat =
    route.params?.pickup_lat ??
    route.params?.bookingPayload?.pickup_lat ??
    route.params?.pickupData?.latitude ??
    route.params?.pickupData?.lat ??
    null;

  const [userLocation, setUserLocation] = useState(
    pickupLon && pickupLat ? [pickupLon, pickupLat] : [75.8573, 30.9005]
  );

  const [showCancelModal, setShowCancelModal] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // 1. Fetch real GPS coordinates if not already passed from booking
  useEffect(() => {
    let isMounted = true;
    if (pickupLon && pickupLat) {
      setUserLocation([pickupLon, pickupLat]);
    } else {
      getCurrentLocation()
        .then((loc) => {
          if (isMounted && loc?.longitude && loc?.latitude) {
            setUserLocation([loc.longitude, loc.latitude]);
          }
        })
        .catch((err) => console.warn('[SearchingDriver] GPS error:', err));
    }
    return () => {
      isMounted = false;
    };
  }, [pickupLon, pickupLat]);

  const handleRecenterLocation = useCallback(async () => {
    try {
      if (pickupLon && pickupLat) {
        setUserLocation([pickupLon, pickupLat]);
        return;
      }
      const loc = await getCurrentLocation();
      if (loc?.latitude && loc?.longitude) {
        setUserLocation([loc.longitude, loc.latitude]);
      }
    } catch (err) {
      console.warn('[SearchingDriver] Recenter error:', err);
    }
  }, [pickupLon, pickupLat]);

  // 2. Connect Rider WebSocket on screen mount and establish searching state
  useEffect(() => {
    console.log('====================================================');
    console.log('[SearchingDriver] 🔍 LOOKING FOR YOUR DRIVER SCREEN ACTIVE');
    console.log('[SearchingDriver] 🆔 Active rideId:', rideId);
    console.log('[SearchingDriver] 🔢 Ride OTP:', otp);
    console.log('[SearchingDriver] 📍 User/Pickup Location:', userLocation);
    console.log('[SearchingDriver] 📡 Connecting Rider WebSocket...');
    console.log('====================================================');
    dispatch(connectRiderWebSocket());
    dispatch(setTripStatus('searching'));
    if (rideId) {
      dispatch(setActiveRideId(rideId));
    }
    if (otp && !rideOtp) {
      dispatch(setRideOtp(otp));
    }
  }, [dispatch, rideId, otp, rideOtp, userLocation]);

  // Log WebSocket connectivity state transitions
  useEffect(() => {
    console.log(
      `[SearchingDriver] 📶 WS State -> connected: ${socketConnected} | connecting: ${socketConnecting} | tripStatus: ${tripStatus}`
    );
  }, [socketConnected, socketConnecting, tripStatus]);

  // 3. Real-time WebSocket listener: when driver accepts ride
  useEffect(() => {
    if (
      (tripStatus === 'driver_assigned' ||
        tripStatus === 'driver_arrived' ||
        tripStatus === 'in_progress') &&
      driverDetails
    ) {
      console.log('====================================================');
      console.log('[SearchingDriver] 🎉 DRIVER ASSIGNED VIA WEBSOCKET!');
      console.log('[SearchingDriver] 👤 Driver Details:', JSON.stringify(driverDetails, null, 2));
      console.log('[SearchingDriver] 🔢 Forwarding Ride OTP:', otp);
      console.log('[SearchingDriver] 🚀 Replacing screen with DriverAssigned...');
      console.log('====================================================');
      navigation.replace('DriverAssigned', {
        driver: driverDetails,
        selectedRide,
        totalFare,
        ride_id: activeRideId || rideId,
        otp: otp || rideOtp,
        pickup,
        destination,
        pickup_lat: pickupLat,
        pickup_lon: pickupLon,
        drop_lat: route.params?.drop_lat,
        drop_lon: route.params?.drop_lon,
      });
    }
  }, [
    tripStatus,
    driverDetails,
    navigation,
    selectedRide,
    totalFare,
    activeRideId,
    rideId,
    otp,
    rideOtp,
    pickup,
    destination,
    pickupLat,
    pickupLon,
    route.params?.drop_lat,
    route.params?.drop_lon,
  ]);

  // When trip is cancelled, return to home screen
  useEffect(() => {
    if (tripStatus === 'cancelled') {
      console.log('[SearchingDriver] Trip cancelled, returning to Home');
      dispatch(clearRiderTripState());
      if (navigation.canGoBack()) {
        navigation.popToTop();
      } else {
        navigation.navigate('RiderTabs', { screen: 'RiderHome' });
      }
    }
  }, [tripStatus, dispatch, navigation]);

  // 4. Pulsating radar & animated progress bar
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    const progress = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );
    progress.start();

    return () => {
      pulse.stop();
      progress.stop();
    };
  }, [pulseAnim, progressAnim]);

  // 5. Handle cancellation: sends cancel_ride over WebSocket
  const handleConfirmCancel = () => {
    const currentRideId = activeRideId || rideId;
    console.log('[SearchingDriver] Cancelling ride request:', currentRideId);
    if (currentRideId) {
      dispatch(
        riderCancelRide({
          rideId: currentRideId,
          reason: 'Changed my mind',
        })
      );
    } else {
      riderWebSocket.sendMessage({
        type: 'cancel_ride',
        reason: 'Changed my mind',
      });
    }
    dispatch(clearRiderTripState());
    setShowCancelModal(false);
    if (navigation.canGoBack()) {
      navigation.popToTop();
    } else {
      navigation.navigate('RiderTabs', { screen: 'RiderHome' });
    }
  };

  const progressInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['15%', '100%'],
  });

  const mapPane = (
    <View style={styles.mapArea}>
      <RiderLiveMap
        userCoordinate={userLocation}
        nearbyDrivers={[]}
        pickupLabel={pickup || t('rider.pickup', 'Pickup')}
        onRecenter={handleRecenterLocation}
      />

      {/* Pulsating Radar Overlay */}
      <View style={styles.radarContainer} pointerEvents="none">
        <Animated.View
          style={[
            styles.pulseCircle,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />
        <View style={styles.radarCore}>
          <Icon name="user" size={24} color={COLORS.white} />
        </View>
      </View>
    </View>
  );

  const statusPane = (
    <View
      style={[
        styles.statusCard,
        isSplitLayout && styles.sideStatusCard,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xl),
        },
      ]}
    >
      <View style={styles.statusHeader}>
        <View style={styles.statusBadgeRow}>
          <View
            style={[
              styles.connectionDot,
              socketConnected
                ? styles.dotConnected
                : socketConnecting
                ? styles.dotConnecting
                : styles.dotOffline,
            ]}
          />
          <Text style={styles.connectionLabel}>
            {socketConnected
              ? 'Live Dispatch Connected'
              : socketConnecting
              ? 'Connecting to Dispatch...'
              : 'Connecting...'}
          </Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.statusTitle}>
            {tripStatus === 'driver_assigned' || tripStatus === 'driver_arrived'
              ? t('rider.driverAssigned', 'Driver is on the way')
              : t('rider.searchingDriversTitle')}
          </Text>
          {otp ? (
            <View style={styles.otpBadge}>
              <Text style={styles.otpLabel}>OTP: </Text>
              <Text style={styles.otpValue}>{otp}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.statusSubtitle}>
          {socketConnecting
            ? 'Establishing live WebSocket connection...'
            : t('rider.searchingSubtitle')}
        </Text>
      </View>

      {/* Animated progress bar line */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressFill, { width: progressInterpolate }]}
        />
      </View>

      {/* Ride specs info */}
      <View style={styles.infoRow}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>{t('driver.vehicleInfo')}</Text>
          <Text style={styles.infoValue}>
            {selectedRide?.name || route.params?.bookingPayload?.vehicle_type || 'Moto Taxi'}
          </Text>
        </View>
        {otp ? (
          <View style={styles.infoColCenter}>
            <Text style={styles.infoLabel}>Ride OTP</Text>
            <Text style={styles.infoOtpValue}>{otp}</Text>
          </View>
        ) : null}
        <View style={styles.infoColRight}>
          <Text style={styles.infoLabel}>{t('rider.estimatedFare')}</Text>
          <Text style={styles.infoValue}>
            {totalFare ? formatCurrency(totalFare) : '--'}
          </Text>
        </View>
      </View>

      {/* Cancel Button */}
      <CustomButton
        title={t('rider.cancelRequest')}
        variant="outline"
        onPress={() => setShowCancelModal(true)}
        style={styles.cancelBtn}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={statusPane}
        primaryRatio={0.6}
      />

      {/* Cancel Confirmation Modal */}
      <CustomModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={t('rider.cancelModalTitle')}
        message={t('rider.cancelModalMessage')}
        confirmText={t('rider.yesCancel')}
        cancelText={t('rider.keepWaiting')}
        isDanger={true}
        onConfirm={handleConfirmCancel}
        icon="alert-triangle"
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
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    opacity: 0.7,
  },
  radarCore: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    padding: SPACING.xl,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sideStatusCard: {
    height: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
    justifyContent: 'center',
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statusTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  otpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '18',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
  },
  otpLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: 11,
  },
  otpValue: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.primary,
    fontSize: 13,
    letterSpacing: 1.2,
  },
  statusSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.round,
    overflow: 'hidden',
    marginVertical: SPACING.md,
  },
  progressFill: {
    width: '65%',
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBg,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.lg,
  },
  infoCol: {
    flex: 1,
  },
  infoColCenter: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  infoOtpValue: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
    letterSpacing: 1.2,
  },
  infoColRight: {
    alignItems: 'flex-end',
  },
  infoLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  infoValue: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    marginBottom: SPACING.sm,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotConnected: {
    backgroundColor: '#10B981',
  },
  dotConnecting: {
    backgroundColor: '#F59E0B',
  },
  dotOffline: {
    backgroundColor: '#9CA3AF',
  },
  connectionLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  cancelBtn: {
    width: '100%',
  },
  langFloating: {
    position: 'absolute',
    right: SPACING.md,
    zIndex: 99,
  },
});

export default SearchingDriverScreen;
