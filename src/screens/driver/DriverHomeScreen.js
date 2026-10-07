import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
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
import { useResponsive, responsiveFont } from '../../utils/responsive';
import LanguageButton from '../../components/LanguageButton';
import { fetchUserProfile } from '../../redux/features/auth/authSlice';
import {
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
} from '../../utils/locationService';
import { saveRole, isGuestMode } from '../../utils/storage';
import { CustomAlertPopup } from '../../components/CustomAlertPopup';
import { useFocusEffect } from '@react-navigation/native';
import {
  driverGoOnline,
  driverGoOffline,
  sendDriverLocationUpdate,
  driverAcceptRide,
  driverRejectRide,
  clearIncomingRideRequest,
  clearActionNotices,
  handleIncomingSocketMessage,
  fetchDriverWallet,
  fetchDriverWalletSummary,
  fetchDriverHomeStats,
} from '../../redux/features/driver/driverSlice';

/**
 * Format decimal hours to readable string like '6h 30m' or '0h'
 */
const formatOnlineHours = (hours) => {
  if (hours == null || isNaN(Number(hours))) return '0h';
  const num = Number(hours);
  const h = Math.floor(num);
  const m = Math.round((num - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return '0h';
};

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
    distanceRemainingKm,
    etaMin,
    target,
    rideTakenNotice,
    wallet,
    walletSummary,
    homeStats,
    isHomeStatsLoading,
  } = useSelector((state) => state.driver);
  const authUser = useSelector((state) => state.auth?.user);

  const [selectedPeriod, setSelectedPeriod] = useState('today'); // 'today' | 'week' | 'all_time'

  const [isGuestStored, setIsGuestStored] = useState(false);
  useEffect(() => {
    isGuestMode().then((val) => {
      if (val) setIsGuestStored(true);
    });
  }, []);
  const isGuest = !authUser || !authUser?.id || isGuestStored;

  const [guestLoginModal, setGuestLoginModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const promptGuestLogin = useCallback(
    (
      msgKey = 'auth.loginRequiredGeneralMsg',
      defMsg = 'Please log in first to access this feature.'
    ) => {
      setGuestLoginModal({
        visible: true,
        title: t('auth.loginRequired', 'Login Required'),
        message: t(msgKey, defMsg),
      });
    },
    [t]
  );

  const driverDisplayName = useMemo(() => {
    const raw =
      authUser?.full_name ||
      (authUser?.first_name ? `${authUser.first_name} ${authUser.last_name || ''}`.trim() : null) ||
      authUser?.name;
    if (raw) {
      return raw
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    return t('auth.guestDriver', 'Driver');
  }, [authUser, t]);

  const driverRating = useMemo(() => {
    if (homeStats?.rating !== undefined && homeStats?.rating !== null) {
      return Number(homeStats.rating);
    }
    return (
      authUser?.driver_profile?.rating_avg ||
      authUser?.rider_profile?.rating_avg ||
      authUser?.rating ||
      5.0
    );
  }, [homeStats, authUser]);

  const periodStats = useMemo(() => {
    const statsObj = homeStats?.[selectedPeriod];
    if (statsObj) {
      return {
        online_hours: Number(statsObj.online_hours || 0),
        total_rides: Number(statsObj.total_rides || 0),
        total_earnings: Number(statsObj.total_earnings || 0),
      };
    }
    if (selectedPeriod === 'today') {
      const fallbackEarnings =
        walletSummary?.today_earnings != null
          ? Number(walletSummary.today_earnings)
          : wallet?.balance != null
            ? Number(wallet.balance)
            : 0;
      const fallbackRides =
        walletSummary?.completed_rides != null
          ? Number(walletSummary.completed_rides)
          : authUser?.driver_profile?.total_rides || 0;
      const fallbackHours = Number(authUser?.driver_profile?.online_hours || 0);
      return {
        online_hours: fallbackHours,
        total_rides: fallbackRides,
        total_earnings: fallbackEarnings,
      };
    }
    return {
      online_hours: 0,
      total_rides: 0,
      total_earnings: 0,
    };
  }, [homeStats, selectedPeriod, walletSummary, wallet, authUser]);

  const earningsLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 'week':
        return t('driver.weekEarnings', "This Week's Earnings");
      case 'all_time':
        return t('driver.allTimeEarnings', 'All Time Earnings');
      case 'today':
      default:
        return t('driver.todayEarnings', "Today's Earnings");
    }
  }, [selectedPeriod, t]);

  const earningsValueFormatted = useMemo(() => {
    const amount = Number(periodStats.total_earnings || 0);
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [periodStats.total_earnings]);

  const ridesCompletedDisplay = useMemo(() => {
    return String(periodStats.total_rides || 0);
  }, [periodStats.total_rides]);

  const onlineTimeDisplay = useMemo(() => {
    return formatOnlineHours(periodStats.online_hours);
  }, [periodStats.online_hours]);

  const totalDriverRidesCount = useMemo(() => {
    if (homeStats?.all_time?.total_rides !== undefined && homeStats?.all_time?.total_rides !== null) {
      return homeStats.all_time.total_rides;
    }
    return authUser?.driver_profile?.total_rides || periodStats.total_rides || 0;
  }, [homeStats, authUser, periodStats]);

  const hasActiveDriverRide = Boolean(
    activeRide &&
    (rideStatus === 'accepted' || rideStatus === 'arrived' || rideStatus === 'in_progress')
  );

  const activeDropCoords = useMemo(() => {
    if (!activeRide) return null;
    const lng =
      activeRide.drop_lon ??
      activeRide.drop?.lng ??
      activeRide.drop?.lon ??
      activeRide.drop_longitude ??
      activeRide.destination_lon;
    const lat =
      activeRide.drop_lat ??
      activeRide.drop?.lat ??
      activeRide.drop_latitude ??
      activeRide.destination_lat;
    if (lng && lat) return [Number(lng), Number(lat)];
    return null;
  }, [activeRide]);

  const activePickupCoords = useMemo(() => {
    if (!activeRide) return null;
    const lng =
      activeRide.pickup_lon ??
      activeRide.pickup?.lng ??
      activeRide.pickup?.lon ??
      activeRide.pickup_longitude;
    const lat =
      activeRide.pickup_lat ??
      activeRide.pickup?.lat ??
      activeRide.pickup_latitude;
    if (lng && lat) return [Number(lng), Number(lat)];
    return null;
  }, [activeRide]);

  // Driver GPS coordinates [longitude, latitude]
  const [driverLocation, setDriverLocation] = useState([
    currentLocation?.lng || 76.7834,
    currentLocation?.lat || 30.6948,
  ]);
  const [driverHeading, setDriverHeading] = useState(45);
  const [requestCountdown, setRequestCountdown] = useState(60);
  const handledRideIdRef = useRef(null);
  const navigatedRideIdRef = useRef(null);
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
      const newLng = Number(lastLocationAck.lng);
      const newLat = Number(lastLocationAck.lat);
      setDriverLocation((prev) => {
        if (
          prev &&
          Math.abs(prev[0] - newLng) < 0.00002 &&
          Math.abs(prev[1] - newLat) < 0.00002
        ) {
          return prev;
        }
        return [newLng, newLat];
      });
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

  // Fetch user profile from /api/v1/auth/profile/, wallet, summary, and home stats on mount
  useEffect(() => {
    dispatch(fetchUserProfile());
    if (!isGuest) {
      dispatch(fetchDriverHomeStats());
      dispatch(fetchDriverWallet());
      dispatch(fetchDriverWalletSummary());
    }
  }, [dispatch, isGuest]);

  // Refresh home stats and wallet when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (!isGuest) {
        dispatch(fetchDriverHomeStats());
        dispatch(fetchDriverWallet());
        dispatch(fetchDriverWalletSummary());
      }
    }, [dispatch, isGuest])
  );

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
        setRequestCountdown(60);

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
              ? [Number(req.pickup_lon), Number(req.pickup_lat)]
              : [curLoc[0] + 0.003, curLoc[1] + 0.002],
          dropCoordinates:
            req.drop_lat && req.drop_lon
              ? [Number(req.drop_lon), Number(req.drop_lat)]
              : undefined,
          pickup_lat: req.pickup_lat,
          pickup_lon: req.pickup_lon,
          drop_lat: req.drop_lat,
          drop_lon: req.drop_lon,
          distance_km: req.distance_km,
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

  // Request countdown timer (60s / 1 min)
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

  // Transition to accepted screen when ride status changes to accepted (first time only)
  useEffect(() => {
    if (rideStatus === 'accepted' && activeRide && activeRide.ride_id) {
      if (navigatedRideIdRef.current === activeRide.ride_id) {
        // Driver already navigated to this ride; do not loop if user navigated back
        return;
      }
      navigatedRideIdRef.current = activeRide.ride_id;
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
        pickup_lat: activeRide.pickup_lat,
        pickup_lon: activeRide.pickup_lon,
        drop_lat: activeRide.drop_lat,
        drop_lon: activeRide.drop_lon,
        distance_km: activeRide.distance_km,
        pickupCoordinates:
          activeRide.pickup_lon && activeRide.pickup_lat
            ? [Number(activeRide.pickup_lon), Number(activeRide.pickup_lat)]
            : undefined,
        dropCoordinates:
          activeRide.drop_lon && activeRide.drop_lat
            ? [Number(activeRide.drop_lon), Number(activeRide.drop_lat)]
            : undefined,
      });
    } else if (rideStatus === 'idle' || !activeRide) {
      navigatedRideIdRef.current = null;
    }
  }, [rideStatus, activeRide, navigation]);

  // Navigate back to ongoing screen/state when clicking Active Trip Card/Banner
  const handleResumeDriverTrip = useCallback(() => {
    if (isGuest) {
      promptGuestLogin();
      return;
    }
    if (!activeRide) return;
    const parentNav = navigation.getParent();
    const targetNav = parentNav || navigation;

    const curLoc = driverLocationRef.current || driverLocation;
    const pLat = activeRide.pickup_lat ?? activeRide.pickup?.lat;
    const pLon =
      activeRide.pickup_lon ??
      activeRide.pickup?.lng ??
      activeRide.pickup?.lon;
    const dLat = activeRide.drop_lat ?? activeRide.drop?.lat;
    const dLon =
      activeRide.drop_lon ?? activeRide.drop?.lng ?? activeRide.drop?.lon;

    const params = {
      ride_id: activeRide.ride_id,
      tripId: activeRide.ride_id,
      pickup:
        activeRide.pickup_address ||
        activeRide.pickup?.address ||
        activeRide.pickup?.display_name ||
        activeRide.pickup ||
        'Pickup Location',
      destination:
        activeRide.drop_address ||
        activeRide.drop?.address ||
        activeRide.drop?.display_name ||
        activeRide.drop ||
        'Drop Location',
      drop:
        activeRide.drop_address ||
        activeRide.drop?.address ||
        activeRide.drop?.display_name ||
        activeRide.drop ||
        'Drop Location',
      passengerName:
        activeRide.rider_name || activeRide.rider?.name || 'Rider',
      passengerPhone: activeRide.rider_phone || activeRide.rider?.phone,
      passengerRating: activeRide.rider_rating
        ? String(activeRide.rider_rating)
        : '4.95',
      estimatedFare: activeRide.driver_payout ?? activeRide.fare ?? 0,
      fare: activeRide.driver_payout ?? activeRide.fare ?? 0,
      currency: activeRide.currency || 'USD',
      distanceToPickup:
        distanceRemainingKm !== null && distanceRemainingKm !== undefined
          ? `${distanceRemainingKm} km`
          : 'Nearby',
      timeToPickup:
        etaMin !== null && etaMin !== undefined
          ? `${etaMin} mins`
          : '3 mins',
      tripDistance:
        activeRide.distance_km !== undefined
          ? `${activeRide.distance_km} km`
          : '0 km',
      vehicleType: activeRide.vehicle_type || 'CAR',
      pickup_lat: pLat,
      pickup_lon: pLon,
      drop_lat: dLat,
      drop_lon: dLon,
      distance_km: activeRide.distance_km,
      pickupCoordinates:
        pLon && pLat ? [Number(pLon), Number(pLat)] : undefined,
      dropCoordinates:
        dLon && dLat ? [Number(dLon), Number(dLat)] : undefined,
      driverCoordinates: curLoc,
    };

    if (rideStatus === 'arrived') {
      targetNav.navigate('DriverArrived', params);
    } else if (rideStatus === 'in_progress') {
      targetNav.navigate('DriverTrip', params);
    } else {
      targetNav.navigate('DriverAcceptedRide', params);
    }
  }, [
    activeRide,
    rideStatus,
    navigation,
    driverLocation,
    distanceRemainingKm,
    etaMin,
    isGuest,
    promptGuestLogin,
  ]);

  const handleAcceptIncomingRide = useCallback(() => {
    if (isGuest) {
      promptGuestLogin();
      return;
    }
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
        pickup_lat: req.pickup_lat,
        pickup_lon: req.pickup_lon,
        drop_lat: req.drop_lat,
        drop_lon: req.drop_lon,
        distance_km: req.distance_km,
        pickupCoordinates:
          req.pickup_lon && req.pickup_lat
            ? [Number(req.pickup_lon), Number(req.pickup_lat)]
            : undefined,
        dropCoordinates:
          req.drop_lon && req.drop_lat
            ? [Number(req.drop_lon), Number(req.drop_lat)]
            : undefined,
      });
    }, 1000);
  }, [dispatch, incomingRideRequest, navigation, isGuest, promptGuestLogin]);

  const handleDeclineIncomingRide = useCallback(() => {
    if (isGuest) {
      promptGuestLogin();
      return;
    }
    if (!incomingRideRequest) return;
    const rideId = incomingRideRequest.ride_id;
    console.log('[DriverHome] Declining ride:', rideId);
    dispatch(driverRejectRide({ rideId }));
    dispatch(clearIncomingRideRequest());
  }, [dispatch, incomingRideRequest, isGuest, promptGuestLogin]);

  // Compute nearby dynamic ride requests / demand hotspots around driver live location
  const nearbyRequests = useMemo(() => {
    if (!driverLocation || !isOnline) return [];
    const [lng, lat] = driverLocation;

  }, [driverLocation, isOnline]);

  const toggleOnline = useCallback(() => {
    if (onlineLoading) return;
    if (isGuest) {
      promptGuestLogin(
        'auth.loginRequiredGoOnlineMsg',
        'Please log in first to go online and receive ride requests.'
      );
      return;
    }
    if (isOnline) {
      dispatch(driverGoOffline());
    } else {
      const coords = driverLocation
        ? { lat: driverLocation[1], lng: driverLocation[0] }
        : null;
      dispatch(driverGoOnline(coords));
    }
  }, [dispatch, isOnline, onlineLoading, driverLocation, isGuest, promptGuestLogin]);

  const handleSimulateRequest = () => {
    const simReq = {
      type: 'ride_request',
      ride_id: 20,
      vehicle_type: 'CAR',
      pickup_address:
        '',
      pickup_lat: driverLocation ? driverLocation[1] + 0.002 : 30.6948328,
      pickup_lon: driverLocation ? driverLocation[0] + 0.003 : 76.7835809,
      drop_address: 'Ludhiana, Punjab, India',
      distance_km: 92.03,
      driver_payout: 105.07,
      currency: 'USD',
    };
    dispatch(handleIncomingSocketMessage(simReq));
  };

  const mapPane = useMemo(() => (
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
        target={
          target ||
          lastLocationAck?.target ||
          (rideStatus === 'in_progress' ? 'drop' : 'pickup')
        }
        pickupCoordinate={
          incomingRideRequest?.pickup_lon && incomingRideRequest?.pickup_lat
            ? [Number(incomingRideRequest.pickup_lon), Number(incomingRideRequest.pickup_lat)]
            : activePickupCoords
        }
        dropCoordinate={
          incomingRideRequest?.drop_lon && incomingRideRequest?.drop_lat
            ? [Number(incomingRideRequest.drop_lon), Number(incomingRideRequest.drop_lat)]
            : activeDropCoords
        }
        pickupLabel={incomingRideRequest?.pickup_address || activeRide?.pickup_address || activeRide?.pickup?.address}
        destinationLabel={incomingRideRequest?.drop_address || activeRide?.drop_address || activeRide?.drop?.address}
        onRequestPress={handleSimulateRequest}
        onRecenter={handleRecenterLocation}
        style={styles.fullMapStyle}
      />



      {/* Floating Active Trip Banner on Map */}
      {hasActiveDriverRide && (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleResumeDriverTrip}
          style={[
            styles.floatingActiveTripBanner,
            { bottom: isSplitLayout ? 24 : 16 },
          ]}
        >
          <View
            style={[
              styles.floatingActiveDot,
              rideStatus === 'arrived'
                ? { backgroundColor: '#10B981' }
                : rideStatus === 'in_progress'
                  ? { backgroundColor: '#3B82F6' }
                  : { backgroundColor: '#F59E0B' },
            ]}
          />
          <View style={styles.floatingActiveTextCol}>
            <Text style={styles.floatingActiveTitle}>
              {rideStatus === 'arrived'
                ? '📍 Arrived at Pickup • Awaiting OTP'
                : rideStatus === 'in_progress'
                  ? '🚗 Trip in Progress • On Route'
                  : '🟡 Active Ride • Heading to Pickup'}
            </Text>
            <Text style={styles.floatingActiveSub}>
              Tap to return to active trip screen ›
            </Text>
          </View>
          <Icon name="chevron-right" size={18} color={COLORS.text} />
        </TouchableOpacity>
      )}

    </View>
  ), [
    driverLocation,
    driverHeading,
    isOnline,
    socketConnected,
    socketConnecting,
    t,
    target,
    lastLocationAck,
    rideStatus,
    incomingRideRequest,
    activePickupCoords,
    activeDropCoords,
    activeRide,
    handleRecenterLocation,
    hasActiveDriverRide,
    handleResumeDriverTrip,
    isSplitLayout,
  ]);

  const summaryPanel = (
    <View style={styles.summaryPanelContainer}>
      {/* Active Trip Banner / Card (Visible when Driver backed out to HomeScreen with active ride) */}
      {hasActiveDriverRide && activeRide && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleResumeDriverTrip}
          style={styles.activeTripCard}
        >
          {/* Card Top: Stage Tag + Live Pulse + ETA */}
          <View style={styles.activeTripHeaderRow}>
            <View
              style={[
                styles.activeTripStageTag,
                rideStatus === 'arrived'
                  ? styles.stageArrivedTag
                  : rideStatus === 'in_progress'
                    ? styles.stageTripTag
                    : styles.stageAcceptedTag,
              ]}
            >
              <View
                style={[
                  styles.activeTripLiveDot,
                  rideStatus === 'arrived'
                    ? { backgroundColor: '#10B981' }
                    : rideStatus === 'in_progress'
                      ? { backgroundColor: '#3B82F6' }
                      : { backgroundColor: '#F59E0B' },
                ]}
              />
              <Text
                style={[
                  styles.activeTripStageText,
                  rideStatus === 'arrived'
                    ? { color: '#047857' }
                    : rideStatus === 'in_progress'
                      ? { color: '#1D4ED8' }
                      : { color: '#B45309' },
                ]}
              >
                {rideStatus === 'arrived'
                  ? 'ARRIVED AT PICKUP'
                  : rideStatus === 'in_progress'
                    ? 'TRIP IN PROGRESS'
                    : 'HEADING TO PICKUP'}
              </Text>
            </View>

            <View style={styles.activeTripEtaBadge}>
              <Icon name="time" size={13} color={COLORS.textLight} />
              <Text style={styles.activeTripEtaText}>
                {rideStatus === 'arrived'
                  ? 'Waiting for Rider'
                  : etaMin !== null && etaMin !== undefined
                    ? `${etaMin} min away`
                    : distanceRemainingKm !== null && distanceRemainingKm !== undefined
                      ? `${distanceRemainingKm} km`
                      : 'Active'}
              </Text>
            </View>
          </View>

          {/* Passenger & Fare Info Row */}
          <View style={styles.activeTripRiderRow}>
            <View style={styles.activeTripAvatar}>
              <Icon name="user" size={18} color={COLORS.primaryDark} />
            </View>
            <View style={styles.activeTripRiderCol}>
              <Text style={styles.activeTripRiderName} numberOfLines={1}>
                {activeRide.rider_name || activeRide.rider?.name || 'Rider'}
              </Text>
              <Text style={styles.activeTripRiderRating}>
                ★ {activeRide.rider_rating ? String(activeRide.rider_rating) : '4.95'} • Ride #{activeRide.ride_id}
              </Text>
            </View>
            <View style={styles.activeTripPayoutCol}>
              <Text style={styles.activeTripPayoutAmount}>
                {formatCurrency(
                  activeRide.driver_payout ?? activeRide.fare ?? 0,
                  activeRide.currency === 'USD' ? '$' : activeRide.currency || '$'
                )}
              </Text>
              <Text style={styles.activeTripPayoutLabel}>Payout</Text>
            </View>
          </View>

          {/* Big Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleResumeDriverTrip}
            style={[
              styles.activeTripResumeBtn,
              rideStatus === 'arrived'
                ? { backgroundColor: '#10B981' }
                : rideStatus === 'in_progress'
                  ? { backgroundColor: '#2563EB' }
                  : { backgroundColor: COLORS.primary },
            ]}
          >
            <Text style={styles.activeTripResumeBtnText}>
              {rideStatus === 'arrived'
                ? 'Enter OTP & Start Trip ›'
                : rideStatus === 'in_progress'
                  ? 'Return to Live Trip Map ›'
                  : 'Return to Active Trip ›'}
            </Text>
            <Icon name="arrow-right" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* 1. Hero Promo Banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={require('../../assets/images/driver_promo_banner.png')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      </View>

      {/* 2. Status Card (You are Online / Offline + Go Offline / Online) */}
      <View style={styles.statusCard}>
        <View style={styles.statusLeftRow}>
          <View
            style={[
              styles.statusCircleOuter,
              isOnline ? styles.statusCircleOuterOnline : styles.statusCircleOuterOffline,
            ]}
          >
            <View
              style={[
                styles.statusCircleInner,
                isOnline ? styles.statusCircleInnerOnline : styles.statusCircleInnerOffline,
              ]}
            />
          </View>
          <View style={styles.statusTextCol}>
            <Text style={styles.statusTitle}>
              {isOnline
                ? t('driver.youAreOnline', 'You are Online')
                : t('driver.youAreOffline', 'You are Offline')}
            </Text>
            <Text style={styles.statusSubtitle} numberOfLines={1}>
              {isOnline
                ? t('driver.readyForRequests', 'Ready to receive ride requests')
                : t('driver.goOnlineToStart', 'Go online to start receiving rides')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleOnline}
          disabled={onlineLoading}
          style={[
            styles.statusToggleBtn,
            isOnline ? styles.statusToggleBtnOnline : styles.statusToggleBtnOffline,
          ]}
        >
          {onlineLoading ? (
            <ActivityIndicator
              size="small"
              color={isOnline ? '#DC2626' : '#16A34A'}
            />
          ) : (
            <>
              <Icon
                name="power"
                size={16}
                color={isOnline ? '#DC2626' : '#16A34A'}
              />
              <Text
                style={[
                  styles.statusToggleText,
                  isOnline ? styles.statusToggleTextOnline : styles.statusToggleTextOffline,
                ]}
              >
                {isOnline
                  ? t('driver.goOffline', 'Go Offline')
                  : t('driver.goOnline', 'Go Online')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 3. Driver Profile & Earnings Summary Card */}
      <View style={styles.driverSummaryCard}>
        {/* Period Selector Tabs: Today | This Week | All Time */}
        <View style={styles.periodTabsRow}>
          {[
            { key: 'today', label: t('driver.today', 'Today') },
            { key: 'week', label: t('driver.thisWeek', 'Weekly') },
            { key: 'all_time', label: t('driver.allTime', 'All Time') },
          ].map((period) => {
            const isActive = selectedPeriod === period.key;
            return (
              <TouchableOpacity
                key={period.key}
                activeOpacity={0.75}
                onPress={() => setSelectedPeriod(period.key)}
                style={[
                  styles.periodTabBtn,
                  isActive && styles.periodTabBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    isActive && styles.periodTabTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Top: Avatar & Name | Divider | Period Earnings */}
        <View style={styles.summaryTopRow}>
          {/* Driver Profile */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              if (isGuest) {
                promptGuestLogin(
                  'auth.loginRequiredProfileMsg',
                  'Please log in first to edit and save your personal details.'
                );
                return;
              }
              navigation.navigate('DriverProfile');
            }}
            style={styles.driverProfileCol}
          >
            <View style={styles.avatarWrapper}>
              <ProfileAvatar
                imageUri={authUser?.profile_photo}
                name={driverDisplayName}
                size={54}
                showRatingBadge={false}
              />
              <View style={styles.avatarEditBadge}>
                <Icon name="pencil" size={15} color="#059669" />
              </View>
            </View>

            <View style={styles.driverMetaCol}>
              <Text style={styles.driverNameText} numberOfLines={1}>
                {driverDisplayName}
              </Text>
              <View style={styles.ratingRow}>
                <Icon name="star" size={15} color="#F59E0B" />
                <Text style={styles.ratingNumberText}>
                  {driverRating ? Number(driverRating).toFixed(1) : '5.0'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Vertical Divider */}
          <View style={styles.summaryVerticalDivider} />

          {/* Period Earnings */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              if (isGuest) {
                promptGuestLogin(
                  'auth.loginRequiredEarningsMsg',
                  'Please log in first to view real earnings and withdraw payouts.'
                );
                return;
              }
              navigation.navigate('DriverEarnings');
            }}
            style={styles.earningsCol}
          >
            <View style={styles.earningsIconBox}>
              <Icon name="wallet" size={22} color="#059669" />
            </View>
            <View style={styles.earningsTextCol}>
              <Text style={styles.earningsCaption} numberOfLines={1}>
                {earningsLabel}
              </Text>
              <Text style={styles.earningsValueText} numberOfLines={1}>
                ${earningsValueFormatted}
              </Text>
            </View>
            {isHomeStatsLoading ? (
              <ActivityIndicator size="small" color="#059669" style={{ marginLeft: 4 }} />
            ) : (
              <Icon name="chevron-right" size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Metrics: Online Time | Rides Completed | Rating */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>{t('driver.onlineTime', 'Online Time')}</Text>
            <View style={styles.metricContent}>

              <View style={styles.metricIconCircle}>
                <Icon name="time" size={18} color="#036747" />
              </View>
              <Text style={styles.metricValue}>{onlineTimeDisplay}</Text>
            </View>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>{t('driver.ridesCompleted', 'Rides Completed')}</Text>
            <View style={styles.metricContent}>

              <View style={styles.metricIconCircle}>
                <Icon name="bike" size={18} color="#059669" />
              </View>
              <Text style={styles.metricValue}>{ridesCompletedDisplay}</Text>
            </View>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricCell}>
            <Text style={styles.metricLabel}>{t('driver.rating', 'Rating')}</Text>
            <View style={styles.metricContent}>

              <View style={[styles.metricIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Icon name="star" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.metricValue}>
                {driverRating ? Number(driverRating).toFixed(1) : '5.0'}
              </Text>
            </View>
          </View>
        </View>
      </View>
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


    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
      />

      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={
          <ScrollView
            contentContainerStyle={[
              styles.scrollableBottomPane,
              isSplitLayout && { flexGrow: 1 },
              { paddingBottom: Math.max(insets.bottom + 20, 36) },
            ]}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {incomingRideRequest && rideStatus === 'requested' && !activeRide
              ? incomingRideSheet
              : summaryPanel}
          </ScrollView>
        }
        primaryRatio={0.42}
      />

      {/* Guest Mode Login Required Alert Popup */}
      <CustomAlertPopup
        visible={guestLoginModal.visible}
        type="warning"
        title={guestLoginModal.title || t('auth.loginRequired', 'Login Required')}
        message={guestLoginModal.message}
        confirmText={t('auth.login', 'Log In')}
        cancelText={t('common.cancel', 'Cancel')}
        onConfirm={() => {
          setGuestLoginModal({ visible: false, title: '', message: '' });
          navigation.reset({
  index: 0,
  routes: [{ name: 'Login' }],
});
        }}
        onCancel={() => {
          setGuestLoginModal({ visible: false, title: '', message: '' });
        }}
        onClose={() => {
          setGuestLoginModal({ visible: false, title: '', message: '' });
        }}
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
    backgroundColor: '#F8FAFC',
    padding: SPACING.md,
  },
  summaryPanelContainer: {
    gap: 12,
  },
  bannerContainer: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerImage: {
    width: '100%',
    height: 145,
    borderRadius: 18,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statusLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  statusCircleOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusCircleOuterOnline: {
    backgroundColor: '#DCFCE7',
  },
  statusCircleOuterOffline: {
    backgroundColor: '#F1F5F9',
  },
  statusCircleInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  statusCircleInnerOnline: {
    backgroundColor: '#16A34A',
  },
  statusCircleInnerOffline: {
    backgroundColor: '#94A3B8',
  },
  statusTextCol: {
    flex: 1,
  },
  floatingLangWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
  },
  statusTitle: {
    ...TYPOGRAPHY.body,
    fontSize: responsiveFont(18),
    fontWeight: '800',
    color: COLORS.text,
  },
  statusSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(12),
    color: COLORS.textLight,
    marginTop: 2,
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.round,
    gap: 6,
  },
  statusToggleBtnOnline: {
    backgroundColor: '#FEE2E2',
  },
  statusToggleBtnOffline: {
    backgroundColor: '#DCFCE7',
  },
  statusToggleText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(13),
    fontWeight: '800',
  },
  statusToggleTextOnline: {
    color: '#DC2626',
  },
  statusToggleTextOffline: {
    color: '#16A34A',
  },
  driverSummaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  periodTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
    gap: 4,
  },
  periodTabBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  periodTabText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    fontWeight: '600',
    color: COLORS.textLight,
  },
  periodTabTextActive: {
    fontWeight: '800',
    color: '#059669',
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverProfileCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  driverMetaCol: {
    marginLeft: 12,
    flex: 1,
  },
  driverNameText: {
    ...TYPOGRAPHY.h3,
    fontSize: responsiveFont(19),
    fontWeight: '800',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  ratingNumberText: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: responsiveFont(14),
    fontWeight: '800',
    color: COLORS.text,
  },
  ratingCountText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(12),
    color: COLORS.textLight,
  },
  summaryVerticalDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  earningsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.1,
  },
  earningsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  earningsTextCol: {
    flex: 1,
  },
  earningsCaption: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    color: COLORS.textLight,
  },
  earningsValueText: {
    ...TYPOGRAPHY.title,
    fontSize: responsiveFont(19),
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 1,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 14,
  },
  metricCell: {
    flex: 1,
    flexDirection: "column",
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  metricIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight:5,
    marginBottom: 4,
  },
  metricContent: {
    alignItems: 'center',
    justifyContent:"center",
    flexDirection:'row',
  },
  metricLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    color: COLORS.textLight,
    textAlign: 'center',
  },
  metricValue: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: responsiveFont(14),
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 1,
    textAlign: 'center',
  },
  metricSub: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(9),
    color: COLORS.textLight,
    textAlign: 'center',
  },
  metricDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#DCFCE7',
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
    fontSize: responsiveFont(32),
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
    fontSize: responsiveFont(10),
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
    fontSize: responsiveFont(11),
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
    fontSize: responsiveFont(11),
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
    fontSize: responsiveFont(11),
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
    fontSize: responsiveFont(12),
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
    fontSize: responsiveFont(36),
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
    fontSize: responsiveFont(10),
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

  // Active Trip Banner & Card Styles
  floatingActiveTripBanner: {
    position: 'absolute',
    alignSelf: 'center',
    width: '92%',
    maxWidth: 500,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  floatingActiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  floatingActiveTextCol: {
    flex: 1,
  },
  floatingActiveTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.text,
  },
  floatingActiveSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontWeight: '600',
    marginTop: 1,
    fontSize: responsiveFont(11),
  },
  activeTripCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  activeTripHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  activeTripStageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
  },
  stageAcceptedTag: {
    backgroundColor: '#FEF3C7',
  },
  stageArrivedTag: {
    backgroundColor: '#D1FAE5',
  },
  stageTripTag: {
    backgroundColor: '#DBEAFE',
  },
  activeTripLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  activeTripStageText: {
    fontSize: responsiveFont(11),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeTripEtaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeTripEtaText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  activeTripRiderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  activeTripAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  activeTripRiderCol: {
    flex: 1,
  },
  activeTripRiderName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  activeTripRiderRating: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  activeTripPayoutCol: {
    alignItems: 'flex-end',
  },
  activeTripPayoutAmount: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  activeTripPayoutLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  activeTripRouteBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  activeTripRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTripPickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  activeTripDropSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: COLORS.danger,
    marginRight: SPACING.sm,
  },
  activeTripRouteLine: {
    width: 1.5,
    height: 12,
    backgroundColor: COLORS.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  activeTripAddressText: {
    flex: 1,
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '600',
  },
  activeTripResumeBtn: {
    height: 46,
    borderRadius: RADIUS.large,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  activeTripResumeBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});

export default DriverHomeScreen;
