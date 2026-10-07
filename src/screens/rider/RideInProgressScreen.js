import React, { useEffect, useMemo } from 'react';
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
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { RidesRouteMap } from '../../components/navigation';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useTranslation } from 'react-i18next';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { ACTIVE_MOCK_DRIVER } from '../../data/mockDrivers';
import {
  clearActionNotices,
  clearRiderTripState,
} from '../../redux/features/rider/riderSlice';

export const RideInProgressScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isSplitLayout, isFoldableOrTablet, insets, width, height } = useResponsive();
  const driver = route.params?.driver || ACTIVE_MOCK_DRIVER;
  const totalFare = route.params?.totalFare || 18.5;

  const {
    tripStatus,
    completedTrip,
    activeRideId,
    cancellationNotice,
    driverLocation,
    distanceRemainingKm,
    etaMin,
  } = useSelector((state) => state.rider);

  const pickupCoords = useMemo(() => {
    const p = route.params?.pickup;
    if (p?.coordinates && p.coordinates.length === 2) {
      return [Number(p.coordinates[0]), Number(p.coordinates[1])];
    }
    if (route.params?.pickupCoordinates && route.params.pickupCoordinates.length === 2) {
      return [Number(route.params.pickupCoordinates[0]), Number(route.params.pickupCoordinates[1])];
    }
    return [76.7835809, 30.6948328];
  }, [route.params]);

  const dropCoords = useMemo(() => {
    const d = route.params?.destination;
    if (d?.coordinates && d.coordinates.length === 2) {
      return [Number(d.coordinates[0]), Number(d.coordinates[1])];
    }
    if (route.params?.dropCoordinates && route.params.dropCoordinates.length === 2) {
      return [Number(route.params.dropCoordinates[0]), Number(route.params.dropCoordinates[1])];
    }
    return [75.8573, 30.9005];
  }, [route.params]);

  const destinationLabel = useMemo(() => {
    const d = route.params?.destination;
    if (typeof d === 'string') return d;
    return d?.shortAddress || d?.name || d?.address || 'Destination';
  }, [route.params?.destination]);

  const pickupLabel = useMemo(() => {
    const p = route.params?.pickup;
    if (typeof p === 'string') return p;
    return p?.shortAddress || p?.name || p?.address || 'Pick-up';
  }, [route.params?.pickup]);

  // Listen for driver cancelling the ride
  useEffect(() => {
    if (cancellationNotice) {
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
    }
  }, [cancellationNotice, dispatch, navigation]);

  // Listen for trip completed from server
  useEffect(() => {
    if (tripStatus === 'completed' || completedTrip) {
      const resolvedRideId =
        completedTrip?.ride_id ||
        route.params?.ride_id ||
        route.params?.rideId ||
        activeRideId;

      navigation.replace('TripCompleted', {
        driver: driver || completedTrip?.driver,
        totalFare: completedTrip?.final_fare || totalFare,
        paymentStatus: completedTrip?.payment_status || 'PAID',
        rideId: resolvedRideId,
        ride_id: resolvedRideId,
        tripDistance: '5.8 mi',
        tripDuration: '18 mins',
        destination: destinationLabel,
      });
    }
  }, [tripStatus, completedTrip, driver, totalFare, destinationLabel, navigation, activeRideId, route.params]);

  const handleCompleteTrip = () => {
    const resolvedRideId =
      completedTrip?.ride_id ||
      route.params?.ride_id ||
      route.params?.rideId ||
      activeRideId;

    navigation.replace('TripCompleted', {
      driver: driver || completedTrip?.driver,
      totalFare: completedTrip?.final_fare || totalFare,
      rideId: resolvedRideId,
      ride_id: resolvedRideId,
      tripDistance: '5.8 mi',
      tripDuration: '18 mins',
      destination: destinationLabel,
    });
  };

  const currentCoords = useMemo(() => {
    if (driverLocation?.lng && driverLocation?.lat) {
      return [Number(driverLocation.lng), Number(driverLocation.lat)];
    }
    return pickupCoords;
  }, [driverLocation, pickupCoords]);

  const formattedEtaTime = useMemo(() => {
    const minutesToAdd =
      etaMin !== null && etaMin !== undefined
        ? Math.max(1, etaMin)
        : 10;
    const target = new Date(Date.now() + minutesToAdd * 60 * 1000);
    let hours = target.getHours();
    const minutes = target.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${strMinutes} ${ampm}`;
  }, [etaMin]);

  const formattedDurationAndDistance = useMemo(() => {
    let distStr = null;
    if (distanceRemainingKm !== null && distanceRemainingKm !== undefined) {
      if (distanceRemainingKm < 1) {
        const meters = Math.round(distanceRemainingKm * 1000);
        distStr = `${Math.max(10, meters)} m`;
      } else {
        distStr = `${distanceRemainingKm.toFixed(1)} km`;
      }
    } else if (route.params?.distance_km) {
      distStr = `${Number(route.params.distance_km).toFixed(1)} km`;
    }

    const etaStr =
      etaMin !== null && etaMin !== undefined
        ? `${etaMin} ${t('navigation.min')}`
        : null;

    if (etaStr && distStr) {
      return `${etaStr} • ${distStr}`;
    }
    if (etaStr) return etaStr;
    if (distStr) return distStr;
    return `12 ${t('navigation.min')} • 4.8 km`;
  }, [distanceRemainingKm, etaMin, route.params, t]);

  const vehicleType = useMemo(() => {
    return (
      driver?.vehicle_type ||
      driver?.car?.type ||
      route.params?.selectedRide?.vehicle_type ||
      'CAR'
    );
  }, [driver, route.params]);

  // Max height for the bottom sheet in phone mode so it never overflows
  const bottomSheetMaxHeight = useMemo(() => {
    return Math.max(320, Math.round(height * 0.55));
  }, [height]);

  const mapPane = useMemo(() => (
    <View style={styles.mapArea}>
      <RidesRouteMap
        pickupCoords={pickupCoords}
        dropCoords={dropCoords}
        driverCoords={currentCoords}
        pickupLabel={pickupLabel}
        destinationLabel={destinationLabel}
        distanceKm={
          distanceRemainingKm !== null && distanceRemainingKm !== undefined
            ? Number(distanceRemainingKm)
            : (route.params?.distance_km ? Number(route.params.distance_km) : 5.2)
        }
        isDriverEnRoute={true}
        vehicleType={vehicleType}
        focusOnStart={true}
        style={{ flex: 1, width: '100%', height: '100%' }}
      />
    </View>
  ), [
    pickupCoords,
    dropCoords,
    currentCoords,
    pickupLabel,
    destinationLabel,
    distanceRemainingKm,
    route.params?.distance_km,
    vehicleType,
  ]);

  // ---------- Reusable inner content (no wrapper) ----------
  const statusInner = (
    <>
      {/* Drag Handle */}
      {!isSplitLayout && <View style={styles.sheetHandle} />}

      {/* Live Status Chip + Trip Stage */}
      <View style={styles.statusHeaderRow}>
        <View style={styles.liveStatusChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveStatusText}>ON TRIP</Text>
        </View>
        <Text style={styles.tripStageText}>Heading to destination</Text>
      </View>

      {/* Big ETA Hero Card */}
      <View style={styles.etaHeroCard}>
        <View style={styles.etaHeroLeft}>
          <Text style={styles.etaHeroLabel}>{t('navigation.eta', 'Arriving at')}</Text>
          <Text style={styles.etaHeroTime}>{formattedEtaTime}</Text>
          <Text style={styles.etaHeroSub}>{formattedDurationAndDistance}</Text>
        </View>
        <View style={styles.etaHeroIconBox}>
          <Icon name="clock" size={26} color={COLORS.primaryDark} />
        </View>
      </View>

      {/* Trip Progress Bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <View style={styles.progressLabelsRow}>
          <View style={styles.progressEndpoint}>
            <View style={styles.progressDotPickup} />
            <Text style={styles.progressEndpointText} numberOfLines={1}>
              {pickupLabel}
            </Text>
          </View>
          <View style={styles.progressEndpointRight}>
            <Text style={styles.progressEndpointText} numberOfLines={1}>
              {destinationLabel}
            </Text>
            <View style={styles.progressDotDrop} />
          </View>
        </View>
      </View>

      {/* Destination Card */}
      <View style={styles.destRow}>
        <View style={styles.destIconCircle}>
          <Icon name="map-pin" size={16} color={COLORS.white} />
        </View>
        <View style={styles.destInfo}>
          <Text style={styles.destLabel}>{t('rider.destination', 'Destination')}</Text>
          <Text numberOfLines={1} style={styles.destTitle}>
            {destinationLabel}
          </Text>
        </View>
      </View>

      {/* Driver Card with Quick Actions */}
      <View style={styles.driverCard}>
        <View style={styles.driverTopRow}>
          <View style={styles.driverAvatar}>
            <Text style={styles.avatarInitials}>
              {driver.name?.charAt(0) || 'D'}
            </Text>
          </View>
          <View style={styles.driverMiniInfo}>
            <Text style={styles.driverName} numberOfLines={1}>
              {driver.name}
            </Text>
            <Text style={styles.carName} numberOfLines={1}>
              {driver.car?.model} • {driver.car?.plateNumber}
            </Text>
            <View style={styles.ratingRow}>
              <Icon name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {driver.rating ?? '4.9'} • {vehicleType}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.driverActionRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.actionBtn}
            onPress={() => {/* handle call */}}
          >
            <Icon name="phone" size={16} color={COLORS.primaryDark} />
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.actionBtn}
            onPress={() => {/* handle message */}}
          >
            <Icon name="message" size={16} color={COLORS.primaryDark} />
            <Text style={styles.actionBtnText}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => {/* handle sos */}}
          >
            <Icon name="shield" size={16} color={COLORS.danger} />
            <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  // ---------- Phone layout: scrollable bottom sheet ----------
  const phoneStatusContent = (
    <View
      style={[
        styles.bottomCard,
        {
          maxHeight: bottomSheetMaxHeight,
          paddingBottom: Math.max(insets.bottom + SPACING.md, SPACING.xl),
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={styles.bottomCardScrollContent}
        nestedScrollEnabled={true}
      >
        {statusInner}
      </ScrollView>
    </View>
  );

  // ---------- Split / tablet layout: side card (already scrollable via parent) ----------
  const splitStatusContent = (
    <View style={[styles.bottomCard, styles.sideCard]}>
      {statusInner}
    </View>
  );

  const statusContent = isSplitLayout ? splitStatusContent : phoneStatusContent;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Navigation Top Status Pill */}
      <View
        style={[
          styles.navTopBar,
          {
            top: Math.max(insets.top + 10, 30),
            maxWidth: isFoldableOrTablet ? 520 : width - 32,
            alignSelf: 'center',
          },
        ]}
      >
        <View style={styles.turnIconBox}>
          <Icon name="navigation" size={20} color={COLORS.white} />
        </View>
        <View style={styles.turnInfo}>
          <Text style={styles.turnDistance}>{t('navigation.keepStraight')}</Text>
          <Text numberOfLines={1} style={styles.turnStreet}>
            {destinationLabel ? `Heading towards ${destinationLabel}` : 'Continue on route'}
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
              {statusContent}
            </ScrollView>
          ) : (
            statusContent
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
  navTopBar: {
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
    width: 38,
    height: 38,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  turnInfo: {
    flex: 1,
  },
  turnDistance: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  turnStreet: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  speedPill: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  speedVal: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.text,
  },
  speedUnit: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(9),
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  mapArea: {
    flex: 1,
  },
  bottomCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 8,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  bottomCardScrollContent: {
    paddingBottom: SPACING.md,
  },
  sideCard: {
    height: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
    justifyContent: 'center',
  },

  // --- User-friendly status card additions ---
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },

  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  liveStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveStatusText: {
    fontSize: responsiveFont(11),
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  tripStageText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: '600',
  },

  etaHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  etaHeroLeft: {
    flex: 1,
  },
  etaHeroLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: responsiveFont(10),
  },
  etaHeroTime: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  etaHeroSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontWeight: '700',
    marginTop: 2,
  },
  etaHeroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressWrap: {
    marginBottom: SPACING.md,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressEndpoint: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  progressEndpointRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: SPACING.sm,
  },
  progressDotPickup: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 6,
  },
  progressDotDrop: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
    marginLeft: 6,
  },
  progressEndpointText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    color: COLORS.textLight,
    flexShrink: 1,
  },

  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  etaCol: {},
  etaLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  etaTime: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  distanceBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
  },
  distanceText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.md,
  },
  destIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  destDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
    marginRight: SPACING.md,
  },
  destInfo: {
    flex: 1,
  },
  destLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  destTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },

  driverCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  driverTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  driverMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  driverAvatar: {
    width: 38,
    height: 38,
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
  driverMiniInfo: {
    flex: 1,
  },
  driverName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  carName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    color: COLORS.textLight,
    marginLeft: 4,
    fontWeight: '600',
  },

  driverActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    gap: 6,
  },
  actionBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
    fontSize: responsiveFont(12),
  },

  sosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  sosText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.danger,
    marginLeft: 4,
  },
  arriveBtn: {
    width: '100%',
  },
});

export default RideInProgressScreen;

// import React, { useEffect, useMemo } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   StatusBar,
//   TouchableOpacity,
//   Alert,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useSelector, useDispatch } from 'react-redux';
// import { COLORS } from '../../theme/colors';
// import { RADIUS, SPACING } from '../../theme/spacing';
// import { TYPOGRAPHY } from '../../theme/typography';
// import { RidesRouteMap } from '../../components/navigation';
// import CustomButton from '../../components/CustomButton';
// import Icon from '../../components/Icon';
// import AdaptiveSplitView from '../../components/AdaptiveSplitView';
// import { useTranslation } from 'react-i18next';
// import { useResponsive } from '../../utils/responsive';
// import { ScrollView } from 'react-native';
// import { ACTIVE_MOCK_DRIVER } from '../../data/mockDrivers';
// import {
//   clearActionNotices,
//   clearRiderTripState,
// } from '../../redux/features/rider/riderSlice';

// export const RideInProgressScreen = ({ navigation, route }) => {
//   const { t } = useTranslation();
//   const dispatch = useDispatch();
//   const { isSplitLayout, isFoldableOrTablet, insets, width } = useResponsive();
//   const driver = route.params?.driver || ACTIVE_MOCK_DRIVER;
//   const totalFare = route.params?.totalFare || 18.5;

//   const {
//     tripStatus,
//     completedTrip,
//     cancellationNotice,
//     driverLocation,
//     distanceRemainingKm,
//     etaMin,
//   } = useSelector((state) => state.rider);

//   const pickupCoords = useMemo(() => {
//     const p = route.params?.pickup;
//     if (p?.coordinates && p.coordinates.length === 2) {
//       return [Number(p.coordinates[0]), Number(p.coordinates[1])];
//     }
//     if (route.params?.pickupCoordinates && route.params.pickupCoordinates.length === 2) {
//       return [Number(route.params.pickupCoordinates[0]), Number(route.params.pickupCoordinates[1])];
//     }
//     return [76.7835809, 30.6948328];
//   }, [route.params]);

//   const dropCoords = useMemo(() => {
//     const d = route.params?.destination;
//     if (d?.coordinates && d.coordinates.length === 2) {
//       return [Number(d.coordinates[0]), Number(d.coordinates[1])];
//     }
//     if (route.params?.dropCoordinates && route.params.dropCoordinates.length === 2) {
//       return [Number(route.params.dropCoordinates[0]), Number(route.params.dropCoordinates[1])];
//     }
//     return [75.8573, 30.9005];
//   }, [route.params]);

//   const destinationLabel = useMemo(() => {
//     const d = route.params?.destination;
//     if (typeof d === 'string') return d;
//     return d?.shortAddress || d?.name || d?.address || 'Destination';
//   }, [route.params?.destination]);

//   const pickupLabel = useMemo(() => {
//     const p = route.params?.pickup;
//     if (typeof p === 'string') return p;
//     return p?.shortAddress || p?.name || p?.address || 'Pick-up';
//   }, [route.params?.pickup]);

//   // Listen for driver cancelling the ride
//   useEffect(() => {
//     if (cancellationNotice) {
//       Alert.alert(
//         'Ride Cancelled',
//         `This ride was cancelled by the ${cancellationNotice.cancelled_by?.toLowerCase() || 'driver'}.`
//       );
//       dispatch(clearActionNotices());
//       dispatch(clearRiderTripState());
//       if (navigation.canGoBack()) {
//         navigation.popToTop();
//       } else {
//         navigation.navigate('RiderTabs', { screen: 'RiderHome' });
//       }
//     }
//   }, [cancellationNotice, dispatch, navigation]);

//   // Listen for trip completed from server
//   useEffect(() => {
//     if (tripStatus === 'completed' || completedTrip) {
//       navigation.replace('TripCompleted', {
//         driver,
//         totalFare: completedTrip?.final_fare || totalFare,
//         paymentStatus: completedTrip?.payment_status || 'PAID',
//         tripDistance: '5.8 mi',
//         tripDuration: '18 mins',
//         destination: destinationLabel,
//       });
//     }
//   }, [tripStatus, completedTrip, driver, totalFare, destinationLabel, navigation]);

//   const handleCompleteTrip = () => {
//     navigation.replace('TripCompleted', {
//       driver,
//       totalFare: completedTrip?.final_fare || totalFare,
//       tripDistance: '5.8 mi',
//       tripDuration: '18 mins',
//       destination: destinationLabel,
//     });
//   };

//   const currentCoords = useMemo(() => {
//     if (driverLocation?.lng && driverLocation?.lat) {
//       return [Number(driverLocation.lng), Number(driverLocation.lat)];
//     }
//     return pickupCoords;
//   }, [driverLocation, pickupCoords]);

//   const formattedEtaTime = useMemo(() => {
//     const minutesToAdd =
//       etaMin !== null && etaMin !== undefined
//         ? Math.max(1, etaMin)
//         : 10;
//     const target = new Date(Date.now() + minutesToAdd * 60 * 1000);
//     let hours = target.getHours();
//     const minutes = target.getMinutes();
//     const ampm = hours >= 12 ? 'PM' : 'AM';
//     hours = hours % 12;
//     hours = hours ? hours : 12;
//     const strMinutes = minutes < 10 ? '0' + minutes : minutes;
//     return `${hours}:${strMinutes} ${ampm}`;
//   }, [etaMin]);

//   const formattedDurationAndDistance = useMemo(() => {
//     let distStr = null;
//     if (distanceRemainingKm !== null && distanceRemainingKm !== undefined) {
//       if (distanceRemainingKm < 1) {
//         const meters = Math.round(distanceRemainingKm * 1000);
//         distStr = `${Math.max(10, meters)} m`;
//       } else {
//         distStr = `${distanceRemainingKm.toFixed(1)} km`;
//       }
//     } else if (route.params?.distance_km) {
//       distStr = `${Number(route.params.distance_km).toFixed(1)} km`;
//     }

//     const etaStr =
//       etaMin !== null && etaMin !== undefined
//         ? `${etaMin} ${t('navigation.min')}`
//         : null;

//     if (etaStr && distStr) {
//       return `${etaStr} • ${distStr}`;
//     }
//     if (etaStr) return etaStr;
//     if (distStr) return distStr;
//     return `12 ${t('navigation.min')} • 4.8 km`;
//   }, [distanceRemainingKm, etaMin, route.params, t]);

//   const vehicleType = useMemo(() => {
//     return (
//       driver?.vehicle_type ||
//       driver?.car?.type ||
//       route.params?.selectedRide?.vehicle_type ||
//       'CAR'
//     );
//   }, [driver, route.params]);

//   const mapPane = useMemo(() => (
//     <View style={styles.mapArea}>
//       <RidesRouteMap
//         pickupCoords={pickupCoords}
//         dropCoords={dropCoords}
//         driverCoords={currentCoords}
//         pickupLabel={pickupLabel}
//         destinationLabel={destinationLabel}
//         distanceKm={
//           distanceRemainingKm !== null && distanceRemainingKm !== undefined
//             ? Number(distanceRemainingKm)
//             : (route.params?.distance_km ? Number(route.params.distance_km) : 5.2)
//         }
//         isDriverEnRoute={true}
//         vehicleType={vehicleType}
//         focusOnStart={true}
//         style={{ flex: 1, width: '100%', height: '100%' }}
//       />
//     </View>
//   ), [
//     pickupCoords,
//     dropCoords,
//     currentCoords,
//     pickupLabel,
//     destinationLabel,
//     distanceRemainingKm,
//     route.params?.distance_km,
//     vehicleType,
//   ]);

//   const statusContent = (
//     <View
//       style={[
//         styles.bottomCard,
//         isSplitLayout && styles.sideCard,
//         !isSplitLayout && {
//           paddingBottom: Math.max(insets.bottom + SPACING.md, SPACING.xl),
//         },
//       ]}
//     >
//       {/* ETA & Distance */}
//       <View style={styles.etaRow}>
//         <View style={styles.etaCol}>
//           <Text style={styles.etaLabel}>{t('navigation.eta')}</Text>
//           <Text style={styles.etaTime}>{formattedEtaTime}</Text>
//         </View>
//         <View style={styles.distanceBadge}>
//           <Text style={styles.distanceText}>{formattedDurationAndDistance}</Text>
//         </View>
//       </View>

//       {/* Destination Card */}
//       <View style={styles.destRow}>
//         <View style={styles.destDot} />
//         <View style={styles.destInfo}>
//           <Text style={styles.destLabel}>{t('rider.destination')}</Text>
//           <Text numberOfLines={1} style={styles.destTitle}>
//             {destinationLabel}
//           </Text>
//         </View>
//       </View>

//       {/* Driver mini card */}
//       <View style={styles.driverMiniRow}>
//         <View style={styles.driverAvatar}>
//           <Text style={styles.avatarInitials}>
//             {driver.name.charAt(0)}
//           </Text>
//         </View>
//         <View style={styles.driverMiniInfo}>
//           <Text style={styles.driverName}>{driver.name}</Text>
//           <Text style={styles.carName}>
//             {driver.car?.model} • {driver.car?.plateNumber}
//           </Text>
//         </View>
//         <TouchableOpacity style={styles.sosBtn}>
//           <Icon name="shield" size={16} color={COLORS.danger} />
//           <Text style={styles.sosText}>SOS</Text>
//         </TouchableOpacity>
//       </View>

    
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

//       {/* Navigation Top Status Pill */}
//       <View
//         style={[
//           styles.navTopBar,
//           {
//             top: Math.max(insets.top + 10, 30),
//             maxWidth: isFoldableOrTablet ? 520 : width - 32,
//             alignSelf: 'center',
//           },
//         ]}
//       >
//         <View style={styles.turnIconBox}>
//           <Icon name="navigation" size={20} color={COLORS.white} />
//         </View>
//         <View style={styles.turnInfo}>
//           <Text style={styles.turnDistance}>{t('navigation.keepStraight')}</Text>
//           <Text numberOfLines={1} style={styles.turnStreet}>
//             {destinationLabel ? `Heading towards ${destinationLabel}` : 'Continue on route'}
//           </Text>
//         </View>
//       </View>

//       <AdaptiveSplitView
//         primaryPane={mapPane}
//         secondaryPane={
//           isSplitLayout ? (
//             <ScrollView
//               contentContainerStyle={{ flexGrow: 1 }}
//               showsVerticalScrollIndicator={false}
//             >
//               {statusContent}
//             </ScrollView>
//           ) : (
//             statusContent
//           )
//         }
//         primaryRatio={0.6}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   navTopBar: {
//     position: 'absolute',
//     top: 50,
//     left: SPACING.lg,
//     right: SPACING.lg,
//     zIndex: 10,
//     backgroundColor: COLORS.white,
//     borderRadius: RADIUS.large,
//     padding: SPACING.md,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1.5,
//     borderColor: COLORS.border,
//     shadowColor: COLORS.text,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 10,
//     elevation: 6,
//   },
//   turnIconBox: {
//     width: 38,
//     height: 38,
//     borderRadius: RADIUS.round,
//     backgroundColor: COLORS.secondPrimary,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: SPACING.md,
//   },
//   turnInfo: {
//     flex: 1,
//   },
//   turnDistance: {
//     ...TYPOGRAPHY.caption,
//     fontWeight: '700',
//     color: COLORS.primaryDark,
//   },
//   turnStreet: {
//     ...TYPOGRAPHY.bodySmall,
//     fontWeight: '700',
//     color: COLORS.text,
//     marginTop: 2,
//   },
//   speedPill: {
//     backgroundColor: COLORS.inputBg,
//     paddingHorizontal: SPACING.sm,
//     paddingVertical: 4,
//     borderRadius: RADIUS.small,
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   speedVal: {
//     ...TYPOGRAPHY.bodySmall,
//     fontWeight: '800',
//     color: COLORS.text,
//   },
//   speedUnit: {
//     ...TYPOGRAPHY.caption,
//     fontSize: responsiveFont(9),
//     fontWeight: '700',
//     color: COLORS.primaryDark,
//   },
//   mapArea: {
//     flex: 1,
//   },
//   bottomCard: {
//     backgroundColor: COLORS.white,
//     borderTopLeftRadius: RADIUS.extraLarge,
//     borderTopRightRadius: RADIUS.extraLarge,
//     padding: SPACING.lg,
//     paddingBottom: SPACING.xl,
//     shadowColor: COLORS.text,
  
//   },
//   sideCard: {
//     height: '100%',
//     borderTopLeftRadius: 0,
//     borderTopRightRadius: 0,
//     borderLeftWidth: 1,
//     borderTopWidth: 0,
//     justifyContent: 'center',
//   },
//   etaRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: SPACING.md,
//   },
//   etaCol: {},
//   etaLabel: {
//     ...TYPOGRAPHY.caption,
//     color: COLORS.textLight,
//   },
//   etaTime: {
//     ...TYPOGRAPHY.h2,
//     fontWeight: '800',
//     color: COLORS.text,
//   },
//   distanceBadge: {
//     backgroundColor: COLORS.primaryLight,
//     paddingHorizontal: SPACING.md,
//     paddingVertical: SPACING.xs,
//     borderRadius: RADIUS.round,
//   },
//   distanceText: {
//     ...TYPOGRAPHY.caption,
//     fontWeight: '700',
//     color: COLORS.primaryDark,
//   },
//   destRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.inputBg,
//     padding: SPACING.md,
//     borderRadius: RADIUS.medium,
//     marginBottom: SPACING.md,
//   },
//   destDot: {
//     width: 12,
//     height: 12,
//     borderRadius: 2,
//     backgroundColor: COLORS.secondPrimary,
//     marginRight: SPACING.md,
//   },
//   destInfo: {
//     flex: 1,
//   },
//   destLabel: {
//     ...TYPOGRAPHY.caption,
//     color: COLORS.textLight,
//   },
//   destTitle: {
//     ...TYPOGRAPHY.bodySmall,
//     fontWeight: '700',
//     color: COLORS.text,
//     marginTop: 2,
//   },
//   driverMiniRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: SPACING.lg,
//   },
//   driverAvatar: {
//     width: 38,
//     height: 38,
//     borderRadius: RADIUS.round,
//     backgroundColor: COLORS.secondPrimaryLight,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: SPACING.sm,
//   },
//   avatarInitials: {
//     ...TYPOGRAPHY.bodySmall,
//     fontWeight: '700',
//     color: COLORS.secondPrimaryDark,
//   },
//   driverMiniInfo: {
//     flex: 1,
//   },
//   driverName: {
//     ...TYPOGRAPHY.bodySmall,
//     fontWeight: '700',
//     color: COLORS.text,
//   },
//   carName: {
//     ...TYPOGRAPHY.caption,
//     color: COLORS.textLight,
//     marginTop: 2,
//   },
//   sosBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.primaryLight,
//     paddingHorizontal: SPACING.md,
//     paddingVertical: SPACING.xs,
//     borderRadius: RADIUS.round,
//     borderWidth: 1,
//     borderColor: COLORS.danger,
//   },
//   sosText: {
//     ...TYPOGRAPHY.caption,
//     fontWeight: '700',
//     color: COLORS.danger,
//     marginLeft: 4,
//   },
//   arriveBtn: {
//     width: '100%',
//   },
// });

// export default RideInProgressScreen;
