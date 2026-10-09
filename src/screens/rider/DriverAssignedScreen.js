import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import { RidesRouteMap } from '../../components/navigation';
import DriverCard from '../../components/DriverCard';
import CustomButton from '../../components/CustomButton';
import CustomModal from '../../components/CustomModal';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useTranslation } from 'react-i18next';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { ACTIVE_MOCK_DRIVER } from '../../data/mockDrivers';
import {
  riderCancelRide,
  clearActionNotices,
  clearRiderTripState,
  setRideOtp,
} from '../../redux/features/rider/riderSlice';
import { resolveDropCoordinates } from '../../utils/coordinateResolver';

export const DriverAssignedScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isSplitLayout, insets } = useResponsive();
  const dispatch = useDispatch();

  const {
    tripStatus,
    driverDetails: wsDriverDetails,
    cancellationNotice,
    activeRideId,
    driverLocation,
    rideOtp,
    distanceRemainingKm,
    etaMin,
  } = useSelector((state) => state.rider);

  const reduxBookingOtp = useSelector((state) => state.rides?.currentBooking?.otp);
  const reduxLocation = useSelector((state) => state.location || {});

  const otp =
    route.params?.otp ||
    route.params?.booking?.otp ||
    route.params?.booking?.data?.otp ||
    rideOtp ||
    reduxBookingOtp;

  const rideId =
    route.params?.ride_id ||
    route.params?.rideId ||
    route.params?.tripId ||
    activeRideId ||
    1;
  const driver = wsDriverDetails || route.params?.driver || ACTIVE_MOCK_DRIVER;
  const totalFare = route.params?.totalFare || 18.5;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const pickupLabel = useMemo(() => {
    const p = route.params?.pickup;
    if (typeof p === 'string' && p.trim()) return p;
    if (p?.shortAddress || p?.name || p?.address) {
      return p.shortAddress || p.name || p.address;
    }
    const reduxAddr =
      reduxLocation?.pickupLocation?.address ||
      reduxLocation?.pickupLocation?.display_name ||
      reduxLocation?.currentAddress?.display_name;
    if (reduxAddr) return reduxAddr;
    return t('rider.currentLocation', 'Current Location');
  }, [route.params?.pickup, reduxLocation, t]);

  const formattedPickupLabel = useMemo(() => {
    if (!pickupLabel) return 'Pickup';
    if (pickupLabel.toLowerCase().includes('(pickup)')) return pickupLabel;
    return `${pickupLabel} (Pickup)`;
  }, [pickupLabel]);

  const destinationLabel = useMemo(() => {
    const d = route.params?.destination;
    if (typeof d === 'string' && d.trim()) return d;
    return d?.shortAddress || d?.name || d?.address || 'Destination';
  }, [route.params?.destination]);

  const pickupCoords = useMemo(() => {
    // 1. Explicit coordinates array from route params
    const p = route.params?.pickup;
    if (p?.coordinates && p.coordinates.length === 2) {
      return [Number(p.coordinates[0]), Number(p.coordinates[1])];
    }
    if (route.params?.pickupCoordinates && route.params.pickupCoordinates.length === 2) {
      return [Number(route.params.pickupCoordinates[0]), Number(route.params.pickupCoordinates[1])];
    }
    // 2. Individual lat/lon in route params or booking payload
    const pLon =
      route.params?.pickup_lon ??
      route.params?.bookingPayload?.pickup_lon ??
      route.params?.pickupData?.longitude ??
      route.params?.pickupData?.lon;
    const pLat =
      route.params?.pickup_lat ??
      route.params?.bookingPayload?.pickup_lat ??
      route.params?.pickupData?.latitude ??
      route.params?.pickupData?.lat;
    if (pLon && pLat) {
      return [Number(pLon), Number(pLat)];
    }
    // 3. Redux location store
    if (reduxLocation?.pickupLocation?.longitude && reduxLocation?.pickupLocation?.latitude) {
      return [
        Number(reduxLocation.pickupLocation.longitude),
        Number(reduxLocation.pickupLocation.latitude),
      ];
    }
    if (reduxLocation?.currentCoords?.longitude && reduxLocation?.currentCoords?.latitude) {
      return [
        Number(reduxLocation.currentCoords.longitude),
        Number(reduxLocation.currentCoords.latitude),
      ];
    }
    return [76.7835809, 30.6948328];
  }, [route.params, reduxLocation]);

  const dropCoords = useMemo(() => {
    const d = route.params?.destination;
    if (d?.coordinates && d.coordinates.length === 2) {
      return [Number(d.coordinates[0]), Number(d.coordinates[1])];
    }
    if (route.params?.dropCoordinates && route.params.dropCoordinates.length === 2) {
      return [Number(route.params.dropCoordinates[0]), Number(route.params.dropCoordinates[1])];
    }
    const dLon =
      route.params?.drop_lon ??
      route.params?.bookingPayload?.drop_lon ??
      route.params?.destinationData?.longitude ??
      route.params?.destinationData?.lon;
    const dLat =
      route.params?.drop_lat ??
      route.params?.bookingPayload?.drop_lat ??
      route.params?.destinationData?.latitude ??
      route.params?.destinationData?.lat;
    if (dLon && dLat) {
      return [Number(dLon), Number(dLat)];
    }
    if (reduxLocation?.dropoffLocation?.longitude && reduxLocation?.dropoffLocation?.latitude) {
      return [
        Number(reduxLocation.dropoffLocation.longitude),
        Number(reduxLocation.dropoffLocation.latitude),
      ];
    }
    return resolveDropCoordinates(route.params, {}, destinationLabel);
  }, [route.params, reduxLocation, destinationLabel]);

  const driverCoords = useMemo(() => {
    if (driverLocation?.lng && driverLocation?.lat) {
      return [Number(driverLocation.lng), Number(driverLocation.lat)];
    }
    // Realistic initial driver distance (~600m from pickup)
    return [pickupCoords[0] + 0.0052, pickupCoords[1] + 0.0038];
  }, [driverLocation, pickupCoords]);

  // Listen for driver cancelling the ride
  useEffect(() => {
    if (cancellationNotice) {
      const noticeRideId = cancellationNotice.ride_id || cancellationNotice.id;
      if (!noticeRideId || String(noticeRideId) === String(rideId)) {
        Alert.alert(
          'Ride Cancelled',
          `This ride was cancelled by the ${cancellationNotice.cancelled_by?.toLowerCase() || 'driver'}.`
        );
        dispatch(clearActionNotices());
        dispatch(clearRiderTripState());
        if (navigation.canGoBack()) {
          navigation.popToTop();
        } else {
          navigation.navigate('RiderTabs', { screen: 'RiderHome' });
        }
      } else {
        dispatch(clearActionNotices());
      }
    }
  }, [cancellationNotice, rideId, dispatch, navigation]);

  // Listen for trip started by driver
  useEffect(() => {
    if (otp && !rideOtp) {
      dispatch(setRideOtp(otp));
    }
  }, [otp, rideOtp, dispatch]);

  useEffect(() => {
    if (tripStatus === 'in_progress') {
      navigation.replace('RideInProgress', {
        driver,
        totalFare,
        ride_id: rideId,
        otp,
        pickup: route.params?.pickup,
        destination: route.params?.destination,
        pickupCoordinates: pickupCoords,
        dropCoordinates: dropCoords,
        distance_km: route.params?.distance_km,
      });
    }
  }, [tripStatus, driver, totalFare, rideId, otp, navigation, route.params, pickupCoords, dropCoords]);

  const handleStartRide = () => {
    navigation.navigate('RideInProgress', {
      driver,
      totalFare,
      ride_id: rideId,
      otp,
      pickup: route.params?.pickup,
      destination: route.params?.destination,
      pickupCoordinates: pickupCoords,
      dropCoordinates: dropCoords,
      distance_km: route.params?.distance_km,
    });
  };

  const handleConfirmCancel = () => {
    // Send {"type": "cancel_ride", "ride_id": 1, "reason": "Changed my mind"}
    dispatch(riderCancelRide({ rideId, reason: 'Changed my mind' }));
    dispatch(clearRiderTripState());
    setShowCancelModal(false);
    if (navigation.canGoBack()) {
      navigation.popToTop();
    } else {
      navigation.navigate('RiderTabs', { screen: 'RiderHome' });
    }
  };

  const formattedDistance = useMemo(() => {
    if (distanceRemainingKm !== null && distanceRemainingKm !== undefined) {
      if (distanceRemainingKm < 1) {
        const meters = Math.round(distanceRemainingKm * 1000);
        return `${Math.max(10, meters)} m`;
      }
      return `${distanceRemainingKm.toFixed(1)} km`;
    }
    return null;
  }, [distanceRemainingKm]);

  const formattedEtaText = useMemo(() => {
    if (
      tripStatus === 'driver_arrived' ||
      (distanceRemainingKm !== null && distanceRemainingKm !== undefined && distanceRemainingKm <= 0.03)
    ) {
      return 'Driver has arrived at pickup!';
    }
    if (etaMin !== null && etaMin !== undefined) {
      const etaStr = etaMin <= 1 ? `1 ${t('navigation.min')}` : `${etaMin} ${t('navigation.min')}`;
      if (formattedDistance) {
        return `${t('rider.driverArriving')} • ${etaStr} (${formattedDistance})`;
      }
      return `${t('rider.driverArriving')} • ${etaStr}`;
    }
    if (formattedDistance) {
      return `${t('rider.driverArriving')} • ${formattedDistance}`;
    }
    return `${t('rider.driverArriving')} • 3 ${t('navigation.min')}`;
  }, [tripStatus, etaMin, formattedDistance, distanceRemainingKm, t]);

  const mapPane = (
    <View style={isSplitLayout ? styles.mapAreaSplit : styles.mapArea}>
      <RidesRouteMap
        pickupCoords={driverCoords}
        dropCoords={pickupCoords}
        pickupLabel={driver?.name ? `${driver.name} (Driver)` : 'Driver'}
        destinationLabel={formattedPickupLabel}
        distanceKm={
          distanceRemainingKm !== null && distanceRemainingKm !== undefined
            ? Number(distanceRemainingKm)
            : 1.4
        }
        isDriverEnRoute={true}
        vehicleType={driver?.vehicle_type || route.params?.selectedRide?.vehicle_type || 'CAR'}
        style={{ flex: 1, width: '100%', height: '100%' }}
      />

      {/* ETA Floating Notification */}
      <View style={styles.etaFloatingBanner}>
        <View style={styles.etaBannerLeft}>
          <View style={styles.pulseDot} />
          <Text style={styles.etaBannerText}>
            {formattedEtaText}
          </Text>
        </View>
        {otp ? (
          <View style={styles.etaOtpBadge}>
            <Text style={styles.etaOtpLabel}>OTP: </Text>
            <Text style={styles.etaOtpValue}>{otp}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  const driverDetailsPane = (
    <ScrollView
      style={[styles.sheetContainer, isSplitLayout && styles.sideSheetContainer]}
      contentContainerStyle={[
        styles.sheetContent,
        {
          paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xl),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <DriverCard
        driver={{
          ...driver,
          pinCode: otp || driver?.pinCode,
          otp: otp || driver?.otp,
        }}
        onCall={() => {}}
        onChat={() => {}}
        showPin={true}
      />

      {/* Destination address strip */}
      <View style={styles.routeSummaryBox}>
        <View style={styles.dropSquare} />
        <View style={styles.routeCol}>
          <Text style={styles.routeSub}>{t('rider.headingTo', 'Heading to')}</Text>
          <Text numberOfLines={1} style={styles.routeMain}>{destinationLabel}</Text>
        </View>
      </View>

     

      {/* Action CTAs */}
      {/* <CustomButton
        title={`${t('driver.startTrip')} • Moto Taxi`}
        onPress={handleStartRide}
        variant="primary"
        icon="check-circle"
        iconPosition="right"
        style={styles.actionBtn}
      /> */}

      <CustomButton
        title={t('rider.cancelRide')}
        variant="outline"
        onPress={() => setShowCancelModal(true)}
        style={styles.secondaryCancelBtn}
      />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title={t('rider.driverAssigned')}
        showBack={false}
      />

      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={driverDetailsPane}
        primaryRatio={0.48}
      />

      {/* Modals */}
      <CustomModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={t('rider.cancelRide')}
        message={t('rider.cancelModalMessage')}
        confirmText={t('rider.yesCancel')}
        cancelText={t('rider.keepWaiting')}
        isDanger={true}
        onConfirm={handleConfirmCancel}
        icon="alert-triangle"
      />

      <CustomModal
        visible={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        title={t('rider.safety')}
        message=""
        confirmText="Emergency"
        cancelText="Dismiss"
        isDanger={true}
        onConfirm={() => setShowEmergencyModal(false)}
        icon="shield"
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
  etaFloatingBanner: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.round,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  etaBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryDark,
    marginRight: SPACING.sm,
  },
  etaBannerText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
  },
  etaOtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '18',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    marginLeft: SPACING.xs,
  },
  etaOtpLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: responsiveFont(11),
  },
  etaOtpValue: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.primary,
    fontSize: responsiveFont(12),
    letterSpacing: 1.2,
  },
  headerOtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '18',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
  },
  headerOtpLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: responsiveFont(12),
  },
  headerOtpValue: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.primary,
    fontSize: responsiveFont(13),
    letterSpacing: 1.2,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sideSheetContainer: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
  },
  sheetContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  safetyRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginVertical: SPACING.md,
  },
  safetyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.medium,
  },
  safetyBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimary,
    marginLeft: SPACING.xs,
  },
  emergencyBtn: {
    backgroundColor: COLORS.primaryLight,
  },
  emergencyText: {
    color: COLORS.danger,
  },
  actionBtn: {
    marginTop: SPACING.xs,
  },
  secondaryCancelBtn: {
    marginTop: SPACING.sm,
  },
  routeSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
    marginRight: SPACING.sm,
  },
  routeCol: {
    flex: 1,
  },
  routeSub: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    color: COLORS.textLight,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  routeMain: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 1,
  },
});

export default DriverAssignedScreen;
