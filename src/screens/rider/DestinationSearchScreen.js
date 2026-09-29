import React, { useState, useEffect, useRef } from 'react';
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
import { useResponsive } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';
import {
  CURRENT_LOCATION,
  POPULAR_DESTINATIONS,
  SAVED_PLACES,
} from '../../data/mockLocations';
import { getCurrentLocation } from '../../utils/locationService';
import {
  reverseGeocodeLocation,
  searchLocation,
  setCurrentCoords,
  setPickupLocation,
  setDropoffLocation,
  clearSearchResults,
  swapLocations,
} from '../../redux/features/location/locationSlice';

export const DestinationSearchScreen = ({ navigation }) => {
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
    recentSearches,
  } = useSelector((state) => state.location);

  // Field actively being edited ('pickup' | 'destination')
  const [activeField, setActiveField] = useState('destination');
  const [pickup, setPickup] = useState(pickupLocation?.address || '');
  const [destination, setDestination] = useState(dropoffLocation?.address || '');

  const searchTimeoutRef = useRef(null);

  const pickupRef = useRef(pickup);
  useEffect(() => {
    pickupRef.current = pickup;
  }, [pickup]);

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
            if (res?.display_name && !pickupRef.current) {
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
    if (currentAddress?.display_name && !pickupRef.current) {
      setPickup(currentAddress.display_name);
    }
  }, [currentAddress]);

  // Handle clicking the Live Location button
  const handleUseLiveLocation = async () => {
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
    setPickup(text);
    setActiveField('pickup');

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = text.trim();
    if (trimmed.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        dispatch(searchLocation({ query: trimmed }));
      }, 350);
    } else {
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
      dispatch(clearSearchResults());
    }
  };

  // Swap pickup & destination
  const handleSwap = () => {
    const tempPickup = pickup;
    setPickup(destination);
    setDestination(tempPickup);
    dispatch(swapLocations());
    dispatch(clearSearchResults());
  };

  // Handle selecting an address suggestion or search result
  const handleSelectLocation = (loc) => {
    const selectedAddress = loc.address || loc.display_name || loc.title;

    if (activeField === 'pickup') {
      setPickup(selectedAddress);
      dispatch(setPickupLocation(loc));
      dispatch(clearSearchResults());
      setActiveField('destination');
    } else {
      setDestination(selectedAddress);
      dispatch(setDropoffLocation(loc));
      dispatch(clearSearchResults());

      const activePickup = pickup || currentAddress?.display_name || CURRENT_LOCATION.address;
      const activePickupData =
        pickupLocation || (currentCoords ? { ...currentAddress, ...currentCoords } : CURRENT_LOCATION);

      const pLat =
        pickupLocation?.latitude ??
        pickupLocation?.lat ??
        currentCoords?.latitude ??
        CURRENT_LOCATION.latitude;
      const pLon =
        pickupLocation?.longitude ??
        pickupLocation?.lon ??
        currentCoords?.longitude ??
        CURRENT_LOCATION.longitude;
      const dLat = loc?.latitude ?? loc?.lat;
      const dLon = loc?.longitude ?? loc?.lon;

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
    }
  };

  const isLiveSelected = Boolean(
    (currentAddress?.display_name && pickup === currentAddress.display_name) ||
    pickup === 'Current Location (GPS)'
  );

  const activeQuery = (activeField === 'pickup' ? pickup : destination).trim();
  const isQueryActive = activeQuery.length >= 2;

  // Decide what data list to render
  const listData = isQueryActive
    ? searchResults
    : [
        ...(recentSearches || []).map((s) => ({ ...s, icon: 'clock' })),
        ...SAVED_PLACES,
        ...POPULAR_DESTINATIONS,
      ];

  const renderDestinationItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleSelectLocation(item)}
      style={styles.resultItem}
    >
      <View style={styles.iconCircle}>
        <Icon
          name={item.icon || (item.distance_km ? 'navigation' : 'map-pin')}
          size={18}
          color={COLORS.secondPrimary}
        />
      </View>
      <View style={styles.resultDetails}>
        <Text numberOfLines={1} style={styles.resultTitle}>
          {item.title || item.city || item.display_name?.split(',')[0]}
        </Text>
        <Text numberOfLines={1} style={styles.resultAddress}>
          {item.address || item.display_name}
        </Text>
      </View>

      {item.distance ? (
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ResponsiveContainer maxWidth={680} style={{ flex: 1 }}>
        <Header
          title={t('rider.dropoffLocation', 'Choose Destination')}
          onBack={() => navigation.goBack()}
        />

        {/* Dual Inputs */}
        <View style={styles.inputContainer}>
          <LocationInput
            pickupValue={pickup}
            destinationValue={destination}
            onPickupChange={handlePickupChange}
            onDestinationChange={handleDestinationChange}
            onPickupPress={() => setActiveField('pickup')}
            onDestinationPress={() => setActiveField('destination')}
            onSwap={handleSwap}
            pickupPlaceholder={t('rider.pickupLocation', 'Pickup address')}
            destinationPlaceholder={t('rider.whereTo', 'Where are you going?')}
          />
        </View>

        {/* Set on map button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('PickupLocation')}
          style={styles.setPinBtn}
        >
          <View style={styles.pinIconCircle}>
            <Icon name="map-pin" size={16} color={COLORS.primary} />
          </View>
          <Text style={styles.setPinText}>
            {t('rider.setPinOnMap', 'Set location on map')}
          </Text>
          <Icon name="chevron-right" size={16} color={COLORS.textLight} />
        </TouchableOpacity>

        {/* Dynamic List Section */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>
              {isQueryActive
                ? t('rider.searchResults', 'Search Results')
                : t('rider.recentPlaces', 'Saved & Popular Destinations')}
            </Text>
            {isSearching && (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.headerSpinner} />
            )}
          </View>

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
            keyExtractor={(item, index) => (item.id ? String(item.id) : `loc_${index}`)}
            renderItem={renderDestinationItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </ResponsiveContainer>
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
  setPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  pinIconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  setPinText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
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
    fontSize: 9,
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
    fontSize: 11,
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
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
    fontSize: 10,
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
});

export default DestinationSearchScreen;
