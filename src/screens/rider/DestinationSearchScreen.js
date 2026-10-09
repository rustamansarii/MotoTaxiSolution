import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import LocationInput from '../../components/LocationInput';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';
import { getCurrentLocation } from '../../utils/locationService';
import {
  reverseGeocodeLocation,
  searchLocation,
  setCurrentCoords,
  setPickupLocation,
  setDropoffLocation,
  clearSearchResults,
  swapLocations,
  clearRecentSearches,
} from '../../redux/features/location/locationSlice';
import { fetchRecentDrops } from '../../redux/features/rides/ridesSlice';
import { CustomAlertPopup } from '../../components/CustomAlertPopup';
import { isGuestMode } from '../../utils/storage';

export const DestinationSearchScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, insets } = useResponsive();
  const dispatch = useDispatch();

  // Redux state
  const {
    currentCoords,
    currentAddress,
    isCurrentLocationLoading,
    searchResults,
    isSearching,
    pickupLocation,
    dropoffLocation,
  } = useSelector((state) => state.location);
  const { recentDrops = [], isLoadingRecentDrops = false } = useSelector(
    (state) => state.rides || {}
  );
  const authRiderProfile = useSelector((state) => state.auth?.riderProfile);
  const authUser = useSelector((state) => state.auth?.user);

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

  const userSavedPlaces = useMemo(() => {
    const list = [];
    const prof = authRiderProfile || authUser?.rider_profile;
    if (prof?.home_address) {
      const hLat = prof.home_lat !== undefined && prof.home_lat !== null ? Number(prof.home_lat) : undefined;
      const hLng =
        prof.home_lng !== undefined && prof.home_lng !== null
          ? Number(prof.home_lng)
          : prof.home_lon !== undefined && prof.home_lon !== null
          ? Number(prof.home_lon)
          : undefined;
      list.push({
        id: 'user_saved_home',
        title: t('rider.home', 'Home'),
        address: prof.home_address,
        display_name: prof.home_address,
        latitude: hLat,
        longitude: hLng,
        lat: hLat,
        lon: hLng,
        icon: 'home',
      });
    }
    if (prof?.work_address) {
      const wLat = prof.work_lat !== undefined && prof.work_lat !== null ? Number(prof.work_lat) : undefined;
      const wLng =
        prof.work_lng !== undefined && prof.work_lng !== null
          ? Number(prof.work_lng)
          : prof.work_lon !== undefined && prof.work_lon !== null
          ? Number(prof.work_lon)
          : undefined;
      list.push({
        id: 'user_saved_work',
        title: t('rider.work', 'Work / Office'),
        address: prof.work_address,
        display_name: prof.work_address,
        latitude: wLat,
        longitude: wLng,
        lat: wLat,
        lon: wLng,
        icon: 'briefcase',
      });
    }
    return list;
  }, [authRiderProfile, authUser?.rider_profile, t]);

  // Field actively being edited ('pickup' | 'destination')
  const [activeField, setActiveField] = useState('destination');

  // Hold the full selected dropoff object locally (no auto navigation)
  const [selectedDropoff, setSelectedDropoff] = useState(dropoffLocation || null);

  const [pickup, setPickup] = useState(
    route?.params?.pickup || route?.params?.initialPickup || pickupLocation?.address || ''
  );
  const [destination, setDestination] = useState(
    route?.params?.destination ||
      route?.params?.initialDestination ||
      dropoffLocation?.address ||
      ''
  );

  const [userTypedPickup, setUserTypedPickup] = useState(false);
  const [userTypedDestination, setUserTypedDestination] = useState(false);
  const hasUserEditedPickup = useRef(false);

  const searchTimeoutRef = useRef(null);

  const pickupRef = useRef(pickup);
  useEffect(() => {
    pickupRef.current = pickup;
  }, [pickup]);

  // Clear any stale local search cache and fetch recent drops from API on mount
  useEffect(() => {
    dispatch(clearRecentSearches());
    dispatch(fetchRecentDrops());
  }, [dispatch]);

  // Pre-fetch live GPS on mount and reverse geocode via backend API
  useEffect(() => {
    getCurrentLocation()
      .then(async (loc) => {
        if (loc?.latitude && loc?.longitude) {
          dispatch(setCurrentCoords({ latitude: loc.latitude, longitude: loc.longitude }));
          try {
            const res = await dispatch(
              reverseGeocodeLocation({ latitude: loc.latitude, longitude: loc.longitude })
            ).unwrap();
            if (res?.display_name && !hasUserEditedPickup.current && !pickupRef.current) {
              setPickup(res.display_name);
            }
          } catch (e) {
            console.warn('[DestinationSearch] Reverse geocoding failed:', e);
          }
        }
      })
      .catch((err) => {
        console.warn('[DestinationSearch] GPS pre-fetch failed:', err);
      });

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [dispatch]);

  // Update pickup text if currentAddress updates and pickup was not manually filled
  useEffect(() => {
    if (currentAddress?.display_name && !hasUserEditedPickup.current && !pickup) {
      setPickup(currentAddress.display_name);
    }
  }, [currentAddress]);

  // Formatted Recent Drops from API GET /api/v1/rides/recent-drops/
  const formattedRecentDrops = useMemo(() => {
    if (!recentDrops || recentDrops.length === 0) {
      return [];
    }

    const savedAddresses = new Set(
      userSavedPlaces
        .map((p) => (p.address || p.display_name || '').trim().toLowerCase())
        .filter(Boolean)
    );

    const seenAddresses = new Set();

    return recentDrops
      .filter((item) => {
        if (!item || !item.address) return false;
        const addr = String(item.address).trim().toLowerCase();
        if (savedAddresses.has(addr)) return false;
        if (seenAddresses.has(addr)) return false;
        seenAddresses.add(addr);
        return true;
      })
      .map((item, idx) => {
        const addr = item.address || '';
        const title = addr.split(',')[0].trim() || 'Recent Drop';
        const lat =
          item.lat !== undefined && item.lat !== null ? Number(item.lat) : undefined;
        const lon =
          item.lon !== undefined && item.lon !== null ? Number(item.lon) : undefined;

        return {
          id: `recent_drop_${item.ride_id || idx}`,
          ride_id: item.ride_id,
          title,
          address: addr,
          display_name: addr,
          latitude: lat,
          longitude: lon,
          lat,
          lon,
          icon: 'clock',
          last_used: item.last_used,
          isRecentDrop: true,
        };
      });
  }, [recentDrops, userSavedPlaces]);



  const handlePickupPress = () => {
    setActiveField('pickup');
    if (!userTypedPickup) {
      dispatch(clearSearchResults());
    }
  };

  const handleDestinationPress = () => {
    setActiveField('destination');
    if (!userTypedDestination) {
      dispatch(clearSearchResults());
    }
  };

  // Handle clicking the Live Location button
  const handleUseLiveLocation = async () => {
    hasUserEditedPickup.current = false;
    setUserTypedPickup(false);
    if (currentAddress?.display_name) {
      setPickup(currentAddress.display_name);
      dispatch(setPickupLocation(currentAddress));
      setActiveField('destination');
      return;
    }

    try {
      const loc = await getCurrentLocation();
      if (loc?.latitude && loc?.longitude) {
        dispatch(setCurrentCoords({ latitude: loc.latitude, longitude: loc.longitude }));
        const res = await dispatch(
          reverseGeocodeLocation({ latitude: loc.latitude, longitude: loc.longitude })
        ).unwrap();
        if (res?.display_name) {
          setPickup(res.display_name);
          dispatch(setPickupLocation(res));
          setActiveField('destination');
        }
      }
    } catch (err) {
      console.warn('[DestinationSearch] Failed to get live location:', err);
      const fallback = 'Current Location (GPS)';
      setPickup(fallback);
    }
  };

  // Debounced search for Pickup
  const handlePickupChange = (text) => {
    hasUserEditedPickup.current = true;
    setPickup(text);
    setActiveField('pickup');

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = text.trim();
    if (trimmed.length >= 2) {
      setUserTypedPickup(true);
      searchTimeoutRef.current = setTimeout(() => {
        dispatch(searchLocation({ query: trimmed }));
      }, 350);
    } else {
      setUserTypedPickup(false);
      dispatch(clearSearchResults());
    }
  };

  // Debounced search for Destination with reference lat/lon for distance calculation
  const handleDestinationChange = (text) => {
    setDestination(text);
    setActiveField('destination');

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = text.trim();
    if (trimmed.length >= 2) {
      setUserTypedDestination(true);
      searchTimeoutRef.current = setTimeout(() => {
        const params = { query: trimmed };
        // Reference coordinates for distance calculation
        const refLat = pickupLocation?.latitude || currentCoords?.latitude;
        const refLon = pickupLocation?.longitude || currentCoords?.longitude;
        if (refLat && refLon) {
          params.lat = refLat;
          params.lon = refLon;
        }
        dispatch(searchLocation(params));
      }, 350);
    } else {
      setUserTypedDestination(false);
      dispatch(clearSearchResults());
    }
  };

  // Swap pickup & destination
  const handleSwap = () => {
    hasUserEditedPickup.current = true;
    const tempPickup = pickup;
    setPickup(destination);
    setDestination(tempPickup);
    setUserTypedPickup(false);
    setUserTypedDestination(false);
    dispatch(swapLocations());
    dispatch(clearSearchResults());
  };

  // Handle selecting an address suggestion or search result
  // No auto navigation; just store selection
  const handleSelectLocation = (loc) => {
    const selectedAddress = loc.address || loc.display_name || loc.title;

    if (activeField === 'pickup') {
      hasUserEditedPickup.current = true;
      setPickup(selectedAddress);
      setUserTypedPickup(false);
      dispatch(setPickupLocation(loc));
      dispatch(clearSearchResults());
      setActiveField('destination');
    } else {
      if (isGuest) {
        setGuestLoginModal({
          visible: true,
          title: t('auth.loginRequired', 'Login Required'),
          message: t(
            'auth.loginRequiredDropoffMsg',
            'Please log in first to choose a drop-off location and book a ride.'
          ),
        });
        return;
      }
      setDestination(selectedAddress);
      setUserTypedDestination(false);
      setSelectedDropoff(loc);
      dispatch(setDropoffLocation(loc));
      dispatch(clearSearchResults());
    }
  };

  // Highlight Live Location row based on the active field
  const isLiveSelected = Boolean(
    (activeField === 'pickup' &&
      ((currentAddress?.display_name && pickup === currentAddress.display_name) ||
        pickup === 'Current Location (GPS)')) ||
      (activeField === 'destination' &&
        ((currentAddress?.display_name && destination === currentAddress.display_name) ||
          destination === 'Current Location (GPS)'))
  );

  const isQueryActive =
    activeField === 'pickup'
      ? userTypedPickup && pickup.trim().length >= 2
      : userTypedDestination && destination.trim().length >= 2;

  // Decide what data list to render
  const listData = useMemo(() => {
    if (isQueryActive) {
      const seen = new Set();
      return (searchResults || []).filter((item, index) => {
        const key = item.id ? String(item.id) : (item.place_id ? String(item.place_id) : `search_${index}`);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    const combined = [...userSavedPlaces, ...formattedRecentDrops];
    const seen = new Set();
    return combined.filter((item, index) => {
      const key = item.id ? String(item.id) : `item_${index}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [isQueryActive, searchResults, userSavedPlaces, formattedRecentDrops]);

  // Continue enabled only when both pickup + destination are chosen (and not guest)
  const canContinue = useMemo(() => {
    const hasPickup = Boolean(pickup && pickup.trim().length > 0);
    const hasDropoff = Boolean(
      (selectedDropoff || dropoffLocation) &&
        destination &&
        destination.trim().length > 0
    );
    return hasPickup && hasDropoff && !isGuest;
  }, [pickup, destination, selectedDropoff, dropoffLocation, isGuest]);

  // Navigation moved into Continue handler
  const handleContinue = () => {
    if (!canContinue) return;

    const loc = selectedDropoff || dropoffLocation;
    const selectedAddress = loc?.address || loc?.display_name || destination;

    const activePickup = pickup || currentAddress?.display_name || 'Current Location';
    const activePickupData =
      pickupLocation || (currentCoords ? { ...currentAddress, ...currentCoords } : null);

    const pLat =
      pickupLocation?.latitude ??
      pickupLocation?.lat ??
      currentCoords?.latitude ??
      30.6948;
    const pLon =
      pickupLocation?.longitude ??
      pickupLocation?.lon ??
      currentCoords?.longitude ??
      76.7834;
    const dLat = loc?.latitude ?? loc?.lat ?? 30.7055;
    const dLon = loc?.longitude ?? loc?.lon ?? 76.8013;

    navigation.navigate('RideOptions', {
      pickup: activePickup,
      pickupData: activePickupData,
      destination: selectedAddress,
      destinationData: loc,
      pickup_lat: pLat,
      pickup_lon: pLon,
      drop_lat: dLat,
      drop_lon: dLon,
    });
  };

  // Helper: check if a list item is currently selected (active)
  const isItemSelected = (item) => {
    if (!item) return false;

    const target =
      activeField === 'pickup'
        ? pickupLocation
        : selectedDropoff || dropoffLocation;

    if (!target) return false;

    // Match by id first
    if (item.id && target.id && String(item.id) === String(target.id)) {
      return true;
    }

    // Fallback: match by address / display_name (case-insensitive)
    const itemAddr = (item.address || item.display_name || '').trim().toLowerCase();
    const targetAddr = (target.address || target.display_name || '')
      .trim()
      .toLowerCase();
    if (itemAddr && targetAddr && itemAddr === targetAddr) return true;

    return false;
  };

  const renderDestinationItem = ({ item }) => {
    const isSelected = isItemSelected(item);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleSelectLocation(item)}
        style={[styles.resultItem, isSelected && styles.resultItemSelected]}
      >
        <View
          style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}
        >
          <Icon
            name={item.icon || (item.distance_km ? 'navigation' : 'map-pin')}
            size={18}
            color={isSelected ? COLORS.white : COLORS.secondPrimary}
          />
        </View>
        <View style={styles.resultDetails}>
          <Text
            numberOfLines={1}
            style={[styles.resultTitle, isSelected && { color: COLORS.primary }]}
          >
            {item.title || item.city || item.display_name?.split(',')[0] || item.address?.split(',')[0] || 'Recent Place'}
          </Text>
          <Text numberOfLines={1} style={styles.resultAddress}>
            {item.address || item.display_name}
          </Text>
        </View>

        {/* SELECTED → GREEN TICK */}
        {isSelected ? (
          <View style={styles.selectedTickCircle}>
            <Icon name="check" size={14} color={COLORS.white} />
          </View>
        ) : item.distance ? (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceBadgeText}>{item.distance}</Text>
          </View>
        ) : item.estTime ? (
          <View style={styles.timeDistanceBadge}>
            <Text style={styles.estTimeText}>{item.estTime}</Text>
            {item.distance ? <Text style={styles.estDistText}>{item.distance}</Text> : null}
          </View>
        ) : (
          <Icon name="chevron-right" size={16} color={COLORS.iconLight} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={680} style={{ flex: 1 }}>
        <Header
          title={
            activeField === 'pickup'
              ? t('rider.pickupLocation', 'Choose Pickup')
              : t('rider.dropoffLocation', 'Choose Destination')
          }
          onBack={() => navigation.goBack()}
        />

        {/* Dual Inputs */}
        <View style={styles.inputContainer}>
          <LocationInput
            pickupValue={pickup}
            destinationValue={destination}
            onPickupChange={handlePickupChange}
            onDestinationChange={handleDestinationChange}
            onPickupPress={handlePickupPress}
            onDestinationPress={handleDestinationPress}
            onSwap={handleSwap}
            pickupPlaceholder={t('rider.pickupLocation', 'Pickup address')}
            destinationPlaceholder={t('rider.whereTo', 'Where are you going?')}
          />
        </View>

        {/* Dynamic List Section */}
        <View style={styles.listSection}>
          {isQueryActive || listData.length > 0 ? (
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>
                {isQueryActive
                  ? t('rider.searchResults', 'Search Results')
                  : activeField === 'pickup'
                  ? t('rider.recentPickups', 'Recent & Saved Pickups')
                  : t('rider.recentPlaces', 'Saved & Recent Places')}
              </Text>
              {(isSearching || isLoadingRecentDrops) && (
                <ActivityIndicator size="small" color={COLORS.primary} style={styles.headerSpinner} />
              )}
            </View>
          ) : null}

          <FlatList
            ListHeaderComponent={
              !isQueryActive ? (
                <View>
                  {/* Live Location Row */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleUseLiveLocation}
                    style={[
                      styles.liveLocationItem,
                      isLiveSelected && styles.liveLocationItemSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.liveIconCircle,
                        isLiveSelected && styles.liveIconCircleSelected,
                      ]}
                    >
                      {isCurrentLocationLoading ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      ) : (
                        <Icon
                          name="crosshairs"
                          size={20}
                          color={isLiveSelected ? COLORS.white : COLORS.primary}
                        />
                      )}
                    </View>

                    <View style={styles.resultDetails}>
                      <View style={styles.liveTitleRow}>
                        <Text
                          style={[
                            styles.resultTitle,
                            { color: COLORS.primary, fontWeight: '700' },
                          ]}
                        >
                          {t('rider.useLiveLocation', 'Current / Live Location')}
                        </Text>
                        <View style={styles.liveBadge}>
                          <View style={styles.livePulseDot} />
                          <Text style={styles.liveBadgeText}>LIVE GPS</Text>
                        </View>
                      </View>

                      <Text numberOfLines={1} style={styles.resultAddress}>
                        {currentAddress?.display_name ||
                          (isCurrentLocationLoading
                            ? t(
                                'rider.detectingLocation',
                                'Detecting exact GPS address...'
                              )
                            : t(
                                'rider.tapToAutoFill',
                                'Tap to auto-fill pickup with your exact GPS location'
                              ))}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.autoFillBadge,
                        isLiveSelected && styles.autoFillBadgeSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.autoFillBadgeText,
                          isLiveSelected && styles.autoFillBadgeTextSelected,
                        ]}
                      >
                        {isLiveSelected ? 'Selected' : 'Use GPS'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.separator} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              isSearching ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.emptyText}>
                    {t('common.searching', 'Searching locations...')}
                  </Text>
                </View>
              ) : isQueryActive ? (
                <View style={styles.emptyContainer}>
                  <Icon name="map-pin" size={28} color={COLORS.textLight} />
                  <Text style={styles.emptyText}>
                    {t('rider.noLocationsFound', 'No locations found')}
                  </Text>
                  <Text style={styles.emptySubText}>
                    {t('rider.tryDifferentSearch', 'Check the spelling or try searching another city')}
                  </Text>
                </View>
              ) : null
            }
            data={listData}
            keyExtractor={(item, index) => (item.id ? `${item.id}_${index}` : `loc_${index}`)}
            renderItem={renderDestinationItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        </View>

        {/* Continue Button Bar */}
        <View
          style={[
            styles.continueBar,
            { paddingBottom: (insets?.bottom || 0) + SPACING.md },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!canContinue}
            onPress={handleContinue}
            style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          >
            <Text
              style={[
                styles.continueBtnText,
                !canContinue && styles.continueBtnTextDisabled,
              ]}
            >
              {t('common.continue', 'Continue')}
            </Text>
            <Icon
              name="arrow-right"
              size={18}
              color={canContinue ? COLORS.white : COLORS.textLight}
            />
          </TouchableOpacity>
        </View>
      </ResponsiveContainer>

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
    backgroundColor: COLORS.background,
  },
  inputContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  listSection: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerSpinner: {
    marginLeft: SPACING.sm,
  },
  listContent: {
    paddingBottom: SPACING.xxxl,
  },
  liveLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#F0FDF4',
  },
  liveLocationItemSelected: {
    backgroundColor: '#E6F9F5',
  },
  liveIconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: 'rgba(23, 186, 161, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  liveIconCircleSelected: {
    backgroundColor: COLORS.primary,
  },
  liveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 186, 161, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    marginLeft: 8,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 4,
  },
  liveBadgeText: {
    fontSize: responsiveFont(9),
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  autoFillBadge: {
    backgroundColor: 'rgba(23, 186, 161, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    marginLeft: SPACING.sm,
  },
  autoFillBadgeSelected: {
    backgroundColor: COLORS.primary,
  },
  autoFillBadgeText: {
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: COLORS.primary,
  },
  autoFillBadgeTextSelected: {
    color: COLORS.white,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  // Active / selected row background
  resultItemSelected: {
    backgroundColor: 'rgba(23, 186, 161, 0.08)',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  // Filled icon circle when selected
  iconCircleSelected: {
    backgroundColor: COLORS.primary,
  },
  resultDetails: {
    flex: 1,
  },
  resultTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  resultAddress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  // NEW: green tick circle for the selected item
  selectedTickCircle: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  distanceBadge: {
    backgroundColor: 'rgba(23, 186, 161, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    marginLeft: SPACING.sm,
  },
  distanceBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
  },
  timeDistanceBadge: {
    alignItems: 'flex-end',
  },
  estTimeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimary,
  },
  estDistText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    color: COLORS.textLight,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 68,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  emptySubText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },

  // Continue Button Bar
  continueBar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius:10,
    
  },
  continueBtnDisabled: {
    backgroundColor: COLORS.inputBg,
  },
  continueBtnText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.white,
    marginRight: 6,
  },
  continueBtnTextDisabled: {
    color: COLORS.textLight,
  },
});

export default DestinationSearchScreen;