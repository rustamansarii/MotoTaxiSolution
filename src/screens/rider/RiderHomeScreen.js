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
import { CURRENT_LOCATION, SAVED_PLACES } from '../../data/mockLocations';
import { useResponsive } from '../../utils/responsive';
import AdaptiveSplitView from '../../components/AdaptiveSplitView';
import { useTranslation } from 'react-i18next';
import {
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
} from '../../utils/locationService';
import { fetchRiderProfile } from '../../redux/features/auth/authSlice';
import { connectRiderWebSocket } from '../../redux/features/rider/riderSlice';

export const RiderHomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isSplitLayout, insets } = useResponsive();
  const dispatch = useDispatch();

  const { riderProfile, user: authUser } = useSelector((state) => state.auth);
  const { socketConnected } = useSelector((state) => state.rider);

  // User GPS coordinates [longitude, latitude]
  const [userLocation, setUserLocation] = useState([
    CURRENT_LOCATION.longitude || 75.8573,
    CURRENT_LOCATION.latitude || 30.9005,
  ]);
  const [locationLabel, setLocationLabel] = useState(
    CURRENT_LOCATION.shortAddress || 'My Location'
  );

  // Connect to Rider WebSocket (ws/rider/?token=...) on mount
  useEffect(() => {
    dispatch(connectRiderWebSocket());
  }, [dispatch]);

  // Fetch real GPS location on mount
  useEffect(() => {
    let watchId = null;

    const fetchGps = async () => {
      try {
        const loc = await getCurrentLocation();
        if (loc?.latitude && loc?.longitude) {
          setUserLocation([loc.longitude, loc.latitude]);
          setLocationLabel('Current Location');
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
  }, []);

  // Fetch rider profile (Home & Work saved places) on mount
  useEffect(() => {
    dispatch(fetchRiderProfile());
  }, [dispatch]);

  // Compute nearby dynamic drivers around current GPS location
  const nearbyDrivers = useMemo(() => {
    if (!userLocation) return [];
    const [lng, lat] = userLocation;
    return [
      { id: 'd1', coordinate: [lng + 0.0032, lat + 0.0018], heading: 45, eta: '2 min' },
      { id: 'd2', coordinate: [lng - 0.0028, lat + 0.0035], heading: 135, eta: '4 min' },
      { id: 'd3', coordinate: [lng + 0.0021, lat - 0.0031], heading: 220, eta: '5 min' },
    ];
  }, [userLocation]);

  const handleRecenterLocation = useCallback(async () => {
    try {
      const loc = await getCurrentLocation();
      if (loc?.latitude && loc?.longitude) {
        setUserLocation([loc.longitude, loc.latitude]);
      }
    } catch (err) {
      console.warn('[RiderHome] Recenter error:', err);
    }
  }, []);

  const searchControls = (
    <View style={[styles.bottomCard, isSplitLayout && styles.sideCard]}>
      {/* Search Bar Trigger */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('DestinationSearch')}
        style={styles.searchBar}
      >
        <View style={styles.searchIconBox}>
          <Icon name="search" size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.searchPlaceholder}>
          {t('rider.whereTo', 'Where to?')}
        </Text>
        <View style={styles.timeBadge}>
          <Icon name="clock" size={12} color={COLORS.text} />
          <Text style={styles.timeText}>Now ⌄</Text>
        </View>
      </TouchableOpacity>

      {/* Saved Places */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.savedPlacesRow}
      >
        {/* Home Place Card */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() =>
            navigation.navigate('SavedPlaces', { initialFocus: 'home' })
          }
          style={[
            styles.placePill,
            riderProfile?.home_address ? styles.placePillConfigured : null,
          ]}
        >
          <View style={[styles.placeIconCircle, { backgroundColor: COLORS.primaryLight }]}>
            <Icon
              name="home"
              size={15}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.placeTextCol}>
            <View style={styles.placeTitleRow}>
              <Text style={styles.placeTitle}>Home</Text>
              <Icon
                name={riderProfile?.home_address ? "pencil" : "plus"}
                size={11}
                color={COLORS.primary}
                style={{ marginLeft: 4 }}
              />
            </View>
            <Text numberOfLines={1} style={styles.placeAddress}>
              {riderProfile?.home_address || 'Tap to set address'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Work / Office Place Card */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() =>
            navigation.navigate('SavedPlaces', { initialFocus: 'work' })
          }
          style={[
            styles.placePill,
            riderProfile?.work_address ? styles.placePillConfigured : null,
          ]}
        >
          <View style={[styles.placeIconCircle, { backgroundColor: COLORS.secondPrimaryLight }]}>
            <Icon
              name="briefcase"
              size={15}
              color={COLORS.secondPrimary}
            />
          </View>
          <View style={styles.placeTextCol}>
            <View style={styles.placeTitleRow}>
              <Text style={styles.placeTitle}>Work</Text>
              <Icon
                name={riderProfile?.work_address ? "pencil" : "plus"}
                size={11}
                color={COLORS.secondPrimary}
                style={{ marginLeft: 4 }}
              />
            </View>
            <Text numberOfLines={1} style={styles.placeAddress}>
              {riderProfile?.work_address || 'Tap to set address'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Manage / Add More Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('SavedPlaces', { initialFocus: 'home' })}
          style={styles.managePlacesPill}
        >
          <Icon name="settings" size={13} color={COLORS.primary} />
          <Text style={styles.managePlacesText}>Manage</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Promotion Highlight Banner */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('DestinationSearch')}
        style={styles.promoBanner}
      >
        <View style={styles.promoIconCircle}>
          <Icon name="tag" size={18} color={COLORS.white} />
        </View>
        <View style={styles.promoTextCol}>
          <Text style={styles.promoTitle}>20% Off Eco-Friendly Rides</Text>
          <Text style={styles.promoSubtitle}>
            Ride electric today & reduce your carbon footprint.
          </Text>
        </View>
        <Icon name="chevron-right" size={18} color={COLORS.white} />
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
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('RiderProfile')}
          style={styles.profileBtn}
        >
          <ProfileAvatar
            imageUri={authUser?.profile_photo}
            name={authUser?.first_name || 'Rider'}
            size={38}
          />
          <View style={styles.greetingCol}>
            <Text style={styles.greetingText}>
              {t('rider.goodMorning', 'Hello')},
            </Text>
            <Text style={styles.userName} numberOfLines={1}>
              {authUser?.first_name || 'Rider'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Live Socket Connection Badge */}
        <View style={styles.roleBadge}>
          <View
            style={[
              styles.socketDot,
              { backgroundColor: socketConnected ? COLORS.primary : '#F59E0B' },
            ]}
          />
          <Text style={styles.roleBadgeText}>
            {socketConnected ? 'LIVE' : 'CONNECTING'}
          </Text>
        </View>
      </View>
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
              bounces={false}
            >
              {searchControls}
            </ScrollView>
          )
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
  sideCard: {
    backgroundColor: COLORS.white,
    height: '100%',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
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
    top: 50,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.extraLarge,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingCol: {
    marginLeft: SPACING.sm,
  },
  greetingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  userName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
  },
  socketDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 4,
  },
  roleBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondPrimary,
    marginLeft: 2,
  },
  mapArea: {
    flex: 1,
  },
  bottomCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.extraLarge,
    borderTopRightRadius: RADIUS.extraLarge,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  searchBar: {
    height: 54,
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.large,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  searchIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  searchPlaceholder: {
    ...TYPOGRAPHY.title,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  savedPlacesRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  placePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.medium,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 180,
  },
  placeIconCircle: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  placeTextCol: {
    flex: 1,
  },
  placeTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeAddress: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.textLight,
  },
  placePillConfigured: {
    borderColor: COLORS.primaryLight,
    backgroundColor: '#FAFCFB',
  },
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  managePlacesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 4,
  },
  managePlacesText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: 11,
  },
  promoBanner: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  promoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.secondPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  promoTextCol: {
    flex: 1,
  },
  promoTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  promoSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
});

export default RiderHomeScreen;
