import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import Icon from '../../components/Icon';
import CustomButton from '../../components/CustomButton';
import RidesRouteMap from '../../components/navigation/RidesRouteMap';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import {
  resolveDropCoordinates,
  resolvePickupCoordinates,
} from '../../utils/coordinateResolver';
import { getVehicleIconName } from '../../utils/vehicleAssets';
import {
  driverAcceptRide,
  removeAvailableRideRequest,
  clearActionNotices,
} from '../../redux/features/driver/driverSlice';

export const DriverRequestDetailsScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { insets, isSplitLayout } = useResponsive();
  const dispatch = useDispatch();

  const {
    availableRideRequests = [],
    actionLoading = false,
    actionError = null,
    rideStatus = 'idle',
    rideTakenNotice = null,
    activeRide = null,
    currentLocation = null,
    lastLocationAck = null,
  } = useSelector((state) => state.driver);

  const routeRequest = route.params?.request;
  const routeRideId = route.params?.ride_id || routeRequest?.ride_id || routeRequest?.id;

  // Resolve active request from route params or Redux store
  const request = useMemo(() => {
    if (routeRequest) return routeRequest;
    return availableRideRequests.find(
      (r) => String(r.ride_id || r.id) === String(routeRideId)
    );
  }, [routeRequest, availableRideRequests, routeRideId]);

  const rideId = request?.ride_id || request?.id || routeRideId;

  const extractString = (val, fallback = '') => {
    if (typeof val === 'string' && val.trim()) return val;
    if (val && typeof val === 'object') {
      return val.address || val.display_name || val.name || val.shortAddress || fallback;
    }
    return fallback;
  };

  const pickup = useMemo(() => {
    return extractString(
      request?.pickup_address || request?.pickup,
      'Pickup Location'
    );
  }, [request?.pickup_address, request?.pickup]);

  const destination = useMemo(() => {
    return extractString(
      request?.drop_address || request?.destination,
      'Destination'
    );
  }, [request?.drop_address, request?.destination]);

  const passengerName = useMemo(() => {
    const raw = request?.rider_name || request?.passengerName;
    if (typeof raw === 'string' && raw.trim()) return raw;
    if (raw && typeof raw === 'object') {
      return raw.name || raw.full_name || 'Rider';
    }
    return 'Rider';
  }, [request?.rider_name, request?.passengerName]);

  const passengerRating = request?.rider_rating ? String(request.rider_rating) : '4.95';
  const estimatedFare = request?.driver_payout ?? request?.fare ?? request?.estimated_fare ?? 0;
  const currency = request?.currency || 'USD';
  const distanceKm = request?.distance_km !== undefined ? Number(request.distance_km) : 2.5;
  const vehicleType = (request?.vehicle_type || 'CAR').toUpperCase();
  const etaMin =
    request?.driver_to_pickup_eta_min ??
    request?.estimated_duration_min ??
    Math.max(1, Math.round(distanceKm * 2));

  // Coordinates
  const pickupCoords = useMemo(() => {
    return resolvePickupCoordinates(route.params, request, pickup);
  }, [route.params, request, pickup]);

  const dropCoords = useMemo(() => {
    return resolveDropCoordinates(route.params, request, destination);
  }, [route.params, request, destination]);

  const driverCoords = useMemo(() => {
    const lng = currentLocation?.lng || lastLocationAck?.lng;
    const lat = currentLocation?.lat || lastLocationAck?.lat;
    if (lng && lat) return [Number(lng), Number(lat)];
    return [pickupCoords[0] + 0.003, pickupCoords[1] + 0.002];
  }, [currentLocation, lastLocationAck, pickupCoords]);

  const hasNavigatedRef = useRef(false);

  // Navigate to accepted ride screen upon success
  const navigateToAccepted = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    dispatch(removeAvailableRideRequest(rideId));
    dispatch(clearActionNotices());

    navigation.replace('DriverAcceptedRide', {
      ride_id: rideId,
      tripId: rideId,
      pickup,
      destination,
      passengerName,
      passengerRating,
      estimatedFare,
      currency,
      tripDistance: `${distanceKm} km`,
      distance_km: distanceKm,
      vehicleType,
      driverCoordinates: driverCoords,
      pickupCoordinates: pickupCoords,
      dropCoordinates: dropCoords,
      pickup_lat: pickupCoords[1],
      pickup_lon: pickupCoords[0],
      drop_lat: dropCoords[1],
      drop_lon: dropCoords[0],
    });
  }, [
    rideId,
    pickup,
    destination,
    passengerName,
    passengerRating,
    estimatedFare,
    currency,
    distanceKm,
    vehicleType,
    driverCoords,
    pickupCoords,
    dropCoords,
    dispatch,
    navigation,
  ]);

  // Listen for accept_success
  useEffect(() => {
    if (
      rideStatus === 'accepted' ||
      rideStatus === 'arrived' ||
      rideStatus === 'in_progress'
    ) {
      if (!activeRide || String(activeRide.ride_id) === String(rideId)) {
        navigateToAccepted();
      }
    }
  }, [rideStatus, activeRide, rideId, navigateToAccepted]);

  // Listen for ride taken or error
  useEffect(() => {
    if (rideTakenNotice) {
      const takenId = rideTakenNotice.ride_id || rideTakenNotice.id;
      if (!takenId || String(takenId) === String(rideId)) {
        const isExpired =
          rideTakenNotice.type === 'ride_expired' ||
          rideTakenNotice.type === 'offer_expired';
        Alert.alert(
          isExpired
            ? t('driver.rideExpired', 'Ride Expired')
            : t('driver.rideUnavailable', 'Ride Unavailable'),
          isExpired
            ? t('driver.rideExpiredMsg', 'This ride request has expired.')
            : t('driver.rideTakenByOther', 'This ride is no longer available.')
        );
        dispatch(removeAvailableRideRequest(rideId));
        dispatch(clearActionNotices());
        navigation.goBack();
      }
    }
  }, [rideTakenNotice, rideId, dispatch, navigation, t]);

  useEffect(() => {
    if (actionError) {
      Alert.alert(
        t('driver.rideUnavailable', 'Notice'),
        typeof actionError === 'string'
          ? actionError
          : t('driver.rideTakenByOther', 'This ride is no longer available.')
      );
      dispatch(removeAvailableRideRequest(rideId));
      dispatch(clearActionNotices());
      navigation.goBack();
    }
  }, [actionError, rideId, dispatch, navigation, t]);

  const handleAcceptRide = () => {
    if (!rideId) {
      Alert.alert('Error', 'Invalid ride request ID.');
      return;
    }
    dispatch(driverAcceptRide({ rideId }));
  };

  const handleDeclineRide = () => {
    dispatch(removeAvailableRideRequest(rideId));
    navigation.goBack();
  };

  const formatPayout = (payout, curr = 'USD') => {
    const symbol = curr === 'USD' ? '$' : curr === 'INR' ? '₹' : `${curr} `;
    const num = Number(payout) || 0;
    return `${symbol}${num.toFixed(2)}`;
  };

  // 1. Map View Pane
  const mapPane = (
    <View style={styles.mapArea}>
      <RidesRouteMap
        driverCoordinate={driverCoords}
        pickupCoordinate={pickupCoords}
        dropCoordinate={dropCoords}
        pickupLabel="Pick-up"
        destinationLabel={destination}
        distanceKm={distanceKm}
        vehicleType={vehicleType}
        isDriverEnRoute={true}
        focusOnStart={true}
        style={{ flex: 1, width: '100%', height: '100%' }}
      />
    </View>
  );

  // 2. Details Sheet Pane
  const detailsPane = (
    <ScrollView
      contentContainerStyle={[
        styles.detailsScrollContent,
        !isSplitLayout && { paddingBottom: Math.max(insets.bottom + 16, 28) },
      ]}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      {/* Payout & Vehicle Header */}
      <View style={styles.payoutHeaderCard}>
        <View style={styles.payoutCol}>
          <Text style={styles.payoutLabel}>
            {t('driver.tripEarnings', 'Guaranteed Payout')}
          </Text>
          <Text style={styles.payoutAmount}>{formatPayout(estimatedFare, currency)}</Text>
        </View>

        <View style={styles.vehicleBadgeCol}>
          <View style={styles.vehicleTypeTag}>
            <Icon
              name={getVehicleIconName(vehicleType)}
              size={15}
              color={COLORS.primary}
            />
            <Text style={styles.vehicleTypeText}>{vehicleType}</Text>
          </View>
          <Text style={styles.rideIdText}>Ride #{rideId}</Text>
        </View>
      </View>

      {/* Quick Metrics (Distance, Duration) */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Icon name="navigation" size={16} color={COLORS.primary} />
          <Text style={styles.metricValue}>{distanceKm} km</Text>
          <Text style={styles.metricLabel}>Distance</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Icon name="time" size={16} color={COLORS.primary} />
          <Text style={styles.metricValue}>{etaMin} min</Text>
          <Text style={styles.metricLabel}>Pickup ETA</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Icon name="wallet" size={16} color={COLORS.primary} />
          <Text style={styles.metricValue}>{formatPayout(estimatedFare, currency)}</Text>
          <Text style={styles.metricLabel}>Earnings</Text>
        </View>
      </View>

      {/* Passenger Card */}
      <View style={styles.passengerCard}>
        <View style={styles.passengerAvatar}>
          <Text style={styles.passengerInitials}>{passengerName.charAt(0)}</Text>
        </View>
        <View style={styles.passengerTextCol}>
          <Text style={styles.passengerNameText} numberOfLines={1}>
            {passengerName}
          </Text>
          <View style={styles.passengerRatingRow}>
            <Icon name="star" size={13} color="#F59E0B" />
            <Text style={styles.passengerRatingText}>{passengerRating}</Text>
            <Text style={styles.passengerRoleText}>• Verified Rider</Text>
          </View>
        </View>
      </View>

      {/* Route Timeline */}
      <View style={styles.routeCard}>
        <Text style={styles.routeSectionTitle}>Trip Route</Text>

        <View style={styles.timelineItem}>
          <View style={styles.dotCol}>
            <View style={[styles.routeDot, styles.dotPickup]} />
            <View style={styles.routeLine} />
          </View>
          <View style={styles.routeTextCol}>
            <Text style={styles.routeLocationType}>PICKUP LOCATION</Text>
            <Text style={styles.routeAddressText}>{pickup}</Text>
          </View>
        </View>

        <View style={styles.timelineItem}>
          <View style={styles.dotCol}>
            <View style={[styles.routeDot, styles.dotDrop]} />
          </View>
          <View style={styles.routeTextCol}>
            <Text style={styles.routeLocationType}>DROP-OFF DESTINATION</Text>
            <Text style={styles.routeAddressText}>{destination}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <CustomButton
          title={t('driver.acceptRide', 'Accept Ride')}
          onPress={handleAcceptRide}
          loading={actionLoading}
          disabled={actionLoading}
          style={styles.acceptButton}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleDeclineRide}
          disabled={actionLoading}
          style={styles.declineButton}
        >
          <Text style={styles.declineButtonText}>
            {t('common.decline', 'Decline / Go Back')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={680} style={{ flex: 1 }}>
        <Header
          title={t('driver.requestDetails', 'Request Details')}
          onBack={() => navigation.goBack()}
        />

        <AdaptiveSplitView
          primaryPane={mapPane}
          secondaryPane={detailsPane}
          primaryRatio={0.44}
        />
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mapArea: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  detailsScrollContent: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  payoutHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  payoutCol: {
    flex: 1,
  },
  payoutLabel: {
    fontSize: responsiveFont(12),
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  payoutAmount: {
    fontSize: responsiveFont(26),
    fontWeight: '800',
    color: '#111827',
  },
  vehicleBadgeCol: {
    alignItems: 'flex-end',
  },
  vehicleTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    marginBottom: 4,
  },
  vehicleTypeText: {
    fontSize: responsiveFont(12),
    fontWeight: '700',
    color: COLORS.primary,
  },
  rideIdText: {
    fontSize: responsiveFont(11),
    color: '#9CA3AF',
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  metricValue: {
    fontSize: responsiveFont(14),
    fontWeight: '700',
    color: '#111827',
  },
  metricLabel: {
    fontSize: responsiveFont(10),
    color: '#6B7280',
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  passengerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerInitials: {
    fontSize: responsiveFont(18),
    fontWeight: '700',
    color: COLORS.white,
  },
  passengerTextCol: {
    flex: 1,
  },
  passengerNameText: {
    fontSize: responsiveFont(15),
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  passengerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  passengerRatingText: {
    fontSize: responsiveFont(12),
    fontWeight: '700',
    color: '#374151',
  },
  passengerRoleText: {
    fontSize: responsiveFont(11),
    color: '#6B7280',
    fontWeight: '500',
  },
  routeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  routeSectionTitle: {
    fontSize: responsiveFont(13),
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dotCol: {
    width: 20,
    alignItems: 'center',
    paddingTop: 3,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotPickup: {
    backgroundColor: '#10B981',
  },
  dotDrop: {
    backgroundColor: '#EF4444',
  },
  routeLine: {
    width: 2,
    height: 36,
    backgroundColor: '#D1D5DB',
    marginVertical: 2,
  },
  routeTextCol: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 8,
  },
  routeLocationType: {
    fontSize: responsiveFont(10),
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeAddressText: {
    fontSize: responsiveFont(13),
    color: '#1F2937',
    fontWeight: '500',
    lineHeight: 18,
  },
  actionButtonsContainer: {
    gap: 10,
    marginTop: 4,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
  },
  declineButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: responsiveFont(14),
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default DriverRequestDetailsScreen;
