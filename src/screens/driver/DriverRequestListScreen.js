import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import {
  fetchAvailableRideRequests,
  removeAvailableRideRequest,
  driverAcceptRide,
  clearActionNotices,
} from '../../redux/features/driver/driverSlice';
import {
  resolveDropCoordinates,
  resolvePickupCoordinates,
} from '../../utils/coordinateResolver';
import { getVehicleIconName } from '../../utils/vehicleAssets';

export const DriverRequestListScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { insets } = useResponsive();
  const dispatch = useDispatch();

  const {
    availableRideRequests = [],
    requestsLoading = false,
    requestsError = null,
    isOnline = false,
    socketConnected = false,
    actionLoading = false,
    actionError = null,
    rideStatus = 'idle',
    rideTakenNotice = null,
    activeRide = null,
    currentLocation = null,
    lastLocationAck = null,
  } = useSelector((state) => state.driver);

  const [acceptingRideId, setAcceptingRideId] = useState(null);
  const acceptingItemRef = useRef(null);
  const hasNavigatedRef = useRef(false);

  // Fetch available requests on mount
  useEffect(() => {
    dispatch(fetchAvailableRideRequests());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchAvailableRideRequests());
  }, [dispatch]);

  const handleSelectRequest = useCallback(
    (item) => {
      navigation.navigate('DriverRequestDetails', {
        request: item,
        ride_id: item.ride_id || item.id,
      });
    },
    [navigation]
  );

  const handleAcceptRequest = useCallback(
    (item) => {
      const rId = item.ride_id || item.id;
      if (!rId) {
        Alert.alert('Error', 'Invalid ride request ID.');
        return;
      }
      acceptingItemRef.current = item;
      setAcceptingRideId(rId);
      hasNavigatedRef.current = false;
      dispatch(clearActionNotices());
      dispatch(driverAcceptRide({ rideId: rId }));
    },
    [dispatch]
  );

  // Navigate to accepted ride screen upon successful accept
  useEffect(() => {
    if (
      rideStatus === 'accepted' ||
      rideStatus === 'arrived' ||
      rideStatus === 'in_progress'
    ) {
      if (acceptingItemRef.current && !hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        const item = acceptingItemRef.current;
        const rId = item.ride_id || item.id;
        const pickupStr = item.pickup_address || item.pickup || 'Pickup Location';
        const dropStr = item.drop_address || item.destination || 'Destination';
        const pCoords = resolvePickupCoordinates({}, item, pickupStr);
        const dCoords = resolveDropCoordinates({}, item, dropStr);
        const curLoc = currentLocation || lastLocationAck;
        const driverCoords =
          curLoc?.lng && curLoc?.lat
            ? [Number(curLoc.lng), Number(curLoc.lat)]
            : [pCoords[0] + 0.003, pCoords[1] + 0.002];

        dispatch(removeAvailableRideRequest(rId));
        dispatch(clearActionNotices());
        setAcceptingRideId(null);
        acceptingItemRef.current = null;

        navigation.replace('DriverAcceptedRide', {
          ride_id: rId,
          tripId: rId,
          pickup: pickupStr,
          destination: dropStr,
          passengerName: item.rider_name || item.passengerName || 'Rider',
          passengerRating: item.rider_rating ? String(item.rider_rating) : '4.95',
          estimatedFare: item.driver_payout ?? item.fare ?? item.estimated_fare ?? 0,
          currency: item.currency || 'USD',
          tripDistance: item.distance_km !== undefined ? `${item.distance_km} km` : '2.5 km',
          distance_km: item.distance_km !== undefined ? Number(item.distance_km) : 2.5,
          vehicleType: (item.vehicle_type || 'CAR').toUpperCase(),
          driverCoordinates: driverCoords,
          pickupCoordinates: pCoords,
          dropCoordinates: dCoords,
          pickup_lat: pCoords[1],
          pickup_lon: pCoords[0],
          drop_lat: dCoords[1],
          drop_lon: dCoords[0],
        });
      }
    }
  }, [rideStatus, activeRide, currentLocation, lastLocationAck, dispatch, navigation]);

  // Handle ride taken by another driver or offer expired
  useEffect(() => {
    if (rideTakenNotice && acceptingRideId) {
      const takenId = rideTakenNotice.ride_id || rideTakenNotice.id;
      if (!takenId || String(takenId) === String(acceptingRideId)) {
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
        dispatch(removeAvailableRideRequest(acceptingRideId));
        dispatch(clearActionNotices());
        setAcceptingRideId(null);
        acceptingItemRef.current = null;
      }
    }
  }, [rideTakenNotice, acceptingRideId, dispatch, t]);

  // Handle action error
  useEffect(() => {
    if (actionError && acceptingRideId) {
      Alert.alert(
        t('driver.rideUnavailable', 'Notice'),
        typeof actionError === 'string'
          ? actionError
          : t('driver.rideTakenByOther', 'This ride is no longer available.')
      );
      dispatch(removeAvailableRideRequest(acceptingRideId));
      dispatch(clearActionNotices());
      setAcceptingRideId(null);
      acceptingItemRef.current = null;
    }
  }, [actionError, acceptingRideId, dispatch, t]);

  const formatPayout = (payout, currency = 'USD') => {
    const symbol = currency === 'USD' ? '$' : currency === 'INR' ? '₹' : `${currency} `;
    const num = Number(payout) || 0;
    return `${symbol}${num.toFixed(2)}`;
  };

  const renderRequestItem = ({ item }) => {
    const rideId = item.ride_id || item.id;
    const vehicleType = (item.vehicle_type || 'CAR').toUpperCase();
    const pickup = item.pickup_address || item.pickup || 'Pickup Location';
    const destination = item.drop_address || item.destination || 'Drop-off Destination';
    const distanceKm = item.distance_km !== undefined ? Number(item.distance_km) : null;
    const durationMin =
      item.driver_to_pickup_eta_min ??
      item.estimated_duration_min ??
      (distanceKm ? Math.max(1, Math.round(distanceKm * 2)) : 5);
    const payout = item.driver_payout ?? item.fare ?? item.estimated_fare ?? 0;
    const currency = item.currency || 'USD';
    const riderName = item.rider_name || item.passengerName || 'Rider';
    const riderRating = item.rider_rating ? String(item.rider_rating) : '5.0';
    const isThisAccepting = acceptingRideId === rideId;

    return (
      <View style={styles.requestCard}>
        {/* Tappable Card Body (opens details to see map) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleSelectRequest(item)}
          style={styles.cardTouchableBody}
        >
          {/* Card Header: Vehicle Type Badge + Driver Earnings */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.vehicleTypeTag}>
              <Icon
                name={getVehicleIconName(vehicleType)}
                size={14}
                color={COLORS.primary}
              />
              <Text style={styles.vehicleTypeText}>{vehicleType}</Text>
            </View>

            <View style={styles.payoutWrap}>
              <Text style={styles.payoutLabel}>Earnings</Text>
              <Text style={styles.payoutAmount}>{formatPayout(payout, currency)}</Text>
            </View>
          </View>

          {/* Route Timeline */}
          <View style={styles.timelineContainer}>
            {/* Pickup */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineDotCol}>
                <View style={[styles.timelineDot, styles.dotPickup]} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.locationTypeLabel}>PICKUP</Text>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {pickup}
                </Text>
              </View>
            </View>

            {/* Drop */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineDotCol}>
                <View style={[styles.timelineDot, styles.dotDrop]} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.locationTypeLabel}>DROP-OFF</Text>
                <Text style={styles.locationAddress} numberOfLines={2}>
                  {destination}
                </Text>
              </View>
            </View>
          </View>

          {/* Trip Meta: Distance, Duration, Rider Info */}
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Icon name="time" size={13} color={COLORS.textLight} />
              <Text style={styles.metaBadgeText}>{durationMin} min</Text>
            </View>

            {distanceKm !== null && (
              <View style={styles.metaBadge}>
                <Icon name="navigation" size={13} color={COLORS.textLight} />
                <Text style={styles.metaBadgeText}>{distanceKm} km</Text>
              </View>
            )}

           
          </View>
        </TouchableOpacity>

        {/* Accept Button for direct ride acceptance */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleAcceptRequest(item)}
          disabled={actionLoading || Boolean(acceptingRideId)}
          style={[
            styles.acceptBtn,
            isThisAccepting && styles.acceptBtnDisabled,
          ]}
        >
          {isThisAccepting ? (
            <View style={styles.acceptBtnContent}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.acceptBtnText}>
                {t('driver.accepting', 'Accepting...')}
              </Text>
            </View>
          ) : (
            <View style={styles.acceptBtnContent}>
              <Text style={styles.acceptBtnText}>
                {t('driver.acceptRide', 'Accept')}
              </Text>
              <Icon name="check" size={18} color={COLORS.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Icon name="car" size={38} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>
        {t('driver.noRequestsAvailable', 'No Ride Requests Available')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isOnline
          ? t(
              'driver.noRequestsOnlineSub',
              'You are online! New ride requests from nearby riders will automatically appear here in real-time.'
            )
          : t(
              'driver.noRequestsOfflineSub',
              'You are currently offline. Please go online from your dashboard to receive ride requests.'
            )}
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onRefresh}
        style={styles.emptyRefreshBtn}
      >
        <Icon name="refresh" size={16} color={COLORS.primary} />
        <Text style={styles.emptyRefreshText}>
          {t('common.refresh', 'Refresh List')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={680} style={{ flex: 1 }}>
        <Header
          title={t('driver.rideRequests', 'Ride Requests')}
          onBack={() => navigation.goBack()}
        />

        {/* Count & Status Strip */}
        <View style={styles.topStatusStrip}>
          <View style={styles.countBadgeRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.countTitle}>
              {availableRideRequests.length}{' '}
              {availableRideRequests.length === 1 ? 'Request' : 'Requests'} Available
            </Text>
          </View>

          {requestsLoading && (
            <ActivityIndicator size="small" color={COLORS.primary} />
          )}
        </View>

        {/* Request List */}
        <FlatList
          data={availableRideRequests}
          keyExtractor={(item, index) =>
            item.ride_id ? String(item.ride_id) : `req_${index}`
          }
          renderItem={renderRequestItem}
          contentContainerStyle={[
            styles.listContent,
            availableRideRequests.length === 0 && { flexGrow: 1 },
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={requestsLoading}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={!requestsLoading ? renderEmptyState : null}
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
  topStatusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  countBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  countTitle: {
    fontSize: responsiveFont(15),
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    padding: SPACING.md,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  vehicleTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  vehicleTypeText: {
    fontSize: responsiveFont(12),
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  payoutWrap: {
    alignItems: 'flex-end',
  },
  payoutLabel: {
    fontSize: responsiveFont(11),
    color: '#6B7280',
    fontWeight: '500',
  },
  payoutAmount: {
    fontSize: responsiveFont(18),
    fontWeight: '800',
    color: '#111827',
  },
  timelineContainer: {
    marginBottom: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDotCol: {
    width: 20,
    alignItems: 'center',
    paddingTop: 3,
  },
  timelineDot: {
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
  timelineLine: {
    width: 2,
    height: 28,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 8,
  },
  locationTypeLabel: {
    fontSize: responsiveFont(10),
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: responsiveFont(13),
    color: '#1F2937',
    fontWeight: '500',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  metaBadgeText: {
    fontSize: responsiveFont(12),
    color: '#374151',
    fontWeight: '600',
  },
  metaRiderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
    flex: 1,
  },
  metaRiderText: {
    fontSize: responsiveFont(12),
    color: '#374151',
    fontWeight: '600',
  },
  cardTouchableBody: {
    width: '100%',
  },
  acceptBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  acceptBtnDisabled: {
    opacity: 0.75,
  },
  acceptBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptBtnText: {
    fontSize: responsiveFont(15),
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: responsiveFont(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: responsiveFont(13),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  emptyRefreshText: {
    fontSize: responsiveFont(13),
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default DriverRequestListScreen;
