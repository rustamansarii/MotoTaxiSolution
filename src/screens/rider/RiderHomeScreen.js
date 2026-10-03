import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import { RiderLiveMap } from '../../components/navigation';
import ProfileAvatar from '../../components/ProfileAvatar';
import Icon from '../../components/Icon';
import { useResponsive } from '../../utils/responsive';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useTranslation } from 'react-i18next';
import {
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
} from '../../utils/locationService';
import { fetchRiderProfile, fetchUserProfile } from '../../redux/features/auth/authSlice';
import { connectRiderWebSocket } from '../../redux/features/rider/riderSlice';
import {
  reverseGeocodeLocation,
  loadRecentSearches,
  addRecentSearch,
} from '../../redux/features/location/locationSlice';

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

  // Fetch user profile from /api/v1/auth/profile/ on mount
  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchRiderProfile());
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
      navigation.navigate('TripCompleted', {
        driver: driverDetails,
        totalFare: completedTrip.final_fare || 18.5,
        paymentStatus: completedTrip.payment_status || 'PAID',
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
  }, [tripStatus, completedTrip, navigation, driverDetails, activeRideData, locationLabel]);

  // Hook 11 - Compute nearby dynamic drivers around current GPS location
  const nearbyDrivers = useMemo(() => {
    if (!userLocation) return [];
    const [lng, lat] = userLocation;
    const list = [
      { id: 'd1', coordinate: [lng + 0.0032, lat + 0.0018], heading: 45, eta: '2 min' },
      { id: 'd2', coordinate: [lng - 0.0028, lat + 0.0035], heading: 135, eta: '4 min' },
      { id: 'd3', coordinate: [lng + 0.0021, lat - 0.0031], heading: 220, eta: '5 min' },
    ];
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
    return 'Rider';
  }, [authUser]);

  const displayedSuggestions =
    recentSearches && recentSearches.length > 0
      ? recentSearches.slice(0, 3).map((item, idx) => ({
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
        }))
      : [];

  // 1-Tap Destination Selection: jumps straight to RideOptions or DestinationSearch
  const handleSelectDestination = (loc, preferredVehicle = null) => {
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
      {/* Bottom Sheet Handle Bar */}
      <View style={styles.sheetHandleBar} />

      {/* Active Trip Banner / Card (Visible when Rider backed out to HomeScreen with active ride) */}
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


      {/* Primary Search Bar Trigger ("Where to?") */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('DestinationSearch')}
        style={styles.searchBar}
      >
        <View style={styles.searchIconBox}>
          <Icon name="search" size={18} color={COLORS.white} />
        </View>
        <Text style={styles.searchPlaceholder}>
          {t('rider.whereTo', 'Where to?')}
        </Text>
        <View style={styles.timeBadge}>
          <Icon name="clock" size={13} color={COLORS.text} />
          <Text style={styles.timeText}>{t('rider.now', 'Now')} ⌄</Text>
        </View>
      </TouchableOpacity>

      {/* Saved Places Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>{t('rider.savedPlaces', 'Saved Places')}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('SavedPlaces', { initialFocus: 'home' })}
        >
          <Text style={styles.sectionHeaderLink}>{t('common.manage', 'Manage')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.savedPlacesRow}
      >
        {/* Home Place Card */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            if (riderProfile?.home_address) {
              handleSelectDestination({
                title: 'Home',
                address: riderProfile.home_address,
                latitude: riderProfile.home_lat,
                longitude: riderProfile.home_lon,
              });
            } else {
              navigation.navigate('SavedPlaces', { initialFocus: 'home' });
            }
          }}
          style={[
            styles.placePill,
            riderProfile?.home_address ? styles.placePillConfigured : null,
          ]}
        >
          <View style={[styles.placeIconCircle, { backgroundColor: COLORS.primaryLight }]}>
            <Icon name="home" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.placeTextCol}>
            <View style={styles.placeTitleRow}>
              <Text style={styles.placeTitle}>{t('rider.home', 'Home')}</Text>
              {riderProfile?.home_address && (
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() =>
                    navigation.navigate('SavedPlaces', { initialFocus: 'home' })
                  }
                >
                  <Icon name="pencil" size={11} color={COLORS.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
            </View>
            <Text numberOfLines={1} style={styles.placeAddress}>
              {riderProfile?.home_address || `+ ${t('rider.addHome', 'Add Home')}`}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Work / Office Place Card */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            if (riderProfile?.work_address) {
              handleSelectDestination({
                title: 'Work',
                address: riderProfile.work_address,
                latitude: riderProfile.work_lat,
                longitude: riderProfile.work_lon,
              });
            } else {
              navigation.navigate('SavedPlaces', { initialFocus: 'work' });
            }
          }}
          style={[
            styles.placePill,
            riderProfile?.work_address ? styles.placePillConfigured : null,
          ]}
        >
          <View style={[styles.placeIconCircle, { backgroundColor: COLORS.secondPrimaryLight }]}>
            <Icon name="briefcase" size={16} color={COLORS.secondPrimary} />
          </View>
          <View style={styles.placeTextCol}>
            <View style={styles.placeTitleRow}>
              <Text style={styles.placeTitle}>{t('rider.work', 'Work')}</Text>
              {riderProfile?.work_address && (
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() =>
                    navigation.navigate('SavedPlaces', { initialFocus: 'work' })
                  }
                >
                  <Icon name="pencil" size={11} color={COLORS.secondPrimary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
            </View>
            <Text numberOfLines={1} style={styles.placeAddress}>
              {riderProfile?.work_address || `+ ${t('rider.addWork', 'Add Work')}`}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Add More Place Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('SavedPlaces', { initialFocus: 'home' })}
          style={styles.managePlacesPill}
        >
          <View style={styles.addIconCircle}>
            <Icon name="plus" size={14} color={COLORS.primary} />
          </View>
          <Text style={styles.managePlacesText}>{t('rider.addPlace', 'Add Place')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Quick Suggestions / Recent Places List */}
      {displayedSuggestions.length > 0 ? (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>
              {t('rider.recentPlaces', 'Recent Destinations')}
            </Text>
            <Text style={styles.sectionHeaderSubtitle}>1-tap ride</Text>
          </View>

          <View style={styles.suggestionsContainer}>
            {displayedSuggestions.map((item, index) => (
              <TouchableOpacity
                key={item.id || index}
                activeOpacity={0.7}
                onPress={() => handleSelectDestination(item)}
                style={[
                  styles.suggestionItem,
                  index === displayedSuggestions.length - 1 && styles.suggestionItemLast,
                ]}
              >
                <View style={styles.suggestionIconBox}>
                  <Icon
                    name={item.icon || 'map-pin'}
                    size={16}
                    color={COLORS.textLight}
                  />
                </View>
                <View style={styles.suggestionTextCol}>
                  <Text numberOfLines={1} style={styles.suggestionTitle}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.suggestionAddress}>
                    {item.address}
                  </Text>
                </View>
                <Icon name="chevron-right" size={16} color={COLORS.iconLight} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      {/* Promotional / Savings Banner */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('DestinationSearch')}
        style={styles.promoBanner}
      >
        <View style={styles.promoIconCircle}>
          <Icon name="gift" size={18} color={COLORS.secondPrimary} />
        </View>
        <View style={styles.promoTextCol}>
          <View style={styles.promoTagRow}>
            <Text style={styles.promoTag}>SPECIAL OFFER</Text>
            <Text style={styles.promoCodeBadge}>MOTO20</Text>
          </View>
          <Text style={styles.promoTitle}>Get 20% OFF your next ride</Text>
          <Text style={styles.promoSubtitle}>Fast, affordable bike & cab rides</Text>
        </View>
        <Icon name="chevron-right" size={16} color={COLORS.secondPrimary} />
      </TouchableOpacity>
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

      {/* Floating Top Header */}
      <View style={[styles.topHeader, { top: Math.max(insets.top + 8, 16) }]}>
        {/* Profile Shortcut */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('RiderProfile')}
          style={styles.profileBtn}
        >
          <ProfileAvatar
            imageUri={authUser?.profile_photo}
            name={displayName}
            size={40}
          />
          <View style={styles.greetingCol}>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName} 👋
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right Header Action Controls */}
        <View style={styles.headerRightActions}>
          {/* Socket Connection Live Status */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => dispatch(connectRiderWebSocket())}
            style={[
              styles.roleBadge,
              socketConnected ? styles.roleBadgeConnected : styles.roleBadgeConnecting,
            ]}
          >
            <View
              style={[
                styles.socketDot,
                { backgroundColor: socketConnected ? COLORS.primary : '#F59E0B' },
              ]}
            />
            <Text
              style={[
                styles.roleBadgeText,
                { color: socketConnected ? COLORS.primary : '#B45309' },
              ]}
            >
              {socketConnected ? 'LIVE' : 'CONNECTING'}
            </Text>
          </TouchableOpacity>

          {/* Quick Activity / Trips History Icon Button */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Activity')}
            style={styles.headerIconBtn}
          >
            <Icon name="time" size={18} color={COLORS.text} />
          </TouchableOpacity>

    
        </View>
      </View>

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
            >
              {searchControls}
            </ScrollView>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollableBottomPane}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {searchControls}
            </ScrollView>
          )
        }
        primaryRatio={0.52}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontSize: 11,
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mapArea: {
    flex: 1,
  },
  bottomCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 8,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: SPACING.md,
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
    fontSize: 10,
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
    fontSize: 11,
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
    fontSize: 16,
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
    fontSize: 11,
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
    fontSize: 12,
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
    fontSize: 9,
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
    fontSize: 11,
    color: COLORS.textLight,
  },
  sectionHeaderLink: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeAddress: {
    fontSize: 10,
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
    fontSize: 11,
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
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  suggestionAddress: {
    fontSize: 11,
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
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  promoCodeBadge: {
    fontSize: 9,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  promoSubtitle: {
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 11,
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
    fontSize: 10,
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
});

export default RiderHomeScreen;
