import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
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
import { useResponsive } from '../../utils/responsive';
import { ScrollView } from 'react-native';
import { ACTIVE_MOCK_DRIVER } from '../../data/mockDrivers';
import {
  clearActionNotices,
  clearRiderTripState,
} from '../../redux/features/rider/riderSlice';

export const RideInProgressScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isSplitLayout, isFoldableOrTablet, insets, width } = useResponsive();
  const driver = route.params?.driver || ACTIVE_MOCK_DRIVER;
  const totalFare = route.params?.totalFare || 18.5;

  const {
    tripStatus,
    completedTrip,
    cancellationNotice,
    driverLocation,
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
      navigation.replace('TripCompleted', {
        driver,
        totalFare: completedTrip?.final_fare || totalFare,
        paymentStatus: completedTrip?.payment_status || 'PAID',
        tripDistance: '5.8 mi',
        tripDuration: '18 mins',
        destination: destinationLabel,
      });
    }
  }, [tripStatus, completedTrip, driver, totalFare, destinationLabel, navigation]);

  const handleCompleteTrip = () => {
    navigation.replace('TripCompleted', {
      driver,
      totalFare: completedTrip?.final_fare || totalFare,
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

  const mapPane = (
    <View style={styles.mapArea}>
      <RidesRouteMap
        pickupCoords={currentCoords}
        dropCoords={dropCoords}
        pickupLabel={pickupLabel}
        destinationLabel={destinationLabel}
        distanceKm={91.56}
        style={{ flex: 1, width: '100%', height: '100%' }}
      />
    </View>
  );

  const statusContent = (
    <View
      style={[
        styles.bottomCard,
        isSplitLayout && styles.sideCard,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.md, SPACING.xl),
        },
      ]}
    >
      {/* ETA & Distance */}
      <View style={styles.etaRow}>
        <View style={styles.etaCol}>
          <Text style={styles.etaLabel}>{t('navigation.eta')}</Text>
          <Text style={styles.etaTime}>11:42 AM</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>12 {t('navigation.min')} • 4.8 mi</Text>
        </View>
      </View>

      {/* Destination Card */}
      <View style={styles.destRow}>
        <View style={styles.destDot} />
        <View style={styles.destInfo}>
          <Text style={styles.destLabel}>{t('rider.destination')}</Text>
          <Text numberOfLines={1} style={styles.destTitle}>
            {destinationLabel}
          </Text>
        </View>
      </View>

      {/* Driver mini card */}
      <View style={styles.driverMiniRow}>
        <View style={styles.driverAvatar}>
          <Text style={styles.avatarInitials}>
            {driver.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.driverMiniInfo}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.carName}>
            {driver.car?.model} • {driver.car?.plateNumber}
          </Text>
        </View>
        <TouchableOpacity style={styles.sosBtn}>
          <Icon name="shield" size={16} color={COLORS.danger} />
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Finish / Next Step Simulation CTA */}
      <CustomButton
        title={`${t('driver.completeTrip')} • Moto Taxi`}
        onPress={handleCompleteTrip}
        variant="primary"
        icon="check"
        iconPosition="right"
        style={styles.arriveBtn}
      />
    </View>
  );

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
            Continue onto FDR Dr North
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
    fontSize: 9,
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
    padding: SPACING.lg,
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
