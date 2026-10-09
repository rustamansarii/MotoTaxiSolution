import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { RiderLiveMap } from '../../components/navigation';
import ProfileAvatar from '../../components/ProfileAvatar';
import Icon from '../../components/Icon';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useTranslation } from 'react-i18next';
import {
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
} from '../../utils/locationService';
import { fetchRiderProfile, fetchUserProfile } from '../../redux/features/auth/authSlice';
import { connectRiderWebSocket } from '../../redux/features/rider/riderSlice';
import { fetchRecentDrops } from '../../redux/features/rides/ridesSlice';
import {
  reverseGeocodeLocation,
  loadRecentSearches,
  addRecentSearch,
} from '../../redux/features/location/locationSlice';
import { CustomAlertPopup } from '../../components/CustomAlertPopup';
import { isGuestMode } from '../../utils/storage';

export const RiderHomeScreen = ({ navigation }) => {
  // Hook 1
  const { t } = useTranslation();
  // Hook 2
  const { isSplitLayout, insets } = useResponsive();
  // Hook 3
  const dispatch = useDispatch();

  // Hook 4
  const { riderProfile, user: authUser } = useSelector((state) => state.auth);
  // Hook 5
  const {
    socketConnected,
    tripStatus,
    activeRideId,
    rideOtp,
    driverDetails,
    driverLocation,
    distanceRemainingKm,
    etaMin,
    activeRideData,
    completedTrip,
  } = useSelector((state) => state.rider);
  const reduxBooking = useSelector((state) => state.rides?.currentBooking);
  const { recentDrops = [] } = useSelector((state) => state.rides || {});
  // Hook 5b - Location state
  const { recentSearches = [], currentAddress, pickupLocation } = useSelector((state) => state.location);

  const hasActiveRiderTrip = Boolean(
    tripStatus !== 'completed' &&
    tripStatus !== 'cancelled' &&
    tripStatus !== 'idle' &&
    (
      tripStatus === 'searching' ||
      (activeRideId &&
        (tripStatus === 'driver_assigned' ||
         tripStatus === 'driver_arrived' ||
         tripStatus === 'in_progress'))
    )
  );

  // Hook 6 - User GPS coordinates [longitude, latitude]
  const [userLocation, setUserLocation] = useState([76.7834, 30.6948]);
  // Hook 7 - Location human-readable label
  const [locationLabel, setLocationLabel] = useState('Current Location');
  // Hook 7b - Referral code modal state
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralSuccessMsg, setReferralSuccessMsg] = useState('');
  // Hook 7c - Selected recent destination state
  const [selectedRecentDestination, setSelectedRecentDestination] = useState(null);

  // Guest detection & login prompt popup state
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

  const promptGuestLogin = (messageKey, defaultMessage) => {
    setGuestLoginModal({
      visible: true,
      title: t('auth.loginRequired', 'Login Required'),
      message: t(messageKey, defaultMessage),
    });
  };

  const handleApplyReferral = () => {
    if (!referralCodeInput.trim()) return;
    setReferralSuccessMsg('Referral code applied! You received $5.00 ride credit.');
    setTimeout(() => {
      setShowReferralModal(false);
      setReferralCodeInput('');
      setReferralSuccessMsg('');
    }, 1400);
  };

  // Fetch user profile from /api/v1/auth/profile/ and recent drops on mount
  useEffect(() => {
    isGuestMode().then((val) => {
      if (val) {
        setIsGuestStored(true);
      } else {
        dispatch(fetchUserProfile());
        dispatch(fetchRiderProfile());
      }
    });
    dispatch(fetchRecentDrops());
  }, [dispatch]);

  // Refresh rider profile and recent drops whenever screen gains focus
  useFocusEffect(
    useCallback(() => {
      isGuestMode().then((val) => {
        setIsGuestStored(Boolean(val));
        if (!val) {
          dispatch(fetchRiderProfile());
        }
      });
      dispatch(fetchRecentDrops());
      setSelectedRecentDestination(null);
    }, [dispatch])
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        dispatch(fetchUserProfile()).unwrap(),
        dispatch(fetchRiderProfile()).unwrap(),
        dispatch(fetchRecentDrops()).unwrap(),
      ]);
    } catch (_) {
      // Ignore errors on pull-to-refresh
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  // Load recent searches from AsyncStorage on mount
  useEffect(() => {
    dispatch(loadRecentSearches());
  }, [dispatch]);

  // Hook 8 - Connect to Rider WebSocket on mount
  useEffect(() => {
    dispatch(connectRiderWebSocket());
  }, [dispatch]);

  // Hook 9 - Fetch real GPS location on mount
  useEffect(() => {
    let watchId = null;

    const fetchGps = async () => {
      try {
        const loc = await getCurrentLocation();
        if (loc?.latitude && loc?.longitude) {
          setUserLocation([loc.longitude, loc.latitude]);
          try {
            const res = await dispatch(
              reverseGeocodeLocation({
                latitude: loc.latitude,
                longitude: loc.longitude,
              })
            ).unwrap();
            if (res?.display_name) {
              const short = res.display_name.split(',')[0].trim();
              setLocationLabel(short || res.display_name);
            }
          } catch (_) {
            setLocationLabel('Current Location');
          }
        }
      } catch (err) {
        console.warn('[RiderHome] Initial GPS failed:', err);
      }

      watchId = await watchLocation(
        (loc) => {
          if (loc?.latitude && loc?.longitude) {
            setUserLocation([loc.longitude, loc.latitude]);
          }
        },
        (err) => console.warn('[RiderHome] Location watch error:', err)
      );
    };

    fetchGps();

    return () => {
      if (watchId !== null) {
        clearLocationWatch(watchId);
      }
    };
  }, [dispatch]);

  // Hook 10 - Fetch rider profile (Home & Work saved places) on mount
  useEffect(() => {
    dispatch(fetchRiderProfile());
  }, [dispatch]);

  // Hook 10b - Navigate to TripCompleted when server marks trip as completed
  useEffect(() => {
    if (tripStatus === 'completed' && completedTrip) {
      const resolvedRideId = completedTrip.ride_id || activeRideId;
      navigation.navigate('TripCompleted', {
        driver: driverDetails || completedTrip.driver,
        totalFare: completedTrip.final_fare || 18.5,
        paymentStatus: completedTrip.payment_status || 'PAID',
        rideId: resolvedRideId,
        ride_id: resolvedRideId,
        tripDistance: '5.8 mi',
        tripDuration: '18 mins',
        destination:
          activeRideData?.destination_address ||
          activeRideData?.drop_address ||
          activeRideData?.drop ||
          locationLabel ||
          'Destination',
      });
    }
  }, [tripStatus, completedTrip, navigation, driverDetails, activeRideData, locationLabel, activeRideId]);

  // Hook 11 - Compute nearby dynamic drivers around current GPS location
  const nearbyDrivers = useMemo(() => {
    if (!userLocation) return [];
    const [lng, lat] = userLocation;
    const list = [];
    if (driverLocation?.lng && driverLocation?.lat && hasActiveRiderTrip) {
      list.unshift({
        id: 'assigned_driver',
        coordinate: [Number(driverLocation.lng), Number(driverLocation.lat)],
        heading: 90,
        eta: etaMin ? `${etaMin} min` : '1 min',
      });
    }
    return list;
  }, [userLocation, driverLocation, hasActiveRiderTrip, etaMin]);

  // Hook 12 - Recenter location handler
  const handleRecenterLocation = useCallback(async () => {
    try {
      const loc = await getCurrentLocation();
      if (loc?.latitude && loc?.longitude) {
        setUserLocation([loc.longitude, loc.latitude]);
        try {
          const res = await dispatch(
            reverseGeocodeLocation({
              latitude: loc.latitude,
              longitude: loc.longitude,
            })
          ).unwrap();
          if (res?.display_name) {
            const short = res.display_name.split(',')[0].trim();
            setLocationLabel(short || res.display_name);
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[RiderHome] Recenter error:', err);
    }
  }, [dispatch]);

  // Non-hook helper derivations (guarantees zero Hook Order changes on Fast Refresh)
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t('rider.goodMorning', 'Good morning')
      : hour < 17
      ? t('rider.goodAfternoon', 'Good afternoon')
      : t('rider.goodEvening', 'Good evening');

  const displayName = useMemo(() => {
    if (isGuest) return t('auth.guestUser', 'Guest');
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
    return t('auth.guestUser', 'Guest');
  }, [authUser, t, isGuest]);

  const effectiveRiderProfile = useMemo(() => {
    if (isGuest) return {};
    return riderProfile || authUser?.rider_profile || {};
  }, [riderProfile, authUser?.rider_profile, isGuest]);

  const riderHomeAddress = useMemo(() => {
    const addr = effectiveRiderProfile?.home_address || authUser?.rider_profile?.home_address;
    return typeof addr === 'string' && addr.trim().length > 0 ? addr.trim() : null;
  }, [effectiveRiderProfile?.home_address, authUser?.rider_profile?.home_address]);

  const riderWorkAddress = useMemo(() => {
    const addr = effectiveRiderProfile?.work_address || authUser?.rider_profile?.work_address;
    return typeof addr === 'string' && addr.trim().length > 0 ? addr.trim() : null;
  }, [effectiveRiderProfile?.work_address, authUser?.rider_profile?.work_address]);

  const combinedRecentLocations = useMemo(() => {
    const list = [];
    const seen = new Set();
    if (recentDrops && recentDrops.length > 0) {
      recentDrops.forEach((d, idx) => {
        if (!d || !d.address) return;
        const addr = String(d.address).trim().toLowerCase();
        if (seen.has(addr)) return;
        seen.add(addr);
        list.push({
          id: `recent_drop_${d.ride_id || idx}`,
          title: d.address.split(',')[0].trim() || 'Recent Drop',
          address: d.address,
          latitude: d.lat !== undefined && d.lat !== null ? Number(d.lat) : undefined,
          longitude: d.lon !== undefined && d.lon !== null ? Number(d.lon) : undefined,
          icon: 'clock',
        });
      });
    }
    if (recentSearches && recentSearches.length > 0) {
      recentSearches.forEach((item, idx) => {
        if (!item) return;
        const addr = (item.address || item.display_name || item.title || '').trim().toLowerCase();
        if (addr && seen.has(addr)) return;
        if (addr) seen.add(addr);
        list.push({
          id: item.id || `recent_${idx}`,
          title:
            item.title ||
            item.display_name?.split(',')[0] ||
            item.address?.split(',')[0] ||
            'Recent Place',
          address: item.address || item.display_name,
          latitude: item.latitude ?? item.lat,
          longitude: item.longitude ?? item.lon,
          icon: 'clock',
        });
      });
    }
    return list;
  }, [recentDrops, recentSearches]);

  const displayedSuggestions = useMemo(() => {
    return combinedRecentLocations.slice(0, 3);
  }, [combinedRecentLocations]);

  const latestDestination = useMemo(() => {
    if (combinedRecentLocations.length > 0) {
      const first = combinedRecentLocations[0];
      return {
        title: first.title,
        address: first.address,
        latitude: first.latitude ?? 30.7041,
        longitude: first.longitude ?? 76.7176,
      };
    }
    return {
      title: 'MAULI JAGRAN',
      address: 'Vikas Nagar, Chandigarh...',
      latitude: 30.7041,
      longitude: 76.7176,
    };
  }, [combinedRecentLocations]);

  // 1-Tap Destination Selection: jumps straight to RideOptions or DestinationSearch
  const handleSelectDestination = (loc, preferredVehicle = null) => {
    if (isGuest) {
      promptGuestLogin(
        'auth.loginRequiredDropoffMsg',
        'Please log in first to choose a drop-off location and book a ride.'
      );
      return;
    }
    dispatch(addRecentSearch(loc));
    const destAddress = loc.address || loc.display_name || loc.title;
    const destLat = loc.latitude ?? loc.lat;
    const destLon = loc.longitude ?? loc.lon;

    const pLat = userLocation[1];
    const pLon = userLocation[0];
    const pAddress =
      currentAddress?.display_name ||
      pickupLocation?.address ||
      locationLabel ||
      'Current Location';

    if (destLat && destLon) {
      navigation.navigate('RideOptions', {
        pickup: pAddress,
        pickupData: {
          address: pAddress,
          latitude: pLat,
          longitude: pLon,
        },
        destination: destAddress,
        destinationData: {
          title: loc.title || destAddress,
          address: destAddress,
          display_name: destAddress,
          latitude: Number(destLat),
          longitude: Number(destLon),
        },
        pickup_lat: pLat,
        pickup_lon: pLon,
        drop_lat: Number(destLat),
        drop_lon: Number(destLon),
        preferredVehicle,
      });
    } else {
      navigation.navigate('DestinationSearch', {
        destination: destAddress,
        initialDestination: destAddress,
        preferredVehicle,
      });
    }
  };

  const handleContinueRecentDestination = () => {
    if (!selectedRecentDestination) return;
    if (isGuest) {
      promptGuestLogin(
        'auth.loginRequiredDropoffMsg',
        'Please log in first to choose a drop-off location and book a ride.'
      );
      return;
    }
    handleSelectDestination(selectedRecentDestination);
  };

  // Navigate back to ongoing screen/state when clicking Active Ride Card/Banner
  const handleResumeRiderRide = useCallback(() => {
    const booking = reduxBooking || {};
    const bookingData = booking?.data || booking?.ride || booking;
    const activeData = activeRideData || {};

    const pAddr =
      bookingData?.pickup_address ||
      bookingData?.pickup?.address ||
      bookingData?.pickup?.display_name ||
      activeData?.pickup?.address ||
      activeData?.pickup?.display_name ||
      (typeof bookingData?.pickup === 'string' ? bookingData.pickup : null) ||
      (typeof activeData?.pickup === 'string' ? activeData.pickup : null) ||
      pickupLocation?.address ||
      pickupLocation?.display_name ||
      currentAddress?.display_name ||
      locationLabel ||
      'Pickup Location';

    const dAddr =
      bookingData?.drop_address ||
      bookingData?.destination_address ||
      bookingData?.drop?.address ||
      bookingData?.drop?.display_name ||
      activeData?.drop?.address ||
      activeData?.drop?.display_name ||
      (typeof bookingData?.drop === 'string' ? bookingData.drop : null) ||
      (typeof activeData?.drop === 'string' ? activeData.drop : null) ||
      'Destination';

    const pLat =
      bookingData?.pickup_lat ??
      bookingData?.pickup?.lat ??
      activeData?.pickup?.lat ??
      pickupLocation?.latitude ??
      userLocation[1];
    const pLon =
      bookingData?.pickup_lon ??
      bookingData?.pickup?.lng ??
      bookingData?.pickup?.lon ??
      activeData?.pickup?.lng ??
      activeData?.pickup?.lon ??
      pickupLocation?.longitude ??
      userLocation[0];
    const dLat =
      bookingData?.drop_lat ??
      bookingData?.drop?.lat ??
      activeData?.drop?.lat;
    const dLon =
      bookingData?.drop_lon ??
      bookingData?.drop?.lng ??
      bookingData?.drop?.lon ??
      activeData?.drop?.lng ??
      activeData?.drop?.lon;

    const totalFare =
      bookingData?.fare ??
      bookingData?.total_fare ??
      bookingData?.driver_payout ??
      activeData?.fare ??
      activeData?.driver_payout ??
      booking?.fare ??
      18.5;

    const effectiveOtp =
      rideOtp ||
      bookingData?.otp ||
      activeData?.otp ||
      booking?.otp;
    const effectiveRideId =
      activeRideId ||
      bookingData?.ride_id ||
      bookingData?.id ||
      activeData?.ride_id ||
      activeData?.id;

    const navParams = {
      ride_id: effectiveRideId,
      rideId: effectiveRideId,
      tripId: effectiveRideId,
      pickup: pAddr,
      destination: dAddr,
      totalFare,
      otp: effectiveOtp,
      driver: driverDetails,
      pickup_lat: pLat,
      pickup_lon: pLon,
      drop_lat: dLat,
      drop_lon: dLon,
      pickupCoordinates:
        pLon && pLat ? [Number(pLon), Number(pLat)] : userLocation,
      dropCoordinates: dLon && dLat ? [Number(dLon), Number(dLat)] : undefined,
      booking,
    };

    if (tripStatus === 'searching') {
      navigation.navigate('SearchingDriver', navParams);
    } else if (tripStatus === 'in_progress') {
      navigation.navigate('RideInProgress', navParams);
    } else {
      // driver_assigned or driver_arrived
      navigation.navigate('DriverAssigned', navParams);
    }
  }, [
    tripStatus,
    activeRideId,
    rideOtp,
    driverDetails,
    activeRideData,
    reduxBooking,
    pickupLocation,
    currentAddress,
    locationLabel,
    userLocation,
    navigation,
  ]);

  const searchControls = (
    <View style={[styles.bottomCard, isSplitLayout && styles.sideCard]}>
  

      {/* Active Trip Banner / Card (Visible when Rider backed out to HomeScreen with active ride) */}
    


      {/* 1. Promotional Moto Taxi Hero Banner */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => {
          if (isGuest) {
            promptGuestLogin(
              'auth.loginRequiredDropoffMsg',
              'Please log in first to choose a drop-off location and book a ride.'
            );
            return;
          }
          navigation.navigate('DestinationSearch');
        }}
        style={styles.bannerCard}
      >
        <Image
          source={require('../../assets/images/moto_taxi_banner.png')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

        {hasActiveRiderTrip && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleResumeRiderRide}
          style={styles.activeRideCard}
        >
          {/* Card Top: Stage Tag + Live Pulse + OTP */}
          <View style={styles.activeRideHeaderRow}>
            <View
              style={[
                styles.activeRideStageTag,
                tripStatus === 'searching'
                  ? styles.stageSearchingTag
                  : tripStatus === 'driver_arrived'
                  ? styles.stageRiderArrivedTag
                  : tripStatus === 'in_progress'
                  ? styles.stageRiderTripTag
                  : styles.stageAssignedTag,
              ]}
            >
              <View
                style={[
                  styles.activeRideLiveDot,
                  tripStatus === 'searching'
                    ? { backgroundColor: '#F59E0B' }
                    : tripStatus === 'driver_arrived'
                    ? { backgroundColor: '#10B981' }
                    : tripStatus === 'in_progress'
                    ? { backgroundColor: '#3B82F6' }
                    : { backgroundColor: '#EAB308' },
                ]}
              />
              <Text
                style={[
                  styles.activeRideStageText,
                  tripStatus === 'searching'
                    ? { color: '#B45309' }
                    : tripStatus === 'driver_arrived'
                    ? { color: '#047857' }
                    : tripStatus === 'in_progress'
                    ? { color: '#1D4ED8' }
                    : { color: '#854D0E' },
                ]}
              >
                {tripStatus === 'searching'
                  ? 'SEARCHING DRIVER'
                  : tripStatus === 'driver_arrived'
                  ? 'DRIVER ARRIVED'
                  : tripStatus === 'in_progress'
                  ? 'TRIP IN PROGRESS'
                  : 'DRIVER ON THE WAY'}
              </Text>
            </View>

            {rideOtp ? (
              <View style={styles.activeRideOtpBadge}>
                <Text style={styles.activeRideOtpLabel}>PIN:</Text>
                <Text style={styles.activeRideOtpValue}>{rideOtp}</Text>
              </View>
            ) : null}
          </View>

          {/* Driver or Searching Info Row */}
          {tripStatus === 'searching' ? (
            <View style={styles.activeRideSearchingRow}>
              <View style={styles.activeRideSearchingIconBox}>
                <Icon name="search" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.activeRideSearchingTextCol}>
                <Text style={styles.activeRideSearchingTitle}>
                  Finding nearest driver...
                </Text>
                <Text style={styles.activeRideSearchingSub}>
                  Ride #{activeRideId || 'Pending'} • Hang tight
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.activeRideDriverRow}>
              <View style={styles.activeRideDriverAvatar}>
                <Icon name="user" size={18} color={COLORS.primaryDark} />
              </View>
              <View style={styles.activeRideDriverCol}>
                <Text style={styles.activeRideDriverName} numberOfLines={1}>
                  {driverDetails?.name || 'Assigned Driver'}
                </Text>
                <Text style={styles.activeRideVehicleDetails}>
                  {driverDetails?.vehicle || 'Car'}
                  {driverDetails?.vehicle_plate ? ` • ${driverDetails.vehicle_plate}` : ''}
                </Text>
              </View>
              <View style={styles.activeRideEtaCol}>
                <Text style={styles.activeRideEtaValue}>
                  {tripStatus === 'driver_arrived'
                    ? 'At Pickup'
                    : etaMin !== null && etaMin !== undefined
                    ? `${etaMin} min`
                    : distanceRemainingKm !== null && distanceRemainingKm !== undefined
                    ? `${distanceRemainingKm} km`
                    : 'Nearby'}
                </Text>
                <Text style={styles.activeRideEtaLabel}>
                  {tripStatus === 'driver_arrived' ? 'Ready' : 'ETA'}
                </Text>
              </View>
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleResumeRiderRide}
            style={[
              styles.activeRideResumeBtn,
              tripStatus === 'searching'
                ? { backgroundColor: COLORS.primary }
                : tripStatus === 'driver_arrived'
                ? { backgroundColor: '#10B981' }
                : tripStatus === 'in_progress'
                ? { backgroundColor: '#2563EB' }
                : { backgroundColor: COLORS.primary },
            ]}
          >
            <Text style={styles.activeRideResumeBtnText}>
              {tripStatus === 'searching'
                ? 'Return to Searching Screen ›'
                : tripStatus === 'driver_arrived'
                ? 'Meet Driver & View PIN ›'
                : tripStatus === 'in_progress'
                ? 'Return to Live Trip Map ›'
                : 'Track Driver Location ›'}
            </Text>
            <Icon name="arrow-right" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* 2. "Where would you like to go?" Teal CTA Button */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => {
          if (isGuest) {
            promptGuestLogin(
              'auth.loginRequiredDropoffMsg',
              'Please log in first to choose a drop-off location and book a ride.'
            );
            return;
          }
          navigation.navigate('DestinationSearch');
        }}
        style={styles.whereToGoBtn}
      >
        <Text style={styles.whereToGoText}>
          {t('rider.whereWouldYouLikeToGo', 'Where would you like to go?')}
        </Text>
        <Icon name="arrow-forward" size={20} color={COLORS.white} />
      </TouchableOpacity>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.addPlacesScrollView, isSplitLayout && styles.addPlacesScrollViewTablet]}
        contentContainerStyle={[styles.addPlacesRow, isSplitLayout && styles.addPlacesRowTablet]}
      >
        {/* Home Pill */}
        {riderHomeAddress ? (
          <View style={[styles.savedPlacePill, isSplitLayout && styles.savedPlacePillTablet]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (isGuest) {
                  promptGuestLogin(
                    'auth.loginRequiredHomeMsg',
                    'Please log in first to set and manage your home address.'
                  );
                  return;
                }
                handleSelectDestination({
                  title: 'Home',
                  address: riderHomeAddress,
                  latitude:
                    effectiveRiderProfile?.home_lat ?? authUser?.rider_profile?.home_lat,
                  longitude:
                    effectiveRiderProfile?.home_lng ??
                    effectiveRiderProfile?.home_lon ??
                    authUser?.rider_profile?.home_lng ??
                    authUser?.rider_profile?.home_lon,
                });
              }}
              style={[styles.savedPlaceMain, isSplitLayout && styles.savedPlaceMainTablet]}
            >
              <Icon name="home" size={isSplitLayout ? 18 : 20} color={COLORS.primary} />
              <Text style={[styles.addPlacePillText, isSplitLayout && styles.addPlacePillTextTablet]}>
                {t('rider.home', 'Home')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                if (isGuest) {
                  promptGuestLogin(
                    'auth.loginRequiredHomeMsg',
                    'Please log in first to set and manage your home address.'
                  );
                  return;
                }
                navigation.navigate('SavedPlaces', { initialFocus: 'home' });
              }}
              style={[styles.savedPlaceEditBtn, isSplitLayout && styles.savedPlaceEditBtnTablet]}
            >
              <Icon name="pencil" size={isSplitLayout ? 13 : 15} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (isGuest) {
                promptGuestLogin(
                  'auth.loginRequiredHomeMsg',
                  'Please log in first to set and manage your home address.'
                );
                return;
              }
              navigation.navigate('SavedPlaces', { initialFocus: 'home' });
            }}
            style={[styles.addPlacePill, isSplitLayout && styles.addPlacePillTablet]}
          >
            <Icon name="plus-circle" size={isSplitLayout ? 20 : 25} color={COLORS.primary} />
            <Text style={[styles.addPlacePillText, isSplitLayout && styles.addPlacePillTextTablet]}>
              {t('rider.addHome', 'Add Home')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Work Pill */}
        {riderWorkAddress ? (
          <View style={[styles.savedPlacePill, isSplitLayout && styles.savedPlacePillTablet]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (isGuest) {
                  promptGuestLogin(
                    'auth.loginRequiredWorkMsg',
                    'Please log in first to set and manage your work address.'
                  );
                  return;
                }
                handleSelectDestination({
                  title: 'Work',
                  address: riderWorkAddress,
                  latitude:
                    effectiveRiderProfile?.work_lat ?? authUser?.rider_profile?.work_lat,
                  longitude:
                    effectiveRiderProfile?.work_lng ??
                    effectiveRiderProfile?.work_lon ??
                    authUser?.rider_profile?.work_lng ??
                    authUser?.rider_profile?.work_lon,
                });
              }}
              style={[styles.savedPlaceMain, isSplitLayout && styles.savedPlaceMainTablet]}
            >
              <Icon name="briefcase" size={isSplitLayout ? 18 : 20} color={COLORS.primary} />
              <Text style={[styles.addPlacePillText, isSplitLayout && styles.addPlacePillTextTablet]}>
                {t('rider.work', 'Work')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => {
                if (isGuest) {
                  promptGuestLogin(
                    'auth.loginRequiredWorkMsg',
                    'Please log in first to set and manage your work address.'
                  );
                  return;
                }
                navigation.navigate('SavedPlaces', { initialFocus: 'work' });
              }}
              style={[styles.savedPlaceEditBtn, isSplitLayout && styles.savedPlaceEditBtnTablet]}
            >
              <Icon name="pencil" size={isSplitLayout ? 13 : 15} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (isGuest) {
                promptGuestLogin(
                  'auth.loginRequiredWorkMsg',
                  'Please log in first to set and manage your work address.'
                );
                return;
              }
              navigation.navigate('SavedPlaces', { initialFocus: 'work' });
            }}
            style={[styles.addPlacePill, isSplitLayout && styles.addPlacePillTablet]}
          >
            <Icon name="plus-circle" size={isSplitLayout ? 20 : 25} color={COLORS.primary} />
            <Text style={[styles.addPlacePillText, isSplitLayout && styles.addPlacePillTextTablet]}>
              {t('rider.addWork', 'Add Work')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* 5. Recent Drops / Destinations List */}
      {combinedRecentLocations && combinedRecentLocations.length > 0 && (
        <View style={styles.recentDropsContainer}>
          <View style={styles.recentDropsHeaderRow}>
            <View style={styles.recentDropsHeaderLeft}>
              <Icon name="time" size={15} color={COLORS.primary} />
              <Text style={styles.recentDropsHeaderTitle}>
                {t('rider.recentDestinations', 'Recent Destinations')}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (isGuest) {
                  promptGuestLogin(
                    'auth.loginRequiredDropoffMsg',
                    'Please log in first to choose a drop-off location and book a ride.'
                  );
                  return;
                }
                navigation.navigate('DestinationSearch');
              }}
              style={styles.recentDropsSeeAllBtn}
            >
              <Text style={styles.recentDropsSeeAllText}>
                {t('common.seeAll', 'See all')}
              </Text>
              <Icon name="arrow-right" size={12} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.recentDropsCard}>
            {combinedRecentLocations.slice(0, 4).map((loc, idx) => {
              const isLast = idx === Math.min(combinedRecentLocations.length, 4) - 1;
              const displayTitle = loc.title || loc.address?.split(',')[0]?.trim() || 'Recent Place';
              const displayAddress = loc.address || loc.title || '';
              const isSelected = selectedRecentDestination?.id === loc.id;

              return (
                <TouchableOpacity
                  key={loc.id || `drop_${idx}`}
                  activeOpacity={0.75}
                  onPress={() => {
                    setSelectedRecentDestination((prev) =>
                      prev?.id === loc.id ? null : loc
                    );
                  }}
                  style={[
                    styles.recentDropItemRow,
                    isLast && styles.recentDropItemRowLast,
                    isSelected && styles.recentDropItemRowSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.recentDropIconBox,
                      isSelected && styles.recentDropIconBoxSelected,
                    ]}
                  >
                    <Icon
                      name="time"
                      size={16}
                      color={isSelected ? COLORS.white : COLORS.primary}
                    />
                  </View>

                  <View style={styles.recentDropTextCol}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.recentDropTitle,
                        isSelected && styles.recentDropTitleSelected,
                      ]}
                    >
                      {displayTitle}
                    </Text>
                    <Text numberOfLines={1} style={styles.recentDropSubtitle}>
                      {displayAddress}
                    </Text>
                  </View>

                  <View style={styles.recentDropActionBox}>
                    {isSelected ? (
                      <Icon name="check-circle" size={20} color={COLORS.primary} />
                    ) : (
                      <View style={styles.recentDropRadioUnselected} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Continue Button for Selected Recent Destination */}
          {selectedRecentDestination && (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleContinueRecentDestination}
              style={styles.recentContinueBtn}
            >
              <Text style={styles.recentContinueBtnText}>
                {t('common.continue', 'Continue')}
              </Text>
              <Icon name="arrow-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const mapPane = (
    <View style={styles.mapArea}>
      <RiderLiveMap
        userCoordinate={userLocation}
        nearbyDrivers={nearbyDrivers}
        pickupLabel={locationLabel}
        onRecenter={handleRecenterLocation}
      />

      {/* Floating Referral Code Pill (Top-Right of Map) */}
      

      {/* Floating Active Trip Bar on Map */}
      {hasActiveRiderTrip && (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleResumeRiderRide}
          style={[
            styles.floatingRiderActiveBanner,
            { bottom: isSplitLayout ? 24 : 16 },
          ]}
        >
          <View
            style={[
              styles.floatingRiderActiveDot,
              tripStatus === 'searching'
                ? { backgroundColor: '#F59E0B' }
                : tripStatus === 'driver_arrived'
                ? { backgroundColor: '#10B981' }
                : tripStatus === 'in_progress'
                ? { backgroundColor: '#3B82F6' }
                : { backgroundColor: '#EAB308' },
            ]}
          />
          <View style={styles.floatingRiderActiveTextCol}>
            <Text style={styles.floatingRiderActiveTitle}>
              {tripStatus === 'searching'
                ? '🔍 Searching for Driver...'
                : tripStatus === 'driver_arrived'
                ? '🟢 Driver Arrived at Pickup'
                : tripStatus === 'in_progress'
                ? '🚀 Trip in Progress'
                : '🟡 Driver on the Way'}
            </Text>
            <Text style={styles.floatingRiderActiveSub}>
              Tap to return to active ride screen ›
            </Text>
          </View>
          <Icon name="chevron-right" size={18} color={COLORS.text} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <AdaptiveSplitView
        primaryPane={mapPane}
        secondaryPane={
          isSplitLayout ? (
            <ScrollView
              contentContainerStyle={styles.splitSecondaryScroll}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.primary}
                  colors={[COLORS.primary]}
                />
              }
            >
              {searchControls}
            </ScrollView>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollableBottomPane}
              showsVerticalScrollIndicator={false}
              bounces={true}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.primary}
                  colors={[COLORS.primary]}
                />
              }
            >
              {searchControls}
            </ScrollView>
          )
        }
        primaryRatio={0.48}
        secondaryStyle={styles.bottomSheetSecondary}
      />

      {/* Referral Code Modal */}
      <Modal
        visible={showReferralModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReferralModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowReferralModal(false)}
        >
          <Pressable style={styles.referralModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.referralModalHeader}>
              <View style={styles.referralIconCircle}>
                <Icon name="megaphone" size={24} color={COLORS.primary} />
              </View>
              <TouchableOpacity
                onPress={() => setShowReferralModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="close" size={18} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={styles.referralModalTitle}>
              {t('rider.referralTitle', 'Got a Referral Code?')}
            </Text>
            <Text style={styles.referralModalSub}>
              {t(
                'rider.referralSubtitle',
                'Enter an invite or promo voucher code to unlock bonus ride credits and discounts.'
              )}
            </Text>

            <View style={styles.referralInputWrapper}>
              <Icon name="gift" size={18} color={COLORS.primary} />
              <TextInput
                value={referralCodeInput}
                onChangeText={(text) => {
                  setReferralCodeInput(text.toUpperCase());
                  setReferralSuccessMsg('');
                }}
                placeholder="e.g. MOTO50, RIDEFREE"
                placeholderTextColor={COLORS.textLight}
                autoCapitalize="characters"
                style={styles.referralTextInput}
              />
              {referralCodeInput ? (
                <TouchableOpacity onPress={() => setReferralCodeInput('')}>
                  <Icon name="close" size={14} color={COLORS.textLight} />
                </TouchableOpacity>
              ) : null}
            </View>

            {referralSuccessMsg ? (
              <View style={styles.referralSuccessBanner}>
                <Icon name="check-circle" size={16} color={COLORS.primary} />
                <Text style={styles.referralSuccessText}>{referralSuccessMsg}</Text>
              </View>
            ) : null}

            <View style={styles.referralBtnRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleApplyReferral}
                style={[
                  styles.referralApplyBtn,
                  !referralCodeInput.trim() && styles.referralApplyBtnDisabled,
                ]}
                disabled={!referralCodeInput.trim()}
              >
                <Text style={styles.referralApplyBtnText}>
                  {t('common.apply', 'Apply Code')}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Guest Mode Login Required Alert Popup */}
      <CustomAlertPopup
        visible={guestLoginModal.visible}
        type="warning"
        title={guestLoginModal.title || t('auth.loginRequired', 'Login Required')}
        message={guestLoginModal.message}
        confirmText={t('auth.login', 'Log In / Sign In')}
        cancelText={t('common.cancel', 'Cancel')}
        onConfirm={() => {
          setGuestLoginModal({ visible: false, title: '', message: '' });
          navigation.navigate('Login');
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
    backgroundColor: COLORS.white,
  },
  sideCard: {
    backgroundColor: COLORS.white,
    height: '100%',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderLeftWidth: 1,
    borderColor: COLORS.border,
  },
  splitSecondaryScroll: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
  },
  scrollableBottomPane: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
  },
  topHeader: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.extraLarge,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  greetingCol: {
    marginLeft: SPACING.sm,
  },
  greetingText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    color: COLORS.textLight,
  },
  userName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    borderWidth: 1,
  },
  roleBadgeConnected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  roleBadgeConnecting: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  socketDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  roleBadgeText: {
    fontSize: responsiveFont(10),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mapArea: {
    flex: 1,
  },
  bottomCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: SPACING.sm,
  },
  pickupBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.sm,
  },
  pickupTextCol: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  pickupPrompt: {
    fontSize: responsiveFont(10),
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pickupLocationText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
  },
  changePickupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    gap: 3,
  },
  changePickupText: {
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: COLORS.primary,
  },
  searchBar: {
    height: 52,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  searchPlaceholder: {
    ...TYPOGRAPHY.title,
    fontSize: responsiveFont(16),
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 4,
    fontSize: responsiveFont(11),
  },
  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: 8,
  },
  serviceCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.large,
    paddingVertical: SPACING.sm,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceTitle: {
    fontSize: responsiveFont(12),
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  serviceTagBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
  },
  serviceTagText: {
    fontSize: responsiveFont(9),
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs + 2,
  },
  sectionHeaderTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionHeaderSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    color: COLORS.textLight,
  },
  sectionHeaderLink: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: responsiveFont(12),
  },
  savedPlacesRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  placePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.large,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: 180,
  },
  placePillConfigured: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  placeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  placeTextCol: {
    flex: 1,
  },
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeTitle: {
    fontSize: responsiveFont(12),
    fontWeight: '700',
    color: COLORS.text,
  },
  placeAddress: {
    fontSize: responsiveFont(10),
    color: COLORS.textLight,
    marginTop: 1,
  },
  managePlacesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.large,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: 6,
  },
  addIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  managePlacesText: {
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: COLORS.primary,
  },
  suggestionsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.large,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  suggestionTextCol: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  suggestionTitle: {
    fontSize: responsiveFont(13),
    fontWeight: '700',
    color: COLORS.text,
  },
  suggestionAddress: {
    fontSize: responsiveFont(11),
    color: COLORS.textLight,
    marginTop: 1,
  },
  promoBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  promoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  promoTextCol: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  promoTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  promoTag: {
    fontSize: responsiveFont(9),
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  promoCodeBadge: {
    fontSize: responsiveFont(9),
    fontWeight: '800',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
  },
  promoTitle: {
    fontSize: responsiveFont(13),
    fontWeight: '700',
    color: '#92400E',
  },
  promoSubtitle: {
    fontSize: responsiveFont(11),
    color: '#B45309',
    marginTop: 1,
  },

  // Active Ride Banner & Card Styles
  floatingRiderActiveBanner: {
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
  floatingRiderActiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  floatingRiderActiveTextCol: {
    flex: 1,
  },
  floatingRiderActiveTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.text,
  },
  floatingRiderActiveSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontWeight: '600',
    marginTop: 1,
    fontSize: responsiveFont(11),
  },
  activeRideCard: {
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
    marginHorizontal:10
  },
  activeRideHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  activeRideStageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
  },
  stageSearchingTag: {
    backgroundColor: '#FEF3C7',
  },
  stageAssignedTag: {
    backgroundColor: '#FEF9C3',
  },
  stageRiderArrivedTag: {
    backgroundColor: '#D1FAE5',
  },
  stageRiderTripTag: {
    backgroundColor: '#DBEAFE',
  },
  activeRideLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  activeRideStageText: {
    fontSize: responsiveFont(11),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeRideOtpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.small,
    gap: 4,
  },
  activeRideOtpLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
    fontSize: responsiveFont(11),
  },
  activeRideOtpValue: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 1.5,
  },
  activeRideSearchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
  },
  activeRideSearchingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  activeRideSearchingTextCol: {
    flex: 1,
  },
  activeRideSearchingTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  activeRideSearchingSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  activeRideDriverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
  },
  activeRideDriverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  activeRideDriverCol: {
    flex: 1,
  },
  activeRideDriverName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  activeRideVehicleDetails: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  activeRideEtaCol: {
    alignItems: 'flex-end',
  },
  activeRideEtaValue: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  activeRideEtaLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  activeRideResumeBtn: {
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
  activeRideResumeBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  bottomSheetSecondary: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.white,
    marginTop: -16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  bannerCard: {
    marginHorizontal: SPACING.md,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E6F9F5',
    borderWidth: 1,
    borderColor: '#E2F4EE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  bannerImage: {
    width: '100%',
    height: 130,
    borderRadius: 16,
  },
  whereToGoBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.md,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  whereToGoText: {
    color: COLORS.white,
    fontSize: responsiveFont(18),
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  recentDestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: SPACING.md,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  recentDestTextCol: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  recentDestTitle: {
    fontSize: responsiveFont(14),
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  recentDestSubtitle: {
    fontSize: responsiveFont(12),
    color: '#6B7280',
    fontWeight: '400',
  },
  recentDestArrowBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentDropsContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: 8,
    marginBottom: 14,
  },
  recentDropsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  recentDropsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentDropsHeaderTitle: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(13),
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  recentDropsSeeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  recentDropsSeeAllText: {
    fontSize: responsiveFont(12),
    fontWeight: '600',
    color: COLORS.primary,
  },
  recentDropsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  recentDropItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recentDropItemRowLast: {
    borderBottomWidth: 0,
  },
  recentDropItemRowSelected: {
    backgroundColor: '#F0FDFA',
  },
  recentDropIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentDropIconBoxSelected: {
    backgroundColor: COLORS.primary,
  },
  recentDropTextCol: {
    flex: 1,
    marginRight: 8,
  },
  recentDropTitle: {
    ...TYPOGRAPHY.body,
    fontSize: responsiveFont(14),
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  recentDropTitleSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  recentDropSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(12),
    color: '#6B7280',
    fontWeight: '400',
  },
  recentDropActionBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentDropRadioUnselected: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  recentContinueBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  recentContinueBtnText: {
    color: COLORS.white,
    fontSize: responsiveFont(15),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  addPlacesScrollView: {
    flexGrow: 0,
  },
  addPlacesScrollViewTablet: {
    flexGrow: 0,
    maxHeight: 56,
    marginBottom: SPACING.sm,
  },
  addPlacesRow: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 8,
    gap: 10,
    alignItems: 'center',
  },
  addPlacesRowTablet: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 0,
    gap: 12,
    alignItems: 'center',
    maxHeight: 56,
  },
  addPlacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  addPlacePillTablet: {
    height: 48,
    maxHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 0,
    minWidth: 135,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#E5E7EB',
    backgroundColor: COLORS.white,
  },
  savedPlacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  savedPlacePillTablet: {
    height: 48,
    maxHeight: 52,
    borderRadius: 16,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 0,
    minWidth: 135,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: '#E5E7EB',
    backgroundColor: COLORS.white,
  },
  savedPlaceMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  savedPlaceMainTablet: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    height: '100%',
  },
  savedPlaceEditBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  savedPlaceEditBtnTablet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  addPlacePillText: {
    fontSize: responsiveFont(18),
    fontWeight: '600',
    color: '#111827',
    marginLeft: 7,
  },
  addPlacePillTextTablet: {
    fontSize: responsiveFont(15),
    fontWeight: '600',
    color: '#111827',
    marginLeft: 6,
  },
  floatingReferralBtn: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 6,
    zIndex: 10,
  },
  floatingReferralText: {
    fontSize: responsiveFont(13),
    fontWeight: '600',
    color: '#111827',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  referralModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    padding: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
  },
  referralModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  referralIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralModalTitle: {
    ...TYPOGRAPHY.heading2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  referralModalSub: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
    lineHeight: 18,
  },
  referralInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 48,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  referralTextInput: {
    flex: 1,
    fontSize: responsiveFont(15),
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.8,
  },
  referralSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: SPACING.sm,
    borderRadius: RADIUS.small,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  referralSuccessText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontWeight: '700',
    flex: 1,
  },
  referralBtnRow: {
    marginTop: SPACING.xs,
  },
  referralApplyBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralApplyBtnDisabled: {
    backgroundColor: COLORS.disabled,
  },
  referralApplyBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
    fontWeight: '700',
  },
});

export default RiderHomeScreen;
