import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { DriverLiveMap } from '../../components/navigation';
import CustomButton from '../../components/CustomButton';
import ProfileAvatar from '../../components/ProfileAvatar';
import Icon from '../../components/Icon';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { formatCurrency } from '../../utils/formatters';
import { MOCK_DRIVER_STATS, ACTIVE_MOCK_DRIVER } from '../../data/mockDrivers';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../../utils/responsive';
import {
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
} from '../../utils/locationService';
import { saveRole } from '../../utils/storage';
import {
  driverGoOnline,
  driverGoOffline,
  sendDriverLocationUpdate,
  driverAcceptRide,
  driverRejectRide,
  clearIncomingRideRequest,
  clearActionNotices,
  handleIncomingSocketMessage,
} from '../../redux/features/driver/driverSlice';

export const DriverHomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isSplitLayout, insets } = useResponsive();

  const {
    isOnline,
    onlineLoading,
    socketConnected,
    socketConnecting,
    incomingRideRequest,
    rideStatus,
    activeRide,
    actionLoading,
    currentLocation,
    lastLocationAck,
    rideTakenNotice,
  } = useSelector((state) => state.driver);
  const authUser = useSelector((state) => state.auth?.user);

  // Driver GPS coordinates [longitude, latitude]
  const [driverLocation, setDriverLocation] = useState([
    currentLocation?.lng || 76.7834,
    currentLocation?.lat || 30.6948,
  ]);
  const [driverHeading, setDriverHeading] = useState(45);
  const [requestCountdown, setRequestCountdown] = useState(15);
  const handledRideIdRef = useRef(null);
  const driverLocationRef = useRef(driverLocation);

  useEffect(() => {
    driverLocationRef.current = driverLocation;
  }, [driverLocation]);

  // Synchronize driver online status with backend and connect WebSocket (only when idle and no active ride)
  useEffect(() => {
    if (isOnline && rideStatus === 'idle' && !activeRide) {
      const loc = driverLocationRef.current;
      const coords = loc
        ? { lat: loc[1], lng: loc[0] }
        : null;
      dispatch(driverGoOnline(coords));
    }
  }, [dispatch, isOnline, rideStatus, activeRide]);

  // When real-time location_ack is received from server, update map driver location in real time
  useEffect(() => {
    if (lastLocationAck?.lat && lastLocationAck?.lng) {
      console.log('[DriverHome] Real-time location_ack received from server:', lastLocationAck);
      setDriverLocation([Number(lastLocationAck.lng), Number(lastLocationAck.lat)]);
    }
  }, [lastLocationAck]);

  // Fetch real GPS location and subscribe to live watch like RiderHomeScreen
  useEffect(() => {
    let watchId = null;

    const fetchGps = async () => {
      try {
        const loc = await getCurrentLocation();
        if (loc?.latitude && loc?.longitude) {
          setDriverLocation([loc.longitude, loc.latitude]);
          if (loc.heading !== undefined && loc.heading !== null) {
            setDriverHeading(loc.heading);
          }
        }
      } catch (err) {
        console.warn('[DriverHome] Initial GPS failed:', err);
      }

      watchId = await watchLocation(
        (loc) => {
          if (loc?.latitude && loc?.longitude) {
            setDriverLocation([loc.longitude, loc.latitude]);
            if (loc.heading !== undefined && loc.heading !== null) {
              setDriverHeading(loc.heading);
            }
          }
        },
        (err) => console.warn('[DriverHome] Location watch error:', err)
      );
    };

    fetchGps();

    return () => {
      if (watchId !== null) {
        clearLocationWatch(watchId);
      }
    };
  }, []);

  const handleRecenterLocation = useCallback(async () => {
    try {
      const loc = await getCurrentLocation();
      if (loc?.latitude && loc?.longitude) {
        setDriverLocation([loc.longitude, loc.latitude]);
        if (loc.heading !== undefined && loc.heading !== null) {
          setDriverHeading(loc.heading);
        }
        if (isOnline) {
          dispatch(
            sendDriverLocationUpdate({
              lat: loc.latitude,
              lng: loc.longitude,
            })
          );
        }
      }
    } catch (err) {
      console.warn('[DriverHome] Recenter error:', err);
    }
  }, [dispatch, isOnline]);

  // Stream location_update every 10 seconds automatically while online, idle, and WebSocket is connected
  useEffect(() => {
    if (!socketConnected || !isOnline || rideStatus !== 'idle' || activeRide) return;

    const pushPeriodicLocation = () => {
      const loc = driverLocationRef.current;
      if (loc && loc[0] && loc[1]) {
        const [lng, lat] = loc;
        dispatch(sendDriverLocationUpdate({ lat, lng }));
      }
    };

    // Immediate initial push on connect
    pushPeriodicLocation();

    // Automatically call this every 10 seconds again and again
    const intervalId = setInterval(pushPeriodicLocation, 10000);

    return () => clearInterval(intervalId);
  }, [socketConnected, isOnline, rideStatus, activeRide, dispatch]);

  // Listen for WebSocket incoming ride requests (only when driver is idle and has no active ride)
  useEffect(() => {
    if (rideStatus !== 'idle' || activeRide) {
      return;
    }

    if (incomingRideRequest) {
      console.log('[DriverHome] Real-time ride request received:', incomingRideRequest);
      if (handledRideIdRef.current !== incomingRideRequest.ride_id) {
        handledRideIdRef.current = incomingRideRequest.ride_id;
        setRequestCountdown(15);

        const req = incomingRideRequest;
        const curLoc = driverLocationRef.current || driverLocation;
        const params = {
          ride_id: req.ride_id,
          tripId: req.ride_id,
          pickup: req.pickup_address,
          destination: req.drop_address,
          passengerName: req.rider_name || 'Rider',
          passengerRating: req.rider_rating ? String(req.rider_rating) : '4.95',
          estimatedFare: req.driver_payout ?? req.fare ?? 0,
          currency: req.currency || 'USD',
          distanceToPickup: 'Nearby',
          timeToPickup: '3 mins',
          tripDistance: req.distance_km !== undefined ? `${req.distance_km} km` : '0 km',
          vehicleType: req.vehicle_type || 'CAR',
          pickupCoordinates:
            req.pickup_lat && req.pickup_lon
              ? [req.pickup_lon, req.pickup_lat]
              : [curLoc[0] + 0.003, curLoc[1] + 0.002],
          driverCoordinates: curLoc,
        };

        const parentNav = navigation.getParent();
        if (parentNav) {
          parentNav.navigate('RideRequest', params);
        } else {
          navigation.navigate('RideRequest', params);
        }
      }
    } else {
      handledRideIdRef.current = null;
    }
  }, [incomingRideRequest, navigation, rideStatus, activeRide, driverLocation]);

  // Handle ride taken by another driver or offer expired
  useEffect(() => {
    if (rideTakenNotice) {
      console.log('[DriverHome] Ride taken or offer expired:', rideTakenNotice);
      handledRideIdRef.current = null;
      setRequestCountdown(0);
      dispatch(clearIncomingRideRequest());
      dispatch(clearActionNotices());
    }
  }, [rideTakenNotice, dispatch]);

  // Request countdown timer (15s)
  useEffect(() => {
    if (!incomingRideRequest) return;
    if (requestCountdown <= 0) {
      const rideId = incomingRideRequest.ride_id;
      console.log('[DriverHome] Request countdown expired, declining ride:', rideId);
      if (incomingRideRequest && incomingRideRequest.ride_id === rideId) {
        dispatch(driverRejectRide({ rideId }));
      }
      dispatch(clearIncomingRideRequest());
      return;
    }
    const timer = setInterval(() => {
      setRequestCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [incomingRideRequest, requestCountdown, dispatch]);

  // Transition to accepted screen when ride status changes to accepted
  useEffect(() => {
    if (rideStatus === 'accepted' && activeRide) {
      const parentNav = navigation.getParent();
      const targetNav = parentNav || navigation;
      targetNav.navigate('DriverAcceptedRide', {
        ride_id: activeRide.ride_id,
        pickup: activeRide.pickup_address,
        destination: activeRide.drop_address,
        passengerName: activeRide.rider_name || 'Rider',
        passengerRating: activeRide.rider_rating ? String(activeRide.rider_rating) : '4.95',
        estimatedFare: activeRide.driver_payout ?? activeRide.fare ?? 0,
        currency: activeRide.currency || 'USD',
        distanceToPickup: 'Nearby',
        timeToPickup: '3 mins',
        tripDistance: activeRide.distance_km !== undefined ? `${activeRide.distance_km} km` : '0 km',
        vehicleType: activeRide.vehicle_type || 'CAR',
      });
    }
  }, [rideStatus, activeRide, navigation]);

  const handleAcceptIncomingRide = useCallback(() => {
    if (!incomingRideRequest) return;
    const rideId = incomingRideRequest.ride_id;
    const req = incomingRideRequest;
    console.log('[DriverHome] Accepting ride:', rideId);
    dispatch(driverAcceptRide({ rideId }));

    setTimeout(() => {
      const parentNav = navigation.getParent();
      const targetNav = parentNav || navigation;
      targetNav.navigate('DriverAcceptedRide', {
        ride_id: rideId,
        pickup: req.pickup_address,
        destination: req.drop_address,
        passengerName: req.rider_name || 'Rider',
        passengerRating: req.rider_rating ? String(req.rider_rating) : '4.95',
        estimatedFare: req.driver_payout ?? req.fare ?? 0,
        currency: req.currency || 'USD',
        distanceToPickup: 'Nearby',
        timeToPickup: '3 mins',
        tripDistance: req.distance_km !== undefined ? `${req.distance_km} km` : '0 km',
        vehicleType: req.vehicle_type || 'CAR',
      });
    }, 1000);
  }, [dispatch, incomingRideRequest, navigation]);

  const handleDeclineIncomingRide = useCallback(() => {
    if (!incomingRideRequest) return;
    const rideId = incomingRideRequest.ride_id;
    console.log('[DriverHome] Declining ride:', rideId);
    dispatch(driverRejectRide({ rideId }));
    dispatch(clearIncomingRideRequest());
  }, [dispatch, incomingRideRequest]);

  // Compute nearby dynamic ride requests / demand hotspots around driver live location
  const nearbyRequests = useMemo(() => {
    if (!driverLocation || !isOnline) return [];
    const [lng, lat] = driverLocation;
    return [
      { id: 'req_1', coordinate: [lng + 0.0032, lat + 0.0022], fare: '$18.50', distance: '0.4 mi' },
      { id: 'req_2', coordinate: [lng - 0.0028, lat + 0.0035], fare: '$26.00', distance: '0.8 mi' },
      { id: 'req_3', coordinate: [lng + 0.0024, lat - 0.0031], fare: '$14.20', distance: '0.5 mi' },
    ];
  }, [driverLocation, isOnline]);

  const toggleOnline = useCallback(() => {
    if (onlineLoading) return;
    if (isOnline) {
      dispatch(driverGoOffline());
    } else {
      const coords = driverLocation
        ? { lat: driverLocation[1], lng: driverLocation[0] }
        : null;
      dispatch(driverGoOnline(coords));
    }
  }, [dispatch, isOnline, onlineLoading, driverLocation]);

  const handleSimulateRequest = () => {
    const simReq = {
      type: 'ride_request',
      ride_id: 20,
      vehicle_type: 'CAR',
      pickup_address:
        'Prasad group of companies, 765, Purv Marg, Phase 2, Ward 22, Chandigarh, 160030, India',
      pickup_lat: driverLocation ? driverLocation[1] + 0.002 : 30.6948328,
      pickup_lon: driverLocation ? driverLocation[0] + 0.003 : 76.7835809,
      drop_address: 'Ludhiana, Punjab, India',
      distance_km: 92.03,
      driver_payout: 105.07,
      currency: 'USD',
    };
    dispatch(handleIncomingSocketMessage(simReq));
  };

  const mapPane = (
    <View style={styles.mapArea}>
      <DriverLiveMap
        driverCoordinate={driverLocation}
        driverHeading={driverHeading}
        driverStatus={isOnline ? 'Online' : 'Offline'}
        isOnline={isOnline}
        statusLabel={
          isOnline
            ? socketConnected
              ? t('driver.online', 'Online (Live)')
              : socketConnecting
              ? 'Connecting...'
              : t('driver.online', 'Online')
            : t('driver.offline', 'Offline')
        }
        pickupCoordinate={
          incomingRideRequest?.pickup_lon && incomingRideRequest?.pickup_lat
            ? [Number(incomingRideRequest.pickup_lon), Number(incomingRideRequest.pickup_lat)]
            : null
        }
        dropCoordinate={
          incomingRideRequest?.drop_lon && incomingRideRequest?.drop_lat
            ? [Number(incomingRideRequest.drop_lon), Number(incomingRideRequest.drop_lat)]
            : incomingRideRequest
            ? [75.8573, 30.9005]
            : null
        }
        pickupLabel={incomingRideRequest?.pickup_address}
        destinationLabel={incomingRideRequest?.drop_address}
        nearbyRequests={nearbyRequests}
        onRequestPress={() => {
          handleSimulateRequest();
        }}
        onRecenter={handleRecenterLocation}
        style={styles.fullMapStyle}
      />

      {/* Floating Driver Top Profile Bar */}
      <View style={[styles.topBar, { top: Math.max(insets.top + 8, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('DriverProfile')}
          style={styles.driverProfileBtn}
        >
          <ProfileAvatar
            imageUri={authUser?.profile_photo || ACTIVE_MOCK_DRIVER.avatar}
            name={authUser?.first_name || ACTIVE_MOCK_DRIVER.name}
            size={40}
            rating={authUser?.rating || ACTIVE_MOCK_DRIVER.rating}
            showRatingBadge={false}
          />
          <View style={styles.driverNameCol}>
            <Text style={styles.driverName} numberOfLines={1}>
              {authUser?.first_name
                ? `${authUser.first_name} ${authUser.last_name || ''}`.trim()
                : ACTIVE_MOCK_DRIVER.name}
            </Text>
            <View style={styles.driverRatingRow}>
              <Icon name="star" size={11} color={COLORS.secondary} />
              <Text style={styles.driverRatingText}>
                {authUser?.rating || ACTIVE_MOCK_DRIVER.rating}
              </Text>
              {socketConnected && (
                <View style={styles.liveSocketBadge}>
                  <View style={styles.liveSocketDot} />
                  <Text style={styles.liveSocketText}>LIVE</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.topActionsRow}>
          {/* Quick Switch to Rider Mode */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={async () => {
              console.log('[DriverHome] Switching role to RIDER');
              await saveRole('RIDER');
              navigation.replace('RiderNav');
            }}
            style={styles.switchRiderBtn}
          >
            <Icon name="user" size={13} color={COLORS.secondPrimary} />
            <Text style={styles.switchRiderText}>Rider Mode</Text>
          </TouchableOpacity>

          {/* Online / Offline Status Toggle Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleOnline}
            disabled={onlineLoading}
            style={[
              styles.statusPill,
              isOnline ? styles.onlinePill : styles.offlinePill,
            ]}
          >
            {onlineLoading ? (
              <ActivityIndicator
                size="small"
                color={isOnline ? COLORS.primaryDark : COLORS.text}
              />
            ) : (
              <>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isOnline
                        ? socketConnected
                          ? COLORS.primary
                          : '#F59E0B'
                        : '#9CA3AF',
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    { color: isOnline ? COLORS.primaryDark : COLORS.textLight },
                  ]}
                >
                  {isOnline
                    ? socketConnected
                      ? 'ONLINE'
                      : socketConnecting
                      ? 'CONNECTING'
                      : 'ONLINE'
                    : 'OFFLINE'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Incoming Trip Request Simulation Button */}
      {isOnline && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSimulateRequest}
          style={[
            styles.incomingRequestFloatingBadge,
            { top: Math.max(insets.top + 76, 84) },
          ]}
        >
          <View style={styles.floatingPulse} />
          <Icon name="flash" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.incomingBadgeText}>
            Incoming Request Available (Tap to test)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const summaryPanel = (
    <View
      style={[
        styles.bottomPanel,
        isOnline ? styles.onlinePanel : styles.offlinePanel,
        isSplitLayout && styles.sidePanel,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xl),
        },
      ]}
    >
      {!isSplitLayout && <View style={styles.dragHandle} />}

      {/* Earnings Ticker */}
      <View style={styles.earningsRow}>
        <View>
          <Text style={styles.earningsLabel}>
            {t('driver.todayEarnings', "Today's Earnings")}
          </Text>
          <Text style={styles.earningsAmount}>
            {formatCurrency(MOCK_DRIVER_STATS.dailyEarnings)}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('DriverEarnings')}
          style={styles.viewEarningsBtn}
        >
          <Text style={styles.viewEarningsText}>{t('driver.trips', 'Weekly Stats')} ›</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <Text style={styles.statNumber}>4.2 hrs</Text>
          <Text style={styles.statCaption}>{t('driver.hoursOnline', 'Online Time')}</Text>
        </View>

        <View style={styles.statCellDivider} />

        <View style={styles.statCell}>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statCaption}>{t('driver.tripsCompleted', 'Trips Completed')}</Text>
        </View>

        <View style={styles.statCellDivider} />

        <View style={styles.statCell}>
          <Text style={[styles.statNumber, { color: COLORS.primaryDark }]}>
            {MOCK_DRIVER_STATS.acceptanceRate}
          </Text>
          <Text style={styles.statCaption}>{t('driver.acceptRide', 'Acceptance')}</Text>
        </View>
      </View>

      {/* MapLibre Live Navigation Demo CTA */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('DriverMap')}
        style={styles.maplibreDemoBanner}
      >
        <View style={styles.maplibreIconBadge}>
          <Icon name="navigation" size={16} color={COLORS.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.maplibreTitle}>
            MapLibre Navigation UI
          </Text>
          <Text style={styles.maplibreSub}>Interactive driver demo map</Text>
        </View>
        <Icon
          name="chevron-right"
          size={18}
          color={COLORS.secondPrimary}
        />
      </TouchableOpacity>

      {/* Direct Action Trigger */}
      {isOnline ? (
        <CustomButton
          title="Simulate Incoming Trip"
          onPress={handleSimulateRequest}
          variant="primary"
          icon="navigation"
          iconPosition="right"
          style={styles.requestCta}
        />
      ) : (
        <CustomButton
          title={onlineLoading ? 'Going Online...' : 'Go Online to Receive Trips'}
          loading={onlineLoading}
          onPress={toggleOnline}
          variant="secondary"
          style={styles.requestCta}
        />
      )}
    </View>
  );

  const incomingRideSheet = incomingRideRequest && (
    <View
      style={[
        styles.bottomPanel,
        styles.incomingSheetContainer,
        isSplitLayout && styles.sidePanel,
        !isSplitLayout && {
          paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xl),
        },
      ]}
    >
      {!isSplitLayout && <View style={styles.dragHandle} />}

      {/* Header bar: Urgent alert + Vehicle tag + Countdown */}
      <View style={styles.incomingHeaderRow}>
        <View style={styles.incomingBadgePill}>
          <View style={styles.pulsingRedDot} />
          <Text style={styles.incomingBadgeTitle}>NEW RIDE REQUEST</Text>
        </View>

        <View style={styles.vehicleTypeTag}>
          <Text style={styles.vehicleTypeText}>
            {incomingRideRequest.vehicle_type || 'CAR'}
          </Text>
        </View>

        <View style={styles.countdownBadge}>
          <Icon name="time" size={12} color={COLORS.white} />
          <Text style={styles.countdownText}>{requestCountdown}s</Text>
        </View>
      </View>

      {/* Driver Payout & Distance */}
      <View style={styles.payoutContainer}>
        <Text style={styles.payoutLabel}>DRIVER PAYOUT</Text>
        <Text style={styles.payoutValue}>
          {formatCurrency(
            incomingRideRequest.driver_payout ?? incomingRideRequest.fare ?? 0,
            incomingRideRequest.currency === 'USD'
              ? '$'
              : incomingRideRequest.currency || '$'
          )}
        </Text>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceBadgeText}>
            {incomingRideRequest.distance_km !== undefined
              ? `${incomingRideRequest.distance_km} km trip`
              : 'Trip Distance'}
          </Text>
          <Text style={styles.rideIdText}>Ride #{incomingRideRequest.ride_id}</Text>
        </View>
      </View>

      {/* Route Addresses */}
      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <View style={styles.pickupDot} />
          <View style={styles.addressCol}>
            <Text style={styles.addressLabel}>PICKUP</Text>
            <Text numberOfLines={2} style={styles.addressText}>
              {incomingRideRequest.pickup_address || 'Pickup Location'}
            </Text>
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.routeRow}>
          <View style={styles.dropSquare} />
          <View style={styles.addressCol}>
            <Text style={styles.addressLabel}>DROPOFF</Text>
            <Text numberOfLines={2} style={styles.addressText}>
              {incomingRideRequest.drop_address ||
                incomingRideRequest.destination_address ||
                'Dropoff Location'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.incomingActionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleDeclineIncomingRide}
          style={styles.incomingDeclineBtn}
        >
          <Text style={styles.incomingDeclineText}>DECLINE</Text>
        </TouchableOpacity>

        <View style={styles.incomingAcceptBtnWrapper}>
          <CustomButton
            title={`ACCEPT (${requestCountdown}s)`}
            onPress={handleAcceptIncomingRide}
            loading={actionLoading}
            variant="primary"
            icon="check"
            iconPosition="right"
            style={styles.incomingAcceptBtn}
          />
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          const parentNav = navigation.getParent();
          const targetNav = parentNav || navigation;
          targetNav.navigate('RideRequest', {
            ride_id: incomingRideRequest.ride_id,
            pickup: incomingRideRequest.pickup_address,
            destination: incomingRideRequest.drop_address,
            estimatedFare: incomingRideRequest.driver_payout,
            currency: incomingRideRequest.currency,
            tripDistance: `${incomingRideRequest.distance_km} km`,
            vehicleType: incomingRideRequest.vehicle_type,
          });
        }}
        style={styles.viewFullMapBtn}
      >
        <Text style={styles.viewFullMapText}>View Full Route Map & Details ›</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={
          <ScrollView
            contentContainerStyle={
              isSplitLayout ? { flexGrow: 1 } : styles.scrollableBottomPane
            }
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {incomingRideRequest && rideStatus === 'requested' && !activeRide
              ? incomingRideSheet
              : summaryPanel}
          </ScrollView>
        }
        primaryRatio={0.55}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollableBottomPane: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 10,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  driverProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverNameCol: {
    marginLeft: SPACING.sm,
  },
  driverName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  driverRatingText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 3,
  },
  liveSocketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.round,
  },
  liveSocketDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
    marginRight: 4,
  },
  liveSocketText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2E7D32',
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  switchRiderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchRiderText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimary,
    marginLeft: 4,
    fontSize: 11,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.round,
  },
  onlinePill: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  offlinePill: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
    marginRight: 6,
  },
  statusPillText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mapArea: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  fullMapStyle: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  incomingRequestFloatingBadge: {
    position: 'absolute',
    top: 75,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.round,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingPulse: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  incomingBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
  },
  bottomPanel: {
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  onlinePanel: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  offlinePanel: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sidePanel: {
    height: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderLeftWidth: 1,
    borderTopWidth: 0,
    justifyContent: 'center',
  },
  dragHandle: {
    width: 42,
    height: 4,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  earningsLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.textLight,
  },
  earningsAmount: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 2,
    color: COLORS.text,
  },
  viewEarningsBtn: {
    padding: SPACING.xs,
  },
  viewEarningsText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.text,
  },
  statCaption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
    fontSize: 10,
  },
  statCellDivider: {
    width: 1,
    height: '70%',
    backgroundColor: COLORS.border,
  },
  requestCta: {
    width: '100%',
  },
  maplibreDemoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.large,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  maplibreIconBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maplibreTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  maplibreSub: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 1,
  },
  incomingSheetContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
  },
  incomingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  incomingBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
  },
  pulsingRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    marginRight: 6,
  },
  incomingBadgeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  vehicleTypeTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
  },
  vehicleTypeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B91C1C',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    gap: 4,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
  },
  payoutContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  payoutLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    letterSpacing: 1,
  },
  payoutValue: {
    ...TYPOGRAPHY.h1,
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.text,
    marginVertical: 2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  distanceBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
  },
  rideIdText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  routeContainer: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginTop: 4,
    marginRight: SPACING.sm,
  },
  dropSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: COLORS.secondPrimary,
    marginTop: 4,
    marginRight: SPACING.sm,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.border,
    marginLeft: 4,
    marginVertical: 2,
  },
  addressCol: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  addressText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 1,
  },
  incomingActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  incomingDeclineBtn: {
    height: 50,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.large,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  incomingDeclineText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.danger,
  },
  incomingAcceptBtnWrapper: {
    flex: 1,
  },
  incomingAcceptBtn: {
    width: '100%',
  },
  viewFullMapBtn: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  viewFullMapText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
});

export default DriverHomeScreen;
